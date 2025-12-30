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

    const blockedIPs = ddosStats.blacklistedIPs.map((ip: string) => ({
      ip,
      reason: "Manual ban or automatic detection",
      threatLevel: "high",
      blockedAt: new Date().toISOString(),
      requestCount: 0,
      lastAttempt: new Date().toISOString(),
    }))

    const activeIPs = ddosStats.activeTrackers
      .filter((tracker: any) => !tracker.blocked)
      .map((tracker: any) => ({
        ip: tracker.ip,
        requestCount: tracker.requestCount,
        suspiciousActivity: tracker.suspiciousActivity,
        lastSeen: new Date().toISOString(),
      }))

    return NextResponse.json({
      success: true,
      stats: {
        blockedIPs: ddosStats.blacklistedIPs.length,
        totalThreats: securityStats.totalThreats || 0,
        requestsToday: ddosStats.totalTracked,
        activeThreats: securityStats.activeThreats || 0,
      },
      blockedIPs,
      activeIPs,
      threats: [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[SECURITY DASHBOARD] Error:", error)
    return NextResponse.json({ error: "Failed to fetch security statistics" }, { status: 500 })
  }
}
