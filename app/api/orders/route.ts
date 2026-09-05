import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

// GET /api/orders - Get all orders (filtered by user for clients)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectDB()
    const query = decoded.role === "admin" ? {} : { userId: decoded.userId }

    const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST /api/orders - Create order
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const {
      companyId,
      companyName,
      type,
      amount,
      total,
      packagePrice,
      stateFilingFee,
      addonsTotal,
      items,
      purchasedAddons,
      paymentMethod,
    } = body

    if (!companyId || !companyName || !type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectDB()

    const newOrder = {
      userId: decoded.userId,
      companyId,
      companyName,
      type,
      status: "pending",
      amount,
      total: total || amount,
      packagePrice,
      stateFilingFee,
      addonsTotal,
      paymentStatus: "pending",
      paymentMethod: paymentMethod || "stripe",
      items: items || [],
      purchasedAddons: purchasedAddons || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("orders").insertOne(newOrder)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newOrder,
      },
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
