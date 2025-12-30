import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"
import { getSecurityStats } from "@/lib/security/automated-response"
import { getDDoSStats } from "@/lib/middleware/ddos-protection"

export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || authResult.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get comprehensive security statistics
    const securityStats = getSecurityStats()
    const ddosStats = getDDoSStats()

    return NextResponse.json({
      success: true,
      data: {
        security: securityStats,
        ddos: ddosStats,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[SECURITY DASHBOARD] Error:", error)
    return NextResponse.json({ error: "Failed to fetch security statistics" }, { status: 500 })
  }
}
