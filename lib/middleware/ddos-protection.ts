import { type NextRequest, NextResponse } from "next/server"

interface RequestTracker {
  requests: number[]
  suspiciousActivity: number
  blocked: boolean
  blockedUntil?: number
}

const requestTrackers = new Map<string, RequestTracker>()
const blacklistedIPs = new Set<string>()
const whitelistedIPs = new Set<string>([
  // Add your IPs here to whitelist them
])

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
    console.error(`[DDOS BLOCK] Blacklisted IP attempted access: ${ip}`)
    console.error(`[DDOS BLOCK] Timestamp: ${new Date().toISOString()}`)
    console.error(`[DDOS BLOCK] Request URL: ${req.url}`)

    return NextResponse.json(
      {
        error: "Access denied. Your IP has been permanently blocked.",
        reason: "Blacklisted IP - DDoS protection",
        blocked: true,
        permanent: true,
        timestamp: new Date().toISOString(),
        ip: ip,
      },
      {
        status: 403,
        headers: {
          "X-Block-Reason": "blacklist",
          "X-Blocked-IP": ip,
        },
      },
    )
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

  // Check if IP is temporarily blocked
  if (tracker.blocked && tracker.blockedUntil) {
    if (now < tracker.blockedUntil) {
      const remainingTime = Math.ceil((tracker.blockedUntil - now) / 1000 / 60)
      console.error(`[DDOS BLOCK] Temporarily blocked IP attempted access: ${ip}`)
      console.error(`[DDOS BLOCK] Remaining time: ${remainingTime} minutes`)

      return NextResponse.json(
        {
          error: `DDoS protection activated. Your IP is temporarily blocked.`,
          reason: "Too many requests detected",
          blocked: true,
          temporary: true,
          remainingMinutes: remainingTime,
          unblockTime: new Date(tracker.blockedUntil).toISOString(),
          timestamp: new Date().toISOString(),
          ip: ip,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((tracker.blockedUntil - now) / 1000)),
            "X-Block-Reason": "rate-limit",
            "X-Blocked-IP": ip,
            "X-Unblock-Time": new Date(tracker.blockedUntil).toISOString(),
          },
        },
      )
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

    console.error(`╔═══════════════════════════════════════════════════════════╗`)
    console.error(`║         🚨 CRITICAL SECURITY ALERT 🚨                    ║`)
    console.error(`╚═══════════════════════════════════════════════════════════╝`)
    console.error(`[DDOS ATTACK] IP: ${ip}`)
    console.error(`[DDOS ATTACK] Request Count: ${tracker.requests.length} requests`)
    console.error(`[DDOS ATTACK] Time Window: Last 60 seconds`)
    console.error(`[DDOS ATTACK] Action: PERMANENTLY BLACKLISTED + 30min temp block`)
    console.error(`[DDOS ATTACK] Timestamp: ${new Date().toISOString()}`)
    console.error(`[DDOS ATTACK] Request URL: ${req.url}`)
    console.error(`═══════════════════════════════════════════════════════════`)

    return NextResponse.json(
      {
        error: "🚨 DDoS Attack Detected - IP Permanently Blocked",
        reason: "Aggressive request pattern (500+ requests/min)",
        blocked: true,
        permanent: true,
        requestCount: tracker.requests.length,
        threshold: DDOS_CONFIG.AGGRESSIVE_BLOCK_THRESHOLD,
        timestamp: new Date().toISOString(),
        ip: ip,
        message: "Your IP has been flagged for automated attack behavior and permanently blacklisted.",
      },
      {
        status: 403,
        headers: {
          "X-Block-Reason": "ddos-attack",
          "X-Blocked-IP": ip,
          "X-Request-Count": String(tracker.requests.length),
        },
      },
    )
  }

  const recentRequests = tracker.requests.filter((timestamp) => now - timestamp < 1000)
  if (recentRequests.length > DDOS_CONFIG.MAX_REQUESTS_PER_SECOND) {
    tracker.suspiciousActivity++

    if (tracker.suspiciousActivity >= DDOS_CONFIG.SUSPICIOUS_THRESHOLD) {
      tracker.blocked = true
      tracker.blockedUntil = now + DDOS_CONFIG.BLOCK_DURATION

      console.error(`[DDOS BLOCK] IP ${ip} TEMPORARILY BLOCKED`)
      console.error(`[DDOS BLOCK] Reason: Sustained high request rate`)
      console.error(`[DDOS BLOCK] Rate: ${recentRequests.length} req/sec`)
      console.error(`[DDOS BLOCK] Duration: 30 minutes`)

      return NextResponse.json(
        {
          error: "⚠️ DDoS Protection Triggered - Temporary Block",
          reason: "Sustained high request rate",
          blocked: true,
          temporary: true,
          requestsPerSecond: recentRequests.length,
          threshold: DDOS_CONFIG.MAX_REQUESTS_PER_SECOND,
          blockDuration: "30 minutes",
          timestamp: new Date().toISOString(),
          ip: ip,
        },
        {
          status: 429,
          headers: {
            "X-Block-Reason": "rate-limit-sustained",
            "X-Blocked-IP": ip,
          },
        },
      )
    }

    console.warn(`[DDOS WARNING] IP ${ip} - High request rate: ${recentRequests.length} req/sec`)
    return NextResponse.json(
      {
        error: "⚠️ Rate Limit Warning",
        reason: "Request rate too high",
        warning: true,
        requestsPerSecond: recentRequests.length,
        limit: DDOS_CONFIG.MAX_REQUESTS_PER_SECOND,
        message: "Please slow down your requests to avoid being blocked.",
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-Rate-Limit-Warning": "true",
        },
      },
    )
  }

  // Check requests per minute
  if (tracker.requests.length > DDOS_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    tracker.suspiciousActivity++
    console.warn(`[SECURITY] IP ${ip} exceeded rate limit: ${tracker.requests.length} requests in last minute`)
    return NextResponse.json(
      { error: "Too many requests in the last minute. Please wait before trying again." },
      { status: 429 },
    )
  }

  // Check payload size
  const contentLength = req.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength) > DDOS_CONFIG.MAX_PAYLOAD_SIZE) {
    tracker.suspiciousActivity++
    return NextResponse.json({ error: "Request payload too large." }, { status: 413 })
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
    // Permanent ban - no expiry
    tracker.blockedUntil = undefined
  }

  requestTrackers.set(ip, tracker)
  console.log(
    `[SECURITY] IP ${ip} manually blacklisted ${duration ? `for ${duration / 1000 / 60} minutes` : "permanently"}`,
  )
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
  console.log(`[SECURITY] IP ${ip} removed from blacklist`)
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
): Promise<{ allowed: boolean; reason?: string; blockedUntil?: number }> {
  const result = await ddosProtection(req)

  if (result === null) {
    return { allowed: true }
  }

  // Extract information from the response
  const jsonResponse = await result.json()
  const retryAfter = result.headers.get("Retry-After")

  return {
    allowed: false,
    reason: jsonResponse.error,
    blockedUntil: retryAfter ? Date.now() + Number.parseInt(retryAfter) * 1000 : undefined,
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
  }
}
