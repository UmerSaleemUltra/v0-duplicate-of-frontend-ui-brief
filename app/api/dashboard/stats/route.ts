import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await connectDB()

    // Get total revenue
    const orderStats = await db
      .collection("orders")
      .aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalOrders: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const totalRevenue = orderStats[0]?.totalRevenue || 0
    const totalOrders = orderStats[0]?.totalOrders || 0

    // Get active companies
    const activeCompanies = await db.collection("companies").countDocuments({ status: "active" })

    // Get pending orders
    const pendingOrders = await db.collection("orders").countDocuments({ status: "pending" })

    // Calculate changes (mock data for now - implement proper comparison with previous period)
    const stats = {
      totalRevenue,
      totalOrders,
      activeCompanies,
      pendingOrders,
      revenueChange: 12.5,
      ordersChange: 8.3,
      companiesChange: 15.2,
      pendingChange: -5.4,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
