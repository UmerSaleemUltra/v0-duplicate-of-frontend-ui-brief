import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { put } from "@vercel/blob"
import { blobConfig } from "@/config/blob"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader.replace("Bearer ", ""))
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const addonId = formData.get("addonId") as string
    const companyId = formData.get("companyId") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const receiptFile = formData.get("receiptFile") as File | null

    // Validate required fields
    if (!addonId || !companyId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: addonId, companyId" },
        { status: 400 },
      )
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(addonId) || !ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid addon ID or company ID format" },
        { status: 400 },
      )
    }

    // At least one payment detail required
    if (!phoneNumber && !receiptFile) {
      return NextResponse.json(
        { success: false, error: "Please provide either phone number or receipt file" },
        { status: 400 },
      )
    }

    const { db } = await connectDB()

    // Verify addon exists
    const addon = await db.collection("addons").findOne({ _id: new ObjectId(addonId) })
    if (!addon) {
      return NextResponse.json({ success: false, error: "Addon not found" }, { status: 404 })
    }

    // Verify company exists and belongs to user
    let company = await db.collection("companies").findOne({
      _id: new ObjectId(companyId),
      userId: new ObjectId(decoded.userId),
    })

    // If not found with userId as ObjectId, try with userId as string
    if (!company) {
      company = await db.collection("companies").findOne({
        _id: new ObjectId(companyId),
        userId: decoded.userId,
      })
    }

    // If still not found, try without userId check (for debugging)
    if (!company) {
      company = await db.collection("companies").findOne({
        _id: new ObjectId(companyId),
      })

      // If company exists but userId doesn't match, deny access
      if (company && company.userId) {
        const companyUserId = company.userId instanceof ObjectId ? company.userId.toString() : company.userId
        const decodedUserId = decoded.userId instanceof ObjectId ? decoded.userId.toString() : decoded.userId
        if (companyUserId !== decodedUserId) {
          return NextResponse.json(
            { success: false, error: "Company not found or unauthorized access" },
            { status: 404 },
          )
        }
      }
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found or unauthorized access" },
        { status: 404 },
      )
    }

    let receiptUrl: string | null = null

    // Upload receipt file if provided
    if (receiptFile) {
      try {
        const buffer = await receiptFile.arrayBuffer()
        const filename = `receipts/${companyId}/${addonId}/${Date.now()}-${receiptFile.name}`

        const blob = await put(filename, buffer, {
          access: "public",
          contentType: receiptFile.type,
          token: blobConfig.token,
        })

        receiptUrl = blob.url
      } catch (uploadError) {
        console.error("[v0] Failed to upload receipt file:", uploadError)
        return NextResponse.json(
          { success: false, error: "Failed to upload receipt file" },
          { status: 500 },
        )
      }
    }

    // Create WhatsApp payment record
    const paymentRecord = {
      _id: new ObjectId(),
      addonId: new ObjectId(addonId),
      companyId: new ObjectId(companyId),
      userId: new ObjectId(decoded.userId),
      phoneNumber: phoneNumber || null,
      receiptUrl: receiptUrl,
      receiptFileName: receiptFile?.name || null,
      paymentMethod: "whatsapp",
      status: "pending_verification",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save payment record
    const paymentResult = await db.collection("whatsapp_payments").insertOne(paymentRecord)

    // Also save to company orders if needed
    const existingOrder = company.orders?.[0]
    if (existingOrder) {
      await db.collection("companies").updateOne(
        { _id: new ObjectId(companyId) },
        {
          $set: {
            "orders.0.purchasedAddons": [
              ...(existingOrder.purchasedAddons || []),
              {
                serviceId: addon._id.toString(),
                name: addon.name,
                price: addon.price,
                paymentRecordId: paymentResult.insertedId.toString(),
                paymentStatus: "pending_verification",
                purchasedAt: new Date(),
              },
            ],
          },
        },
      )
    }

    const response = NextResponse.json({
      success: true,
      message: "Payment details submitted successfully. We'll verify and process your order shortly.",
      data: {
        paymentId: paymentResult.insertedId.toString(),
        phoneNumber: phoneNumber || null,
        receiptUrl: receiptUrl,
        status: "pending_verification",
      },
    })

    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.error("[v0] API Error in POST /api/addons/purchase:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process addon purchase",
      },
      { status: 500 },
    )
  }
}
