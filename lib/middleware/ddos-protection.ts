import type { NextRequest } from "next/server"
import { logSecurityThreat, saveBannedIP, removeBannedIP } from "@/lib/security/security-db"

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

const threatLogs: ThreatLog[] = []
const MAX_THREAT_LOGS = 100

function logThreat(threat: ThreatLog) {
  threatLogs.unshift(threat)
  if (threatLogs.length > MAX_THREAT_LOGS) {
    threatLogs.pop()
  }

  // Save to MongoDB
  const severity =
    threat.requestCount > 500
      ? "critical"
      : threat.requestCount > 200
        ? "high"
        : threat.requestCount > 50
          ? "medium"
          : "low"

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
  AGGRESSIVE_BLOCK_THRESHOLD: 500, // Lower threshold to catch DDoS attacks
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
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  if (blacklistedIPs.has(ip)) {
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
      permanent: true,
      reason: "Your IP has been permanently blocked due to security violations",
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
      // Unblock after duration expires
      tracker.blocked = false
      tracker.blockedUntil = undefined
      tracker.suspiciousActivity = 0
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
    console.log(`Action: PERMANENTLY BLACKLISTED + 30min temporary block`)
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

    return {
      blocked: true,
      permanent: true,
      reason: `Aggressive request pattern detected (${tracker.requests.length} requests in 60 seconds)`,
      requestCount: tracker.requests.length,
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
export function blockIP(ip: string, duration?: number) {
  blacklistedIPs.add(ip)

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
  console.log("════════════════════════════════════════════════════════════\n")

  logThreat({
    ip,
    timestamp: Date.now(),
    requestCount: 0,
    reason: `Manually banned by admin`,
    action: duration ? `TEMP BANNED (${duration / 1000 / 60}min)` : "PERMANENTLY BANNED",
  })

  // Save to MongoDB
  saveBannedIP({
    ip,
    reason: "Manually banned by admin",
    bannedAt: new Date(),
    bannedBy: "admin",
    duration,
    expiresAt: duration ? new Date(Date.now() + duration) : undefined,
    permanent: !duration,
    type: "manual",
  }).catch((err) => console.error("[DDOS] Failed to save ban to DB:", err))
}

// Admin function to unblock an IP
export function unblockIP(ip: string) {
  blacklistedIPs.delete(ip)
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

  // Remove from MongoDB
  removeBannedIP(ip).catch((err) => console.error("[DDOS] Failed to remove ban from DB:", err))
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
      allowed: false,
      reason: result.reason || "Security policy violation",
      blockedUntil: result.blockedUntil,
      permanent: result.permanent || false,
    }
  }

  // Legacy handling for JSON responses (shouldn't reach here anymore)
  const jsonResponse = await result.json()
  const retryAfter = result.headers.get("Retry-After")

  return {
    allowed: false,
    reason: jsonResponse.error,
    blockedUntil: retryAfter ? Date.now() + Number.parseInt(retryAfter) * 1000 : undefined,
    permanent: jsonResponse.permanent || false,
  }
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
