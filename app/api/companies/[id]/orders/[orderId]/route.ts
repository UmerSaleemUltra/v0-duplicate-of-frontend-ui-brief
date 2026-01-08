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

    // Update the order with new data
    const updatedOrder = {
      ...orders[orderIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    orders[orderIndex] = updatedOrder

    await db.collection("companies").updateOne(
      { _id: companyObjectId },
      {
        $set: {
          orders: orders,
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
    console.error("[v0] Error updating order:", error)
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

    console.log("[v0] DELETE order - Company ID:", id, "Order ID:", orderId)

    const { db } = await connectDB()

    let companyObjectId
    try {
      companyObjectId = new ObjectId(id)
    } catch (error) {
      console.error("[v0] Invalid company ID format:", id)
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
    }

    const company = await db.collection("companies").findOne({ _id: companyObjectId })

    console.log("[v0] Company found:", company ? "Yes" : "No", company?._id?.toString())

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    const orders = company.orders || []
    const orderToDelete = orders.find((order: any) => order.id === orderId)

    console.log("[v0] Order found in company:", orderToDelete ? "Yes" : "No")

    if (!orderToDelete) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    // Calculate new revenue after removing the order
    const currentRevenue = company.revenue || 0
    const orderAmount = orderToDelete.pricing?.total || orderToDelete.amount || orderToDelete.total || 0
    const newRevenue = Math.max(0, currentRevenue - orderAmount)

    // Remove the order from the orders array
    const updatedOrders = orders.filter((order: any) => order.id !== orderId)

    await db.collection("companies").updateOne(
      { _id: companyObjectId },
      {
        $set: {
          orders: updatedOrders,
          revenue: newRevenue,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    console.log("[v0] Order deleted from company. Previous revenue:", currentRevenue, "New revenue:", newRevenue)

    broadcastUpdate("companies", "updated", { id: id, userId: company.userId })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Order deleted successfully",
      }),
    )
  } catch (error) {
    console.error("[v0] Error deleting order:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete order" }, { status: 500 }))
  }
}
