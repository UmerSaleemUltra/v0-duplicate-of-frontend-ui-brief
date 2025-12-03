import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/config/jwt"
import { getSecurityStats } from "@/lib/security/automated-response"
import { connectDB } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Get in-memory security stats
    const stats = getSecurityStats()

    // Get recent security logs from database
    const db = await connectDB()
    const recentLogs = await db
      .collection("security_logs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray()

    // Get blocked IPs count by type
    const threatTypes = await db
      .collection("security_logs")
      .aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        recentLogs: recentLogs.map((log) => ({
          id: log._id.toString(),
          ip: log.ip,
          type: log.type,
          severity: log.severity,
          timestamp: log.timestamp,
          details: log.details,
          action: log.action,
        })),
        threatsByType: threatTypes.map((t) => ({
          type: t._id,
          count: t.count,
        })),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch security stats" }, { status: 500 })
  }
}
