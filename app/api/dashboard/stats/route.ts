import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

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

    const { db } = await connectDB()

    const [orderStats, companyStats, activeCompanies, pendingOrders] = await Promise.all([
      db
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
        .toArray(),
      db
        .collection("companies")
        .aggregate([
          {
            $group: {
              _id: null,
              totalCompanyRevenue: { $sum: "$revenue" },
            },
          },
        ])
        .toArray(),
      db.collection("companies").countDocuments({ status: "active" }),
      db.collection("orders").countDocuments({ status: "pending" }),
    ])

    const orderRevenue = orderStats[0]?.totalRevenue || 0
    const companyRevenue = companyStats[0]?.totalCompanyRevenue || 0
    const totalRevenue = orderRevenue + companyRevenue
    const totalOrders = orderStats[0]?.totalOrders || 0

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

    const result = {
      success: true,
      data: stats,
    }

    const response = NextResponse.json(result)
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
