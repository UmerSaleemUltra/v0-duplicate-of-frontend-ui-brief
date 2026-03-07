import type { NextRequest } from "next/server"
import { logSecurityThreat, saveBannedIP, removeBannedIP, getBannedIPs } from "@/lib/security/security-db"

interface RequestTracker {
  requests: number[]
  suspiciousActivity: number
  blocked: boolean
  blockedUntil?: number
}

interface ThreatLog {
  ip: string
  timestamp: number
  requestCount: number
  reason: string
  action: string
}

const requestTrackers = new Map<string, RequestTracker>()
const blacklistedIPs = new Set<string>()
const whitelistedIPs = new Set<string>([
  // Add your IPs here to whitelist them
])

// Cache of manual bans loaded from DB — refreshed periodically
// Key: ip, Value: { permanent: boolean, expiresAt?: number }
const manualBanCache = new Map<string, { permanent: boolean; expiresAt?: number; reason: string }>()
let lastManualBanCacheRefresh = 0
const MANUAL_BAN_CACHE_TTL = 30 * 1000 // re-check DB every 30 seconds

async function refreshManualBanCache() {
  const now = Date.now()
  if (now - lastManualBanCacheRefresh < MANUAL_BAN_CACHE_TTL) return

  try {
    const dbBannedIPs = await getBannedIPs()
    manualBanCache.clear()
    for (const ban of dbBannedIPs) {
      manualBanCache.set(ban.ip, {
        permanent: ban.permanent,
        expiresAt: ban.expiresAt ? new Date(ban.expiresAt).getTime() : undefined,
        reason: ban.reason,
      })
      // Also keep in-memory blacklist in sync
      blacklistedIPs.add(ban.ip)
    }
    lastManualBanCacheRefresh = now
    console.log(`[DDOS] Manual ban cache refreshed — ${manualBanCache.size} active bans`)
  } catch (err) {
    console.error("[DDOS] Failed to refresh manual ban cache:", err)
  }
}

function getManualBan(ip: string): { permanent: boolean; expiresAt?: number; reason: string } | null {
  const ban = manualBanCache.get(ip)
  if (!ban) return null
  // If temporary and expired, remove from cache
  if (!ban.permanent && ban.expiresAt && Date.now() > ban.expiresAt) {
    manualBanCache.delete(ip)
    blacklistedIPs.delete(ip)
    return null
  }
  return ban
}

const threatLogs: ThreatLog[] = []
const MAX_THREAT_LOGS = 100

function logThreat(threat: ThreatLog) {
  threatLogs.unshift(threat)
  if (threatLogs.length > MAX_THREAT_LOGS) {
    threatLogs.pop()
  }

  // Save to MongoDB — thresholds aligned with auto-block trigger (200 req/min)
  // Any automated DDoS block fires at >=200 requests so severity is always medium+
  const severity =
    threat.requestCount > 400
      ? "critical"
      : threat.requestCount > 200
        ? "high"
        : threat.requestCount > 20
          ? "medium"
          : "medium" // floor at medium — low is never used for actual blocked requests

  logSecurityThreat({
    ip: threat.ip,
    timestamp: new Date(threat.timestamp),
    requestCount: threat.requestCount,
    reason: threat.reason,
    action: threat.action,
    type: threat.action.includes("BLACKLIST") || threat.action.includes("BLOCKED") ? "ddos" : "ddos",
    severity,
  }).catch((err) => console.error("[DDOS] Failed to log threat to DB:", err))
}

// Configuration
const DDOS_CONFIG = {
  MONITORING_ONLY: false, // Set to false to enable blocking
  // Requests per second threshold (reasonable limit)
  MAX_REQUESTS_PER_SECOND: 20,
  // Requests per minute threshold (reasonable limit)
  MAX_REQUESTS_PER_MINUTE: 200,
  // Aggressive threshold for immediate blocking
  AGGRESSIVE_BLOCK_THRESHOLD: 200, // Block at 200 req/min — matches user expectation
  // Window for tracking requests (1 minute)
  TRACKING_WINDOW: 60000,
  // Auto-block duration (30 minutes)
  BLOCK_DURATION: 1800000,
  // Suspicious activity threshold
  SUSPICIOUS_THRESHOLD: 10, // Higher threshold
  // Max payload size (10MB)
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024,
}

export function isWhitelisted(ip: string): boolean {
  return whitelistedIPs.has(ip)
}

export function addToWhitelist(ip: string) {
  whitelistedIPs.add(ip)
  console.log(`[DDOS] IP ${ip} added to whitelist`)
}

