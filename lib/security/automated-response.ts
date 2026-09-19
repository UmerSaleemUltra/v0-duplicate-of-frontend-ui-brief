import type { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"

interface ThreatDetection {
  ip: string
  type: "brute_force" | "sql_injection" | "xss_attempt" | "ddos" | "suspicious_pattern" | "account_takeover"
  severity: "low" | "medium" | "high" | "critical"
  timestamp: number
  details: any
  action: "warn" | "throttle" | "block_temporary" | "block_permanent"
}

interface SecurityTracker {
  ip: string
  violations: ThreatDetection[]
  blocked: boolean
  blockedUntil?: number
  permanentBlock: boolean
  warningCount: number
}

const securityTrackers = new Map<string, SecurityTracker>()
const permanentBlocklist = new Set<string>()
const whitelistedIPs = new Set<string>([
  // Add your IPs here to whitelist them
  // Example: "123.456.789.0"
])

// Security Configuration
const SECURITY_CONFIG = {
  // Violation thresholds
  MAX_WARNINGS: 5,
  MAX_MEDIUM_VIOLATIONS: 5,
  MAX_HIGH_VIOLATIONS: 3,

  // Block durations (in milliseconds)
  TEMPORARY_BLOCK: 30 * 60 * 1000, // 30 minutes
  EXTENDED_BLOCK: 24 * 60 * 60 * 1000, // 24 hours

  // Pattern detection
  FAILED_LOGIN_THRESHOLD: 10,
  SQL_INJECTION_PATTERNS: [
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /UNION.*SELECT/i,
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE.*SET/i,
  ],
  XSS_PATTERNS: [/<script[^>]*>.*<\/script>/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i],
  SUSPICIOUS_PATHS: ["/../", "/etc/passwd", "/.git/", "/.env"],
}

// Detect threats in request
export async function detectThreats(req: NextRequest): Promise<ThreatDetection | null> {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  if (isWhitelisted(ip)) {
    return null
  }

  const url = new URL(req.url)
  const path = url.pathname
  const query = url.searchParams.toString()

  try {
    const body = await req.clone().text()
    const fullContent = `${path} ${query} ${body}`.toLowerCase()

    // Check for SQL Injection
    for (const pattern of SECURITY_CONFIG.SQL_INJECTION_PATTERNS) {
      if (pattern.test(fullContent)) {
        return {
          ip,
          type: "sql_injection",
          severity: "critical",
          timestamp: Date.now(),
          details: { pattern: pattern.toString(), path, query },
          action: "block_permanent",
        }
      }
    }

    // Check for XSS attempts
    for (const pattern of SECURITY_CONFIG.XSS_PATTERNS) {
      if (pattern.test(fullContent)) {
        return {
          ip,
          type: "xss_attempt",
          severity: "high",
          timestamp: Date.now(),
          details: { pattern: pattern.toString(), path, query },
          action: "block_temporary",
        }
      }
    }

    // Check for suspicious path access
    for (const suspiciousPath of SECURITY_CONFIG.SUSPICIOUS_PATHS) {
      if (path.includes(suspiciousPath)) {
        return {
          ip,
          type: "suspicious_pattern",
          severity: "medium",
          timestamp: Date.now(),
          details: { path, suspiciousPath },
          action: "throttle",
        }
      }
    }

    // Check for unusually long payloads (potential overflow attacks)
    if (body.length > 1000000) {
      // 1MB
      return {
        ip,
        type: "suspicious_pattern",
        severity: "medium",
        timestamp: Date.now(),
        details: { payloadSize: body.length },
        action: "throttle",
      }
    }
  } catch (error) {
    // Cannot read body, skip content inspection
  }

  return null
}

// Take automated action based on threat
export async function respondToThreat(threat: ThreatDetection) {
  const { ip, type, severity, action } = threat

  if (isWhitelisted(ip)) {
    console.log(`[SECURITY] Threat detected for whitelisted IP ${ip}, no action taken`)
    return null
  }

  let tracker = securityTrackers.get(ip)
  if (!tracker) {
    tracker = {
      ip,
      violations: [],
      blocked: false,
      permanentBlock: false,
      warningCount: 0,
    }
    securityTrackers.set(ip, tracker)
  }

  // Add violation to history
  tracker.violations.push(threat)

  try {
    const db = await connectDB()
    // Check if db and collection method exist
    if (db && typeof db.collection === "function") {
      await db.collection("security_logs").insertOne({
        ...threat,
        timestamp: new Date(threat.timestamp),
      })
    } else {
      console.warn("[SECURITY] Database collection method not available, skipping log")
    }
  } catch (error) {
    console.warn(
      "[SECURITY] Failed to log threat to database:",
      error instanceof Error ? error.message : "Unknown error",
    )
    // Continue with security action even if logging fails
  }

  // Take action based on severity and violation history
  switch (action) {
    case "warn":
      tracker.warningCount++
      console.warn(`[SECURITY] Warning #${tracker.warningCount} for IP ${ip}: ${type}`)

      if (tracker.warningCount >= SECURITY_CONFIG.MAX_WARNINGS) {
        tracker.blocked = true
        tracker.blockedUntil = Date.now() + SECURITY_CONFIG.TEMPORARY_BLOCK
        console.error(`[SECURITY] IP ${ip} temporarily blocked after ${tracker.warningCount} warnings`)
      }
      break

    case "throttle":
      tracker.blocked = true
      tracker.blockedUntil = Date.now() + SECURITY_CONFIG.TEMPORARY_BLOCK
      console.error(`[SECURITY] IP ${ip} temporarily blocked for ${type}`)
      break

    case "block_temporary":
      const highViolations = tracker.violations.filter((v) => v.severity === "high" || v.severity === "critical")

      if (highViolations.length >= SECURITY_CONFIG.MAX_HIGH_VIOLATIONS) {
        tracker.blocked = true
        tracker.blockedUntil = Date.now() + SECURITY_CONFIG.EXTENDED_BLOCK
        console.error(
          `[SECURITY] IP ${ip} blocked for 24 hours after ${highViolations.length} high-severity violations`,
        )
      } else {
        tracker.blocked = true
        tracker.blockedUntil = Date.now() + SECURITY_CONFIG.TEMPORARY_BLOCK
        console.error(`[SECURITY] IP ${ip} temporarily blocked for ${type}`)
      }
      break

    case "block_permanent":
      tracker.permanentBlock = true
      tracker.blocked = true
      permanentBlocklist.add(ip)
      console.error(`[SECURITY] IP ${ip} PERMANENTLY BLOCKED for ${type} (CRITICAL)`)

      // Alert admins (could send email/notification here)
      await alertAdmins(threat)
      break
  }

  return tracker
}

// Check if IP is blocked
export function isBlocked(ip: string): { blocked: boolean; reason?: string; unblockTime?: number } {
  if (isWhitelisted(ip)) {
    return { blocked: false }
  }

  // Check permanent blocklist
  if (permanentBlocklist.has(ip)) {
    return {
      blocked: true,
      reason: "Permanently blocked due to critical security violation",
    }
  }

  const tracker = securityTrackers.get(ip)
  if (!tracker) {
    return { blocked: false }
  }

  if (tracker.permanentBlock) {
    return {
      blocked: true,
      reason: "Permanently blocked due to critical security violation",
    }
  }

  if (tracker.blocked && tracker.blockedUntil) {
    if (Date.now() < tracker.blockedUntil) {
      return {
        blocked: true,
        reason: "Temporarily blocked due to suspicious activity",
        unblockTime: tracker.blockedUntil,
      }
    } else {
      // Unblock after duration
      tracker.blocked = false
      tracker.blockedUntil = undefined
      return { blocked: false }
    }
  }

  return { blocked: false }
}

// Alert admins of critical security events
async function alertAdmins(threat: ThreatDetection) {
  console.error(`[CRITICAL SECURITY ALERT]`, {
    ip: threat.ip,
    type: threat.type,
    severity: threat.severity,
    details: threat.details,
    timestamp: new Date(threat.timestamp).toISOString(),
  })

  // TODO: Send email/SMS/Slack notification to admins
  // This is where you'd integrate with your notification service
}

// Admin functions
export function unblockIP(ip: string) {
  permanentBlocklist.delete(ip)
  const tracker = securityTrackers.get(ip)
  if (tracker) {
    tracker.blocked = false
    tracker.permanentBlock = false
    tracker.blockedUntil = undefined
    tracker.violations = []
    tracker.warningCount = 0
  }
  console.log(`[SECURITY] IP ${ip} unblocked by admin`)
}

export function getSecurityStats() {
  const stats = {
    totalTracked: securityTrackers.size,
    permanentBlocks: permanentBlocklist.size,
    temporaryBlocks: 0,
    recentViolations: [] as ThreatDetection[],
  }

  const now = Date.now()
  for (const tracker of securityTrackers.values()) {
    if (tracker.blocked && tracker.blockedUntil && now < tracker.blockedUntil) {
      stats.temporaryBlocks++
    }
    stats.recentViolations.push(...tracker.violations.slice(-5))
  }

  return stats
}

// Cleanup old trackers on-demand
export function cleanupOldTrackers() {
  const now = Date.now()
  const oneHourAgo = now - 3600000

  for (const [ip, tracker] of securityTrackers.entries()) {
    if (!tracker.blocked && !tracker.permanentBlock) {
      const hasRecentViolation = tracker.violations.some((v) => v.timestamp > oneHourAgo)
      if (!hasRecentViolation) {
        securityTrackers.delete(ip)
      }
    }
  }
}

export function isWhitelisted(ip: string): boolean {
  return whitelistedIPs.has(ip)
}

export function addToWhitelist(ip: string) {
  whitelistedIPs.add(ip)
  console.log(`[SECURITY] IP ${ip} added to whitelist`)
}
