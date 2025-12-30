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

    const recentActivity = [
      {
        timestamp: new Date().toISOString(),
        action: "System monitoring active",
        severity: "low",
        ip: clientIP,
      },
    ]

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
      yourIP: clientIP,
      recentActivity,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[SECURITY DASHBOARD] Error:", error)
    return NextResponse.json({ error: "Failed to fetch security statistics" }, { status: 500 })
  }
}
