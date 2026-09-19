import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"

interface LoginAttempt {
  email: string
  timestamp: number
  ip: string
  success: boolean
}

const failedAttempts = new Map<string, LoginAttempt[]>()

const LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
  ATTEMPT_WINDOW: 900000, // 15 minutes
}

export async function trackLoginAttempt(
  email: string,
  ip: string,
  success: boolean
): Promise<{ locked: boolean; remainingAttempts?: number; unlockTime?: number }> {
  const now = Date.now()
  const attempts = failedAttempts.get(email) || []

  // Clean old attempts
  const recentAttempts = attempts.filter(
    attempt => now - attempt.timestamp < LOCKOUT_CONFIG.ATTEMPT_WINDOW
  )

  if (success) {
    // Clear failed attempts on successful login
    failedAttempts.delete(email)
    
    // Log successful login for security monitoring
    try {
      const db = await getDatabase()
      await db.collection("security_logs").insertOne({
        type: "login_success",
        email,
        ip,
        timestamp: new Date(),
      })
    } catch (error) {
      // Non-fatal
    }
    
    return { locked: false }
  }

  // Add failed attempt
  recentAttempts.push({
    email,
    timestamp: now,
    ip,
    success: false,
  })

  failedAttempts.set(email, recentAttempts)

  // Log failed attempt
  try {
    const db = await getDatabase()
    await db.collection("security_logs").insertOne({
      type: "login_failed",
      email,
      ip,
      timestamp: new Date(),
      attemptCount: recentAttempts.length,
    })
  } catch (error) {
    // Non-fatal
  }

  // Check if account should be locked
  if (recentAttempts.length >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    const unlockTime = now + LOCKOUT_CONFIG.LOCKOUT_DURATION
    
    // Log account lockout
    console.warn(`[SECURITY] Account ${email} locked due to ${recentAttempts.length} failed login attempts from IP ${ip}`)
    
    try {
      const db = await getDatabase()
      await db.collection("security_logs").insertOne({
        type: "account_locked",
        email,
        ip,
        timestamp: new Date(),
        failedAttempts: recentAttempts.length,
      })
    } catch (error) {
      // Non-fatal
    }
    
    return {
      locked: true,
      unlockTime,
    }
  }

  return {
    locked: false,
    remainingAttempts: LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - recentAttempts.length,
  }
}

export function isAccountLocked(email: string): { locked: boolean; unlockTime?: number } {
  const now = Date.now()
  const attempts = failedAttempts.get(email) || []

  // Clean old attempts
  const recentAttempts = attempts.filter(
    attempt => now - attempt.timestamp < LOCKOUT_CONFIG.ATTEMPT_WINDOW
  )

  if (recentAttempts.length < LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    return { locked: false }
  }

  const lastAttempt = recentAttempts[recentAttempts.length - 1]
  const unlockTime = lastAttempt.timestamp + LOCKOUT_CONFIG.LOCKOUT_DURATION

  if (now >= unlockTime) {
    // Lockout expired
    failedAttempts.delete(email)
    return { locked: false }
  }

  return {
    locked: true,
    unlockTime,
  }
}

// Clean up old attempts every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [email, attempts] of failedAttempts.entries()) {
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < LOCKOUT_CONFIG.ATTEMPT_WINDOW
    )
    if (recentAttempts.length === 0) {
      failedAttempts.delete(email)
    } else {
      failedAttempts.set(email, recentAttempts)
    }
  }
}, 300000)
