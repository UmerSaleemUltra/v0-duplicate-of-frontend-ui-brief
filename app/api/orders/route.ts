import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

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
    const query = decoded.role === "admin" ? {} : { userId: decoded.userId }

    const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).limit(100).toArray()

    const result = {
      success: true,
      data: orders.map((order) => ({
        id: order._id.toString(),
        userId: order.userId,
        companyId: order.companyId,
        companyName: order.companyName,
        type: order.type,
        status: order.status,
        amount: order.amount,
        total: order.total,
        packagePrice: order.packagePrice,
        stateFilingFee: order.stateFilingFee,
        addonsTotal: order.addonsTotal,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        transactionReference: order.transactionReference,
        items: order.items,
        purchasedAddons: order.purchasedAddons,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
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
      type,
      amount,
      total,
      packagePrice,
      packageType,
      stateFilingFee,
      addonsTotal,
      items,
      purchasedAddons,
      paymentMethod,
      whatsappPhone,
      receiptUrl,
      members,
    } = body

    if (!companyId || !companyName || !type || !amount) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    if (typeof amount !== "number" || amount <= 0) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid amount" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const company = await db.collection("companies").findOne({ _id: new ObjectId(companyId) })
    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    const newOrder = {
      userId: decoded.userId,
      companyId,
      companyName,
      type,
      packageType: packageType || "starter",
      status: "Order Proceeded",
      amount,
      total: total || amount,
      packagePrice,
      stateFilingFee,
      addonsTotal,
      paymentStatus: "pending",
      paymentMethod: paymentMethod || "stripe",
      paymentInfo: {
        method: paymentMethod || "stripe",
        status: "pending",
        whatsappPhone: whatsappPhone || null,
        receiptUrl: receiptUrl || null,
        date: new Date().toISOString(),
      },
      items: items || [],
      purchasedAddons: Array.isArray(purchasedAddons) ? purchasedAddons : [],
      members: members || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("orders").insertOne(newOrder)
    const orderId = result.insertedId.toString()

    const createdOrder = { id: orderId, ...newOrder }

    broadcastUpdate("orders", "created", createdOrder)

    try {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { name: 1, email: 1 } })

      if (user) {
        const orderEmail = emailTemplates.orderConfirmation(user.name, orderId, {
          companyName,
          packageType: packageType || "Starter Package",
          state: company?.state || "N/A",
          total: total || amount,
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

    try {
      await db.collection("notifications").insertOne({
        userId: decoded.userId,
        companyId: companyId,
        type: "order",
        title: "Order Placed Successfully!",
        message: `Thank you for placing your trust in BuzzFiling! We've received your order for forming your U.S. ${type}, and our team is now processing it.`,
        read: false,
        metadata: {
          orderId: orderId,
          companyId: companyId,
          companyName: companyName,
          orderType: type,
          amount: total || amount,
        },
        createdAt: new Date().toISOString(),
      })

      broadcastUpdate("notifications", "created", { userId: decoded.userId })
    } catch (notificationError) {}

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdOrder,
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create order" }, { status: 500 }))
  }
}
