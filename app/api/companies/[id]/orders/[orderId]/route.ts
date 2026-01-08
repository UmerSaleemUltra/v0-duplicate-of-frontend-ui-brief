import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function DELETE(req: NextRequest, { params }: { params: { id: string; orderId: string } }) {
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

    const { db } = await connectDB()
    const company = await db.collection("companies").findOne({ _id: new ObjectId(params.id) })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    const orders = company.orders || []
    const orderToDelete = orders.find((order: any) => order.id === params.orderId)

    if (!orderToDelete) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    // Calculate new revenue after removing the order
    const currentRevenue = company.revenue || 0
    const orderAmount = orderToDelete.pricing?.total || orderToDelete.amount || orderToDelete.total || 0
    const newRevenue = Math.max(0, currentRevenue - orderAmount)

    // Remove the order from the orders array
    const updatedOrders = orders.filter((order: any) => order.id !== params.orderId)

    await db.collection("companies").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          orders: updatedOrders,
          revenue: newRevenue,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    console.log("[v0] Order deleted from company. Previous revenue:", currentRevenue, "New revenue:", newRevenue)

    broadcastUpdate("companies", "updated", { id: params.id, userId: company.userId })

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
