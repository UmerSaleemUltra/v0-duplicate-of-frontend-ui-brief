import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"
import { unblockIP } from "@/lib/middleware/ddos-protection"
import { connectDB } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || authResult.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // Unblock the IP
    unblockIP(ip)

    console.log(`[ADMIN UNBLOCK] IP ${ip} unblocked by admin ${authResult.user.email}`)

    // Log the admin action
    const db = await connectDB()
    await db.collection("security_logs").insertOne({
      type: "admin_unblock",
      ip,
      severity: "low",
      timestamp: new Date(),
      details: {
        adminId: authResult.user.userId,
        adminEmail: authResult.user.email,
      },
      action: "unblock",
    })

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been unblocked successfully`,
      unblockedIP: ip,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[UNBLOCK IP] Error:", error)
    return NextResponse.json({ error: "Failed to unblock IP address" }, { status: 500 })
  }
}
