import { type NextRequest, NextResponse } from "next/server"
import { getDDoSStats } from "@/lib/middleware/ddos-protection"
import { redisCache } from "@/lib/redis-cache"

export async function GET(req: NextRequest) {
  try {
    // Generate cache key
    const cacheKey = 'security:public:stats'
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Security stats served from cache')
      return NextResponse.json(cachedData)
    }

    // Get client IP
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    // Get DDoS stats
    const ddosStats = getDDoSStats()

    // Check client status
    let yourStatus = "allowed"
    if (ddosStats.blacklistedIPs.includes(clientIP)) {
      yourStatus = "blocked"
    } else if (ddosStats.whitelistedIPs.includes(clientIP)) {
      yourStatus = "whitelisted"
    }

    // Calculate stats
    const blockedCount = ddosStats.blacklistedIPs.length
    const totalRequests = ddosStats.activeTrackers.reduce((sum, tracker) => sum + tracker.requestCount, 0)
    const activeThreats = ddosStats.activeTrackers.filter((t) => t.suspiciousActivity > 5).length

    // Generate recent activity
    const recentActivity = ddosStats.activeTrackers
      .filter((t) => t.blocked || t.suspiciousActivity > 0)
      .slice(0, 10)
      .map((tracker) => ({
        timestamp: new Date().toISOString(),
        action: tracker.blocked
          ? `IP ${tracker.ip} blocked for security violation`
          : `Suspicious activity detected from ${tracker.ip}`,
        severity: tracker.blocked ? "critical" : tracker.suspiciousActivity > 5 ? "high" : "medium",
        ip: tracker.ip,
      }))

    const result = {
      stats: {
        blockedIPs: blockedCount,
        totalThreats: activeThreats + blockedCount,
        requestsToday: totalRequests,
        activeThreats: activeThreats,
        yourIP: clientIP,
        yourStatus: yourStatus,
      },
      recentActivity: recentActivity,
      timestamp: new Date().toISOString(),
    }

    // Cache for 1 minute (60 seconds) for security stats
    await redisCache.set(cacheKey, result, 60)
  } catch (error) {
    console.error("[SECURITY API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch security stats",
      },
      { status: 500 },
    )
  }
}
