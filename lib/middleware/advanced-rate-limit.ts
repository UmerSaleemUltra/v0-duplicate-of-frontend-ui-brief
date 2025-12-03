import { type NextRequest, NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetTime: number
  requests: number[]
}

const userAttempts = new Map<string, RateLimitEntry>()
const ipAttempts = new Map<string, RateLimitEntry>()
const passwordUpdateAttempts = new Map<string, RateLimitEntry>()

const LIMITS = {
  LOGIN: {
    PER_USER: { max: 5, windowMs: 900000 }, // 5 attempts per 15 minutes
    PER_IP: { max: 10, windowMs: 900000 }, // 10 attempts per 15 minutes
  },
  PASSWORD_UPDATE: {
    PER_USER: { max: 3, windowMs: 900000 }, // 3 attempts per 15 minutes
  },
}

function cleanupOldEntries(store: Map<string, RateLimitEntry>, windowMs: number) {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key)
    } else {
      entry.requests = entry.requests.filter((time) => now - time < windowMs)
      entry.count = entry.requests.length
    }
  }
}

export async function loginRateLimit(req: NextRequest, email: string) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const now = Date.now()

  // Check IP-based limit
  let ipEntry = ipAttempts.get(ip)
  if (!ipEntry || now > ipEntry.resetTime) {
    ipEntry = {
      count: 0,
      resetTime: now + LIMITS.LOGIN.PER_IP.windowMs,
      requests: [],
    }
    ipAttempts.set(ip, ipEntry)
  }

  ipEntry.requests = ipEntry.requests.filter((time) => now - time < LIMITS.LOGIN.PER_IP.windowMs)

  if (ipEntry.requests.length >= LIMITS.LOGIN.PER_IP.max) {
    const retryAfter = Math.ceil((ipEntry.resetTime - now) / 1000)
    return NextResponse.json(
      {
        error: "Too many login attempts from this IP address. Please try again later.",
        retryAfter,
        remainingTime: Math.ceil(retryAfter / 60),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(LIMITS.LOGIN.PER_IP.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(ipEntry.resetTime),
        },
      },
    )
  }

  // Check user-based limit
  let userEntry = userAttempts.get(email)
  if (!userEntry || now > userEntry.resetTime) {
    userEntry = {
      count: 0,
      resetTime: now + LIMITS.LOGIN.PER_USER.windowMs,
      requests: [],
    }
    userAttempts.set(email, userEntry)
  }

  userEntry.requests = userEntry.requests.filter((time) => now - time < LIMITS.LOGIN.PER_USER.windowMs)

  if (userEntry.requests.length >= LIMITS.LOGIN.PER_USER.max) {
    const retryAfter = Math.ceil((userEntry.resetTime - now) / 1000)
    return NextResponse.json(
      {
        error: "Too many login attempts for this account. Please try again later.",
        retryAfter,
        remainingTime: Math.ceil(retryAfter / 60),
        remainingAttempts: 0,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(LIMITS.LOGIN.PER_USER.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(userEntry.resetTime),
        },
      },
    )
  }

  // Record this attempt
  ipEntry.requests.push(now)
  ipEntry.count = ipEntry.requests.length

  userEntry.requests.push(now)
  userEntry.count = userEntry.requests.length

  return {
    ipRemaining: LIMITS.LOGIN.PER_IP.max - ipEntry.count,
    userRemaining: LIMITS.LOGIN.PER_USER.max - userEntry.count,
    resetTime: userEntry.resetTime,
  }
}

export async function passwordUpdateRateLimit(email: string) {
  const now = Date.now()

  let entry = passwordUpdateAttempts.get(email)
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + LIMITS.PASSWORD_UPDATE.PER_USER.windowMs,
      requests: [],
    }
    passwordUpdateAttempts.set(email, entry)
  }

  entry.requests = entry.requests.filter((time) => now - time < LIMITS.PASSWORD_UPDATE.PER_USER.windowMs)

  if (entry.requests.length >= LIMITS.PASSWORD_UPDATE.PER_USER.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      retryAfter,
      remainingTime: Math.ceil(retryAfter / 60),
    }
  }

  entry.requests.push(now)
  entry.count = entry.requests.length

  return {
    allowed: true,
    remaining: LIMITS.PASSWORD_UPDATE.PER_USER.max - entry.count,
    resetTime: entry.resetTime,
  }
}

export function clearLoginAttempts(email: string) {
  userAttempts.delete(email)
}

// Cleanup every 5 minutes
setInterval(() => {
  cleanupOldEntries(userAttempts, LIMITS.LOGIN.PER_USER.windowMs)
  cleanupOldEntries(ipAttempts, LIMITS.LOGIN.PER_IP.windowMs)
  cleanupOldEntries(passwordUpdateAttempts, LIMITS.PASSWORD_UPDATE.PER_USER.windowMs)
}, 300000)
