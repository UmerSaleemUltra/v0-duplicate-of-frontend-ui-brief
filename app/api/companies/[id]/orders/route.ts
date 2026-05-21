import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    const company = await db.collection("companies").findOne({ _id: new ObjectId(params.id) })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    if (company.userId !== decoded.userId && decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 403 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: company.orders || [],
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 }))
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { db } = await connectDB()

    const company = await db.collection("companies").findOne({ _id: new ObjectId(params.id) })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    // Only admins can create orders directly on a company (clients go through checkout flow)
    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }))
    }

    // Recalculate server-side to prevent a client from injecting inflated/deflated pricing
    const packagePrice = Number(body.packagePrice) || 0
    const stateFilingFee = Number(body.stateFilingFee) || 0
    const addonsTotal = Number(body.addonsTotal) || 0
    const subtotal = packagePrice + stateFilingFee
    const total = subtotal + addonsTotal

    const newOrder = {
      id: new ObjectId().toString(),
      orderType: body.orderType || "Additional Service",
      packageType: body.packageType,
      state: body.state || company.state,
      // Only admins can set an initial status; default to pending
      status: "pending",
      pricing: {
        packagePrice,
        stateFilingFee,
        addonsTotal,
        subtotal,
        total,
      },
      selectedAddons: body.selectedAddons || [],
      paymentInfo: {
        method: body.paymentMethod || "stripe",
        status: body.paymentStatus || "pending",
        whatsappPhone: body.whatsappPhone || null,
        receiptUrl: body.receiptUrl || null,
        date: new Date().toISOString(),
      },
      passportDocuments: body.passportDocuments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const existingOrders = company.orders || []
    // Recalculate revenue from scratch — sum existing orders plus the new one
    const baseRevenue = existingOrders.reduce((sum: number, o: any) => {
      return sum + (o.pricing?.total ?? o.amount ?? o.total ?? 0)
    }, 0)
    const newRevenue = baseRevenue + total

    await db.collection("companies").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: { orders: newOrder },
        $set: {
          updatedAt: new Date().toISOString(),
          revenue: newRevenue,
          lastOrderDate: new Date().toISOString(),
        },
      },
    )

    console.log(" Order added to company. Previous revenue:", currentRevenue, "New revenue:", newRevenue)

    broadcastUpdate("companies", "updated", { id: params.id, userId: company.userId })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: newOrder,
      }),
    )
  } catch (error) {
    console.error(" Error creating order:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create order" }, { status: 500 }))
  }
}
