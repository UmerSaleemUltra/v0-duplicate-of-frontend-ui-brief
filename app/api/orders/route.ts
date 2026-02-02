import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import { processOrders } from "@/lib/api/order-service"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const { db } = await connectDB()
    const userRole = decoded.role || "client"
    const isAdmin = userRole === "admin"

    // Use centralized order service
    const orderData = await processOrders(db, {
      userId: isAdmin ? undefined : decoded.userId,
      isAdmin,
      limit: 100,
    })

    const result = {
      success: true,
      data: orderData,
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    console.error("[v0] Orders API error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 }))
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const body = await req.json()
    const {
      companyId,
      companyName,
      orderType,
      type,
      amount,
      total,
      packagePrice,
      packageType,
      stateFilingFee,
      addonsTotal,
      selectedAddons,
      items,
      purchasedAddons,
      paymentMethod,
      whatsappPhone,
      receiptUrl,
      state,
      status,
      pricing,
      paymentInfo,
      passportDocuments,
    } = body

    if (!companyId || !companyName || (!orderType && !type)) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    const { db } = await connectDB()

    // Fetch the company to verify it exists
    const company = await db.collection("companies").findOne({ 
      _id: ObjectId.isValid(companyId) ? new ObjectId(companyId) : companyId 
    })
    
    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    console.log("[v0] Creating order for company:", company.name)

    // Create the new order to be embedded in the company
    const newOrder = {
      id: new ObjectId().toString(),
      userId: decoded.userId,
      orderType: orderType || type || "Formation",
      packageType: packageType || company.packageType || "starter",
      state: state || company.state || "N/A",
      status: status || "pending",
      pricing: pricing || {
        packagePrice: packagePrice || 0,
        stateFilingFee: stateFilingFee || 0,
        addonsTotal: addonsTotal || 0,
        subtotal: (packagePrice || 0) + (stateFilingFee || 0),
        total: total || amount || 0,
      },
      selectedAddons: selectedAddons || items || [],
      paymentInfo: paymentInfo || {
        method: paymentMethod || "stripe",
        status: "pending",
        whatsappPhone: whatsappPhone || null,
        receiptUrl: receiptUrl || null,
        date: new Date().toISOString(),
      },
      purchasedAddons: Array.isArray(purchasedAddons) ? purchasedAddons : [],
      passportDocuments: passportDocuments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add order to the company's orders array
    const updateResult = await db.collection("companies").findOneAndUpdate(
      { _id: new ObjectId(company._id) },
      {
        $push: { orders: newOrder },
        $set: { updatedAt: new Date().toISOString() },
      },
      { returnDocument: "after" }
    )

    if (!updateResult) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to create order" }, { status: 500 }))
    }

    console.log("[v0] Order created successfully:", newOrder.id)

    const createdOrder = { 
      id: newOrder.id, 
      companyId: company._id.toString(),
      companyName: company.name,
      ...newOrder 
    }

    broadcastUpdate("orders", "created", createdOrder)

    // Update company milestones
    try {
      await db.collection("companies").updateOne(
        { _id: new ObjectId(company._id) },
        {
          $set: {
            "customMilestones.0.completed": true,
            "customMilestones.0.completedDate": new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      )
    } catch (milestoneError) {
      console.log("[v0] Failed to mark milestone complete:", milestoneError)
    }

    // Send confirmation email
    try {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { name: 1, email: 1 } })

      if (user) {
        const orderEmail = emailTemplates.orderConfirmation(user.name, newOrder.id, {
          companyName,
          packageType: newOrder.packageType,
          state: newOrder.state,
          total: newOrder.pricing.total,
        })

        await sendEmail({
          to: user.email,
          subject: orderEmail.subject,
          html: orderEmail.html,
        }).catch((emailError) => {
          console.log("[v0] Email sending failed (non-critical):", emailError)
        })
      }
    } catch (emailError) {
      console.log("[v0] Email preparation failed (non-critical):", emailError)
    }

    // Create notification
    try {
      await db.collection("notifications").insertOne({
        userId: decoded.userId,
        companyId: company._id.toString(),
        type: "order",
        title: "Order Placed Successfully!",
        message: `Thank you for placing your trust in BuzzFiling! We've received your order for forming your U.S. ${newOrder.orderType}, and our team is now processing it.`,
        read: false,
        metadata: {
          orderId: newOrder.id,
          companyId: company._id.toString(),
          companyName: companyName,
          orderType: newOrder.orderType,
          amount: newOrder.pricing.total,
        },
        createdAt: new Date().toISOString(),
      })

      broadcastUpdate("notifications", "created", { userId: decoded.userId })
    } catch (notificationError) {
      console.log("[v0] Notification creation failed (non-critical):", notificationError)
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdOrder,
      }),
    )
  } catch (error) {
    console.error("[v0] Order creation error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create order" }, { status: 500 }))
  }
}
