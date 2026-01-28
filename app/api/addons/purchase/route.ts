import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { blobStorage } from "@/config/storage"

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
        const uploadResult = await blobStorage.upload(receiptFile, {
          folder: `receipts/${companyId}/${addonId}`,
          filename: receiptFile.name,
          access: "public",
        })

        receiptUrl = uploadResult.url
      } catch (uploadError) {
        console.error("[v0] Failed to upload receipt file:", uploadError)
        return NextResponse.json(
          { success: false, error: "Failed to upload receipt file" },
          { status: 500 },
        )
      }
    }

    // Save purchased addon to company's purchasedAddons array
    const newPurchasedAddon = {
      serviceId: addon._id.toString(),
      name: addon.name,
      price: addon.price,
      paymentDetails: {
        phoneNumber: phoneNumber || null,
        receiptUrl: receiptUrl,
        receiptFileName: receiptFile?.name || null,
        paymentMethod: "whatsapp",
        createdAt: new Date(),
      },
      purchasedAt: new Date(),
    }

    // Update company's purchasedAddons array at root level
    await db.collection("companies").updateOne(
      { _id: new ObjectId(companyId) },
      {
        $push: {
          purchasedAddons: newPurchasedAddon,
        },
      },
    )

    // Also save to company orders if needed
    const existingOrder = company.orders?.[0]
    if (existingOrder) {
      await db.collection("companies").updateOne(
        { _id: new ObjectId(companyId) },
        {
          $set: {
            "orders.0.purchasedAddons": [
              ...(existingOrder.purchasedAddons || []),
              newPurchasedAddon,
            ],
          },
        },
      )
    }

    // Update revenue if custom milestone is completed
    const updatedCompany = await db.collection("companies").findOne({ _id: new ObjectId(companyId) })
    let newRevenue = updatedCompany.revenue || 0

    // Calculate revenue from all purchased addons after custom milestone completion
    if (updatedCompany.customMilestones && updatedCompany.customMilestones.length > 0) {
      const completedMilestones = updatedCompany.customMilestones.filter((m: any) => m.completed)
      if (completedMilestones.length > 0) {
        newRevenue = (updatedCompany.orders?.[0]?.pricing?.total || 0) + 
          (updatedCompany.purchasedAddons || []).reduce((sum: number, addon: any) => sum + (addon.price || 0), 0)
        
        await db.collection("companies").updateOne(
          { _id: new ObjectId(companyId) },
          {
            $set: {
              revenue: newRevenue,
              updatedAt: new Date().toISOString(),
            },
          },
        )
      }
    }

    // Create notification for addon purchase
    const notificationMessage = `Addon "${addon.name}" purchased for $${addon.price}. Awaiting payment verification.`
    const newNotification = {
      userId: new ObjectId(decoded.userId),
      companyId: new ObjectId(companyId),
      type: "addon_purchased",
      title: "Addon Purchase",
      message: notificationMessage,
      read: false,
      actionUrl: `/client/addons`,
      metadata: {
        companyId: companyId,
        addonId: addonId,
        addonName: addon.name,
        price: addon.price,
      },
      createdAt: new Date().toISOString(),
    }

    await db.collection("notifications").insertOne(newNotification)

    const response = NextResponse.json({
      success: true,
      message: "Payment details submitted successfully. We'll verify and process your order shortly.",
      data: {
        phoneNumber: phoneNumber || null,
        receiptUrl: receiptUrl,
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
