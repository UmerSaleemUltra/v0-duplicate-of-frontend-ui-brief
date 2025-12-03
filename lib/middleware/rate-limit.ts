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
