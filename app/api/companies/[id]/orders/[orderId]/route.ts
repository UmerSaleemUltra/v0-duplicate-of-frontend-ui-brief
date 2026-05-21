import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; orderId: string }> }) {
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

    const { id, orderId } = await params
    const body = await req.json()

    const { db } = await connectDB()

    let companyObjectId
    try {
      companyObjectId = new ObjectId(id)
    } catch (error) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
    }

    const company = await db.collection("companies").findOne({ _id: companyObjectId })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    // Check authorization - must be admin or the order owner
    if (decoded.role !== "admin" && decoded.userId !== company.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 403 }))
    }

    const orders = company.orders || []
    const orderIndex = orders.findIndex((order: any) => order.id === orderId)

    if (orderIndex === -1) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    const oldOrder = orders[orderIndex]

    // Role-based field whitelist — prevent clients from overwriting status, pricing, etc.
    const adminOnlyFields = ["status", "pricing", "purchasedAddons", "selectedAddons", "paymentInfo"]
    const clientAllowedFields = ["receiptUrl", "whatsappPhone", "notes"]
    const allowedFields = decoded.role === "admin" ? [...adminOnlyFields, ...clientAllowedFields] : clientAllowedFields

    const safeUpdates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) safeUpdates[field] = body[field]
    }

    // Build the merged updated order using only whitelisted fields
    const updatedOrder = {
      ...oldOrder,
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    }

    orders[orderIndex] = updatedOrder

    // Recalculate revenue from scratch by summing all orders to avoid drift
    const recalcRevenue = orders.reduce((sum: number, o: any) => {
      return sum + (o.pricing?.total ?? o.amount ?? o.total ?? 0)
    }, 0)

    await db.collection("companies").updateOne(
      { _id: companyObjectId },
      {
        $set: {
          orders: orders,
          revenue: recalcRevenue,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    broadcastUpdate("companies", "updated", { id: id, userId: company.userId })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        order: updatedOrder,
      }),
    )
  } catch (error) {
    console.error(" Error updating order:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update order" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; orderId: string }> }) {
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

    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 }))
    }

    const { id, orderId } = await params

    console.log(" DELETE order - Company ID:", id, "Order ID:", orderId)

    const { db } = await connectDB()

    let companyObjectId
    try {
      companyObjectId = new ObjectId(id)
    } catch (error) {
      console.error(" Invalid company ID format:", id)
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
    }

    const company = await db.collection("companies").findOne({ _id: companyObjectId })

    console.log(" Company found:", company ? "Yes" : "No", company?._id?.toString())

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    const orders = company.orders || []
    const orderToDelete = orders.find((order: any) => order.id === orderId)

    console.log(" Order found in company:", orderToDelete ? "Yes" : "No")

    if (!orderToDelete) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    if (orders.length === 1) {
      console.log(" Deleting company because it has only one order")

      await db.collection("companies").deleteOne({ _id: companyObjectId })

      broadcastUpdate("companies", "deleted", { id: id, userId: company.userId })

      return addSecurityHeaders(
        NextResponse.json({
          success: true,
          message: "Order and company deleted successfully",
          companyDeleted: true,
        }),
      )
    }

    // Remove the order from the orders array
    const updatedOrders = orders.filter((order: any) => order.id !== orderId)

    // Recalculate revenue from scratch by summing remaining orders to avoid drift
    const recalcRevenue = updatedOrders.reduce((sum: number, o: any) => {
      return sum + (o.pricing?.total ?? o.amount ?? o.total ?? 0)
    }, 0)

    await db.collection("companies").updateOne(
      { _id: companyObjectId },
      {
        $set: {
          orders: updatedOrders,
          revenue: recalcRevenue,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    broadcastUpdate("companies", "updated", { id: id, userId: company.userId })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Order deleted successfully",
        companyDeleted: false,
      }),
    )
  } catch (error) {
    console.error(" Error deleting order:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete order" }, { status: 500 }))
  }
}