export async function ddosProtection(req: NextRequest) {
  // Always refresh the manual ban cache from DB (30s TTL) so manual bans
  // are enforced even on fresh serverless cold-starts
  await refreshManualBanCache()

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  // --- Check DB-backed manual ban cache first ---
  const manualBan = getManualBan(ip)
  if (manualBan) {
    console.log("\n")
    console.log("╔════════════════════════════════════════════════════════════╗")
    console.log("║         🛑 MANUALLY BANNED IP BLOCKED                      ║")
    console.log("╚════════════════════════════════════════════════════════════╝")
    console.log(`IP Address: ${ip}`)
    console.log(`Permanent: ${manualBan.permanent}`)
    console.log(`Reason: ${manualBan.reason}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log(`URL Attempted: ${req.url}`)
    console.log("════════════════════════════════════════════════════════════\n")

    logThreat({
      ip,
      timestamp: Date.now(),
      requestCount: 0,
      reason: manualBan.reason || "Manually banned IP attempted access",
      action: "BLOCKED",
    })

    return {
      blocked: true,
      permanent: manualBan.permanent,
      reason: manualBan.permanent
        ? "Your IP has been permanently blocked by the administrator"
        : "Your IP has been temporarily blocked by the administrator",
      blockedUntil: manualBan.expiresAt,
      ip,
    }
  }

  // --- Fall through to in-memory blacklist (DDoS auto-blocks) ---
  if (blacklistedIPs.has(ip)) {
    const tracker = requestTrackers.get(ip)

    console.log("\n")
    console.log("╔════════════════════════════════════════════════════════════╗")
    console.log("║         🛑 BLACKLISTED IP BLOCKED                          ║")
    console.log("╚════════════════════════════════════════════════════════════╝")
    console.log(`IP Address: ${ip}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log(`URL Attempted: ${req.url}`)
    console.log(`Method: ${req.method}`)
    console.log("════════════════════════════════════════════════════════════\n")

    logThreat({
      ip,
      timestamp: Date.now(),
      requestCount: 0,
      reason: "Blacklisted IP attempted access",
      action: "BLOCKED",
    })

    return {
      blocked: true,
      permanent: !tracker?.blockedUntil,
      reason: "Your IP has been blocked due to security violations",
      blockedUntil: tracker?.blockedUntil,
      ip: ip,
    }
  }

  if (isWhitelisted(ip)) {
    return null
  }

  const now = Date.now()

  if (DDOS_CONFIG.MONITORING_ONLY) {
    let tracker = requestTrackers.get(ip)
    if (!tracker) {
      tracker = {
        requests: [],
        suspiciousActivity: 0,
        blocked: false,
      }
      requestTrackers.set(ip, tracker)
    }

    // Clean old requests
    tracker.requests = tracker.requests.filter((timestamp) => now - timestamp < DDOS_CONFIG.TRACKING_WINDOW)
    tracker.requests.push(now)

    // Just log suspicious activity without blocking
    if (tracker.requests.length > DDOS_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      console.log(`[DDOS MONITOR] IP ${ip} has high request rate: ${tracker.requests.length} req/min`)
    }

    return null // Always allow in monitoring mode
  }

  // Get or create tracker for this IP
  let tracker = requestTrackers.get(ip)
  if (!tracker) {
    tracker = {
      requests: [],
      suspiciousActivity: 0,
      blocked: false,
    }
    requestTrackers.set(ip, tracker)
  }

  if (tracker.blocked && tracker.blockedUntil) {
    if (now < tracker.blockedUntil) {
      const remainingTime = Math.ceil((tracker.blockedUntil - now) / 1000 / 60)
      console.error(`[DDOS BLOCK] Temporarily blocked IP attempted access: ${ip}`)
      console.error(`[DDOS BLOCK] Remaining time: ${remainingTime} minutes`)

      return {
        blocked: true,
        temporary: true,
        reason: "Too many requests detected - DDoS protection activated",
        blockedUntil: tracker.blockedUntil,
        remainingMinutes: remainingTime,
        ip: ip,
      }
    } else {
      tracker.blocked = false
      tracker.blockedUntil = undefined
      tracker.suspiciousActivity = 0
      blacklistedIPs.delete(ip)

      removeBannedIP(ip).catch((err) => console.error("[DDOS] Failed to remove expired ban from DB:", err))
    }
  }

  // Clean old requests (older than tracking window)
  tracker.requests = tracker.requests.filter((timestamp) => now - timestamp < DDOS_CONFIG.TRACKING_WINDOW)

  // Add current request
  tracker.requests.push(now)

  if (tracker.requests.length >= DDOS_CONFIG.AGGRESSIVE_BLOCK_THRESHOLD) {
    tracker.blocked = true
    tracker.blockedUntil = now + DDOS_CONFIG.BLOCK_DURATION
    blacklistedIPs.add(ip)

    console.log("\n")
    console.log("╔════════════════════════════════════════════════════════════╗")
    console.log("║         🚨 DDOS ATTACK DETECTED - IP BLOCKED 🚨           ║")
    console.log("╚════════════════════════════════════════════════════════════╝")
    console.log(`IP Address: ${ip}`)
    console.log(`Total Requests: ${tracker.requests.length} in 60 seconds`)
    console.log(`Threshold: ${DDOS_CONFIG.AGGRESSIVE_BLOCK_THRESHOLD} requests`)
    console.log(`Action: BLACKLISTED + 30min temporary block`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log(`URL: ${req.url}`)
    console.log(`Method: ${req.method}`)
    console.log("════════════════════════════════════════════════════════════\n")

    logThreat({
      ip,
      timestamp: now,
      requestCount: tracker.requests.length,
      reason: `DDoS attack detected - ${tracker.requests.length} requests in 60 seconds`,
      action: "BLACKLISTED + BLOCKED",
    })

    saveBannedIP({
      ip,
      reason: `DDoS attack detected - ${tracker.requests.length} requests in 60 seconds`,
      bannedAt: new Date(),
      bannedBy: "system",
      duration: DDOS_CONFIG.BLOCK_DURATION,
      expiresAt: new Date(tracker.blockedUntil),
      permanent: false,
      requestCount: tracker.requests.length,
      type: "ddos",
    }).catch((err) => console.error("[DDOS] Failed to save ban to DB:", err))

    return {
      blocked: true,
      temporary: true,
      reason: `Aggressive request pattern detected (${tracker.requests.length} requests in 60 seconds)`,
      requestCount: tracker.requests.length,
      blockedUntil: tracker.blockedUntil,
      ip: ip,
    }
  }

  const recentRequests = tracker.requests.filter((timestamp) => now - timestamp < 1000)
  if (recentRequests.length > DDOS_CONFIG.MAX_REQUESTS_PER_SECOND) {
    tracker.suspiciousActivity++

    console.log(
      `⚠️  [DDOS WARNING] IP ${ip} - High rate: ${recentRequests.length} req/sec (Suspicious: ${tracker.suspiciousActivity}/${DDOS_CONFIG.SUSPICIOUS_THRESHOLD})`,
    )

    logThreat({
      ip,
      timestamp: now,
      requestCount: recentRequests.length,
      reason: `High request rate - ${recentRequests.length} req/sec`,
      action: "WARNING",
    })

    if (tracker.suspiciousActivity >= DDOS_CONFIG.SUSPICIOUS_THRESHOLD) {
      tracker.blocked = true
      tracker.blockedUntil = now + DDOS_CONFIG.BLOCK_DURATION
      blacklistedIPs.add(ip)

      console.log("\n")
      console.log("╔════════════════════════════════════════════════════════════╗")
      console.log("║         ⏱️  TEMPORARY BLOCK ACTIVATED                      ║")
      console.log("╚════════════════════════════════════════════════════════════╝")
      console.log(`IP Address: ${ip}`)
      console.log(`Reason: Sustained high request rate`)
      console.log(`Rate: ${recentRequests.length} requests/second`)
      console.log(`Block Duration: 30 minutes`)
      console.log(`Unblock Time: ${new Date(tracker.blockedUntil).toISOString()}`)
      console.log("════════════════════════════════════════════════════════════\n")

      logThreat({
        ip,
        timestamp: now,
        requestCount: recentRequests.length,
        reason: "Sustained high request rate",
        action: "TEMP BLOCKED (30min)",
      })

      saveBannedIP({
        ip,
        reason: "Sustained high request rate",
        bannedAt: new Date(),
        bannedBy: "system",
        duration: DDOS_CONFIG.BLOCK_DURATION,
        expiresAt: new Date(tracker.blockedUntil),
        permanent: false,
        requestCount: recentRequests.length,
        type: "ddos",
      }).catch((err) => console.error("[DDOS] Failed to save ban to DB:", err))

      return {
        blocked: true,
        temporary: true,
        reason: `Sustained high request rate (${recentRequests.length} requests per second)`,
        blockedUntil: tracker.blockedUntil,
        ip: ip,
      }
    }

    return {
      blocked: true,
      warning: true,
      reason: "Request rate too high - please slow down",
      requestsPerSecond: recentRequests.length,
      ip: ip,
    }
  }

  if (tracker.requests.length > DDOS_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    tracker.suspiciousActivity++
    console.log(`⚠️  [RATE LIMIT] IP ${ip} - ${tracker.requests.length} requests in last minute`)
    return {
      blocked: true,
      warning: true,
      reason: "Too many requests in the last minute",
      requestCount: tracker.requests.length,
      ip: ip,
    }
  }

  // Check payload size
  const contentLength = req.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength) > DDOS_CONFIG.MAX_PAYLOAD_SIZE) {
    tracker.suspiciousActivity++
    return {
      error: "Request payload too large.",
      status: 413,
    }
  }

  return null
}

