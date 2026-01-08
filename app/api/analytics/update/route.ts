import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }))
    }

    const { type, oldState, newState, revenue, companyId, orderId } = await req.json()

    const { db } = await connectDB()

    // Log the state change event
    await db.collection("analytics_events").insertOne({
      type,
      oldState,
      newState,
      revenue,
      companyId,
      orderId,
      adminId: decoded.userId,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Analytics event logged:", {
      type,
      oldState,
      newState,
      revenue,
    })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Analytics updated successfully",
      }),
    )
  } catch (error) {
    console.error("[v0] Error updating analytics:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update analytics" }, { status: 500 }))
  }
}
