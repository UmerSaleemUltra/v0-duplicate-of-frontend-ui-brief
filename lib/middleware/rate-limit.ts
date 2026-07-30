import { NextRequest, NextResponse } from "next/server"

interface RateLimitStore {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitStore>()

export function rateLimit(options: {
  windowMs?: number
  maxRequests?: number
} = {}) {
  const windowMs = options.windowMs || 60000 // 1 minute
  const maxRequests = options.maxRequests || 100

  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const key = `${ip}:${new URL(req.url).pathname}`
    const now = Date.now()

    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return null
    }

    if (entry.count >= maxRequests) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)),
          }
        }
      )
    }

    entry.count++
    return null
  }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 300000)

// --- Burst rate limiter ---
// Tracks per-IP request timestamps within a short window.
// Blocked IPs are permanently locked for the session lifetime.

interface BurstStore {
  timestamps: number[]
  blocked: boolean
}

const burstStore = new Map<string, BurstStore>()

/**
 * Burst limiter: allows at most `maxRequests` hits within `windowMs`.
 * Once exceeded, the IP is blocked and all subsequent requests are rejected
 * with a 429 until the server restarts.
 */
export function burstRateLimit(options: {
  windowMs?: number
  maxRequests?: number
} = {}) {
  const windowMs = options.windowMs ?? 1000   // 1 second
  const maxRequests = options.maxRequests ?? 5

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    const now = Date.now()

    let entry = burstStore.get(ip)

    if (!entry) {
      entry = { timestamps: [], blocked: false }
      burstStore.set(ip, entry)
    }

    // Already permanently blocked
    if (entry.blocked) {
      return NextResponse.json(
        { error: "Too many requests. Your device has been temporarily blocked." },
        { status: 429, headers: { "Retry-After": "60" } }
      )
    }

    // Slide window: keep only timestamps within the last windowMs
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
    entry.timestamps.push(now)

    if (entry.timestamps.length > maxRequests) {
      entry.blocked = true
      return NextResponse.json(
        { error: "Too many requests. Your device has been temporarily blocked." },
        { status: 429, headers: { "Retry-After": "60" } }
      )
    }

    return null
  }
}

// Clean up burst store entries older than 2 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of burstStore.entries()) {
    if (!entry.blocked && entry.timestamps.every((t) => now - t > 120000)) {
      burstStore.delete(ip)
    }
  }
}, 120000)
