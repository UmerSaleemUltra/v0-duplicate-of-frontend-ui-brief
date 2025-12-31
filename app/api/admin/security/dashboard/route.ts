import { NextResponse } from "next/server"
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

    const ddosStats = getDDoSStats()

    const blockedIPs = ddosStats.blacklistedIPs.map((ip) => {
      const tracker = ddosStats.activeTrackers.find((t) => t.ip === ip)
      return {
        ip,
        reason: tracker?.blocked ? "Automated DDoS detection" : "Manual ban",
        threatLevel: "high",
        blockedAt: tracker?.blockedUntil
          ? new Date(tracker.blockedUntil - 1800000).toISOString()
          : new Date().toISOString(),
        requestCount: tracker?.requestCount || 0,
        lastAttempt: new Date().toISOString(),
      }
    })

    const activeIPs = ddosStats.activeTrackers
      .filter((tracker) => !tracker.blocked)
      .map((tracker) => ({
        ip: tracker.ip,
        requestCount: tracker.requestCount,
        suspiciousActivity: tracker.suspiciousActivity,
        lastSeen: new Date().toISOString(),
      }))

    const activeThreats = ddosStats.activeTrackers.filter((t) => t.suspiciousActivity > 0).length

    return NextResponse.json({
      success: true,
      stats: {
        blockedIPs: ddosStats.blacklistedIPs.length,
        totalThreats: ddosStats.threatLogs.length,
        requestsToday: ddosStats.activeTrackers.reduce((sum, t) => sum + t.requestCount, 0),
        activeThreats,
      },
      blockedIPs,
      activeIPs,
      yourIP: clientIP,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[SECURITY DASHBOARD] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch security statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
