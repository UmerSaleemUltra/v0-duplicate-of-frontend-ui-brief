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

    const blockedIPsList = Array.from(ddosStats.blacklistedIPs || [])
    const blockedIPs = blockedIPsList.map((ip) => ({
      ip,
      reason: "Security violation or manual ban",
      threatLevel: "high",
      blockedAt: new Date().toISOString(),
      requestCount: 0,
      lastAttempt: new Date().toISOString(),
    }))

    const activeIPs = (ddosStats.activeIPs || []).map((tracker) => ({
      ip: tracker.ip || "unknown",
      requestCount: tracker.requestCount || 0,
      suspiciousActivity: tracker.suspiciousActivity || 0,
      lastSeen: new Date(tracker.lastActivity || Date.now()).toISOString(),
    }))

    const activeThreats = activeIPs.filter((ip) => ip.suspiciousActivity > 0).length

    return NextResponse.json({
      success: true,
      stats: {
        blockedIPs: blockedIPsList.length,
        totalThreats: ddosStats.totalThreats || 0,
        requestsToday: ddosStats.totalRequests || 0,
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
