import { NextResponse } from "next/server"
import { getSecurityStats } from "@/lib/security/automated-response"
import { getDDoSStats } from "@/lib/middleware/ddos-protection"

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=")
        return [key, v.join("=")]
      }),
    )
    return cookies.admin_auth_token || cookies.auth_token || null
  }

  return null
}

export async function GET(request: Request) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No auth token" }, { status: 401 })
    }

    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const securityStats = getSecurityStats()
    const ddosStats = getDDoSStats()

    const recentThreats = ddosStats.threatLogs.filter((log: any) => Date.now() - log.timestamp < 86400000) // Last 24 hours

    const blockedIPs = ddosStats.blacklistedIPs.map((ip: string) => ({
      ip,
      reason: "DDoS attack or security violation",
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
        totalThreats: recentThreats.length, // Use actual threat count
        requestsToday: ddosStats.totalTracked,
        activeThreats: activeIPs.filter((ip: any) => ip.suspiciousActivity > 0).length,
      },
      blockedIPs,
      activeIPs,
      yourIP: clientIP,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[SECURITY DASHBOARD] Error:", error)
    return NextResponse.json({ error: "Failed to fetch security statistics" }, { status: 500 })
  }
}