// Admin function to manually block an IP with duration
export async function blockIP(ip: string, duration?: number, reason?: string) {
  blacklistedIPs.add(ip)

  const expiresAt = duration ? Date.now() + duration : undefined

  // Immediately update the manual ban cache so the block takes effect
  // on this serverless instance without waiting for the next TTL refresh
  manualBanCache.set(ip, {
    permanent: !duration,
    expiresAt,
    reason: reason || "Manually banned by admin",
  })
  // Force next request to re-read from DB on other instances
  lastManualBanCacheRefresh = 0

  const tracker = requestTrackers.get(ip) || {
    requests: [],
    suspiciousActivity: 0,
    blocked: true,
  }

  tracker.blocked = true
  if (duration) {
    tracker.blockedUntil = Date.now() + duration
  } else {
    tracker.blockedUntil = undefined
  }

  requestTrackers.set(ip, tracker)

  console.log("\n")
  console.log("╔════════════════════════════════════════════════════════════╗")
  console.log("║         🔨 MANUAL IP BAN ACTIVATED                        ║")
  console.log("╚════════════════════════════════════════════════════════════╝")
  console.log(`IP Address: ${ip}`)
  console.log(`Duration: ${duration ? `${duration / 1000 / 60} minutes` : "PERMANENT"}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`Reason: ${reason || "Manually banned by admin"}`)
  console.log("════════════════════════════════════════════════════════════\n")

  logThreat({
    ip,
    timestamp: Date.now(),
    requestCount: 0,
    reason: reason || `Manually banned by admin`,
    action: duration ? `TEMP BANNED (${duration / 1000 / 60}min)` : "PERMANENTLY BANNED",
  })

  await saveBannedIP({
    ip,
    reason: reason || "Manually banned by admin",
    bannedAt: new Date(),
    bannedBy: "admin",
    duration,
    expiresAt: duration ? new Date(Date.now() + duration) : undefined,
    permanent: !duration,
    type: "manual",
  })
}

// Admin function to unblock an IP
export async function unblockIP(ip: string) {
  blacklistedIPs.delete(ip)
  manualBanCache.delete(ip)
  // Force next request to re-read from DB on other instances
  lastManualBanCacheRefresh = 0
  const tracker = requestTrackers.get(ip)
  if (tracker) {
    tracker.blocked = false
    tracker.blockedUntil = undefined
    tracker.suspiciousActivity = 0
  }

  console.log("\n")
  console.log("╔════════════════════════════════════════════════════════════╗")
  console.log("║         ✅ IP UNBLOCKED                                     ║")
  console.log("╚════════════════════════════════════════════════════════════╝")
  console.log(`IP Address: ${ip}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log("════════════════════════════════════════════════════════════\n")

  logThreat({
    ip,
    timestamp: Date.now(),
    requestCount: 0,
    reason: "Unblocked by admin",
    action: "UNBLOCKED",
  })

  await removeBannedIP(ip)
}

export function getDDoSStats() {
  return {
    totalTracked: requestTrackers.size,
    blacklistedIPs: Array.from(blacklistedIPs),
    whitelistedIPs: Array.from(whitelistedIPs),
    activeTrackers: Array.from(requestTrackers.entries()).map(([ip, tracker]) => ({
      ip,
      requestCount: tracker.requests.length,
      suspiciousActivity: tracker.suspiciousActivity,
      blocked: tracker.blocked,
      blockedUntil: tracker.blockedUntil,
    })),
    threatLogs: threatLogs,
  }
}

export function getThreatLogs() {
  return threatLogs.slice(0, 50) // Return last 50 threats
}

// Clean up old trackers every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, tracker] of requestTrackers.entries()) {
    // Remove trackers with no recent requests
    if (
      tracker.requests.length === 0 ||
      now - tracker.requests[tracker.requests.length - 1] > DDOS_CONFIG.TRACKING_WINDOW
    ) {
      if (!tracker.blocked) {
        requestTrackers.delete(ip)
      }
    }
  }
}, 300000)

export async function checkDDoS(
  req: NextRequest,
): Promise<{ allowed: boolean; reason?: string; blockedUntil?: number; permanent?: boolean }> {
  const result = await ddosProtection(req)

  if (result === null) {
    return { allowed: true }
  }

  // Handle structured response from ddosProtection
  if (typeof result === "object" && "blocked" in result) {
    return {
      allowed: !result.blocked,
      reason: result.reason || "Security policy violation",
      blockedUntil: result.blockedUntil,
      permanent: result.permanent || false,
    }
  }

  // Fallback
  return {
    allowed: false,
    reason: "Security policy violation",
  }
}
