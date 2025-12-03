import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/config/jwt"
import { unblockIP } from "@/lib/security/automated-response"
import { connectDB } from "@/lib/db"

export async function POST(req: NextRequest) {
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

    const { ip } = await req.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    unblockIP(ip)

    // Log the admin action
    const db = await connectDB()
    await db.collection("security_logs").insertOne({
      type: "admin_unblock",
      ip,
      severity: "low",
      timestamp: new Date(),
      details: {
        adminId: decoded.userId,
        adminEmail: decoded.email,
      },
      action: "unblock",
    })

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been unblocked successfully`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to unblock IP" }, { status: 500 })
  }
}
