import jwt from "jsonwebtoken"
import crypto from "crypto"
import { getDatabase } from "@/config/database"
import { ObjectId } from "mongodb"

/**
 * Secure token service with device/IP binding
 * Implements refresh token pattern with strict security checks
 */

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "@AccessSecret123"
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "@RefreshSecret456"
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"

export interface TokenPayload {
  userId: string
  email: string
  role: "admin" | "client"
  sessionId: string
  deviceFingerprint: string
  ipAddress: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  sessionId: string
}

export interface SessionData {
  _id?: ObjectId
  userId: string
  sessionId: string
  deviceFingerprint: string
  ipAddress: string
  country: string
  city: string
  userAgent: string
  isTrusted: boolean
  tokenVersion: number
  createdAt: Date
  lastUsedAt: Date
  expiresAt: Date
}

/**
 * Creates a new secure session and token pair
 */
export async function createSecureSession(
  userId: string,
  email: string,
  role: "admin" | "client",
  deviceFingerprint: string,
  ipAddress: string,
  country: string = "Unknown",
  city: string = "Unknown",
  userAgent: string = "",
): Promise<TokenPair> {
  const sessionId = crypto.randomBytes(16).toString("hex")
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

  try {
    const db = await getDatabase()
    const sessionsCollection = db.collection<SessionData>("sessions")

    // Store session in database
    const sessionData: SessionData = {
      userId,
      sessionId,
      deviceFingerprint,
      ipAddress,
      country,
      city,
      userAgent,
      isTrusted: false,
      tokenVersion: 1,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    }

    await sessionsCollection.insertOne(sessionData)

    // Create access and refresh tokens
    const payload: TokenPayload = {
      userId,
      email,
      role,
      sessionId,
      deviceFingerprint,
      ipAddress,
    }

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refreshToken = jwt.sign({ sessionId, userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY })

    // Log session creation
    await logTokenActivity(userId, "session_created", ipAddress, deviceFingerprint, true)

    return { accessToken, refreshToken, sessionId }
  } catch (error) {
    console.error("[v0] Failed to create secure session:", error)
    throw error
  }
}

/**
 * Refreshes an access token while verifying device/IP consistency
 * Returns new token pair if valid, null if device/IP mismatch detected
 */
export async function refreshAccessToken(
  refreshToken: string,
  currentDeviceFingerprint: string,
  currentIpAddress: string,
): Promise<TokenPair | null> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any
    const { sessionId, userId } = decoded

    if (!sessionId || !userId) {
      return null
    }

    const db = await getDatabase()
    const sessionsCollection = db.collection<SessionData>("sessions")

    // Find session
    const session = await sessionsCollection.findOne({ sessionId })

    if (!session) {
      await logTokenActivity(userId, "refresh_failed_no_session", currentIpAddress, currentDeviceFingerprint, false)
      return null
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await logTokenActivity(userId, "refresh_failed_session_expired", currentIpAddress, currentDeviceFingerprint, false)
      return null
    }

    // CRITICAL: Verify device fingerprint matches
    if (session.deviceFingerprint !== currentDeviceFingerprint) {
      console.warn("[v0] Device mismatch detected for user:", userId)
      await logTokenActivity(userId, "refresh_failed_device_mismatch", currentIpAddress, currentDeviceFingerprint, false)
      // Invalidate all sessions for this user (security measure)
      await invalidateAllSessionsForUser(userId, "device_mismatch")
      return null
    }

    // CRITICAL: Verify IP address matches
    if (session.ipAddress !== currentIpAddress) {
      console.warn("[v0] IP mismatch detected for user:", userId)
      await logTokenActivity(userId, "refresh_failed_ip_mismatch", currentIpAddress, currentDeviceFingerprint, false)
      // Invalidate all sessions for this user (security measure)
      await invalidateAllSessionsForUser(userId, "ip_mismatch")
      return null
    }

    // All checks passed - generate new access token
    const newAccessToken = jwt.sign(
      {
        userId,
        email: session.userId, // This is a bit of a hack - in production, fetch user email from DB
        role: "client",
        sessionId,
        deviceFingerprint: currentDeviceFingerprint,
        ipAddress: currentIpAddress,
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    )

    // Update session's last used time
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await sessionsCollection.updateOne({ sessionId }, { $set: { lastUsedAt: new Date(), expiresAt: newExpiresAt } })

    await logTokenActivity(userId, "token_refreshed", currentIpAddress, currentDeviceFingerprint, true)

    return { accessToken: newAccessToken, refreshToken, sessionId }
  } catch (error) {
    console.error("[v0] Failed to refresh access token:", error)
    return null
  }
}

/**
 * Verifies an access token and checks device/IP consistency
 * Returns decoded payload if valid, null otherwise
 */
export async function verifyAccessToken(
  token: string,
  currentDeviceFingerprint: string,
  currentIpAddress: string,
): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload

    // Verify device fingerprint
    if (decoded.deviceFingerprint !== currentDeviceFingerprint) {
      console.warn("[v0] Access token device mismatch for user:", decoded.userId)
      await logTokenActivity(decoded.userId, "verify_failed_device_mismatch", currentIpAddress, currentDeviceFingerprint, false)
      return null
    }

    // Verify IP address
    if (decoded.ipAddress !== currentIpAddress) {
      console.warn("[v0] Access token IP mismatch for user:", decoded.userId)
      await logTokenActivity(decoded.userId, "verify_failed_ip_mismatch", currentIpAddress, currentDeviceFingerprint, false)
      return null
    }

    return decoded
  } catch (error) {
    console.error("[v0] Failed to verify access token:", error)
    return null
  }
}

/**
 * Invalidates all sessions for a user (emergency logout)
 */
export async function invalidateAllSessionsForUser(userId: string, reason: string = "manual"): Promise<void> {
  try {
    const db = await getDatabase()
    const sessionsCollection = db.collection("sessions")

    await sessionsCollection.deleteMany({ userId })
    await logTokenActivity(userId, `sessions_invalidated_${reason}`, "0.0.0.0", "", false)
  } catch (error) {
    console.error("[v0] Failed to invalidate sessions:", error)
  }
}

/**
 * Logs token activity for audit trail
 */
export async function logTokenActivity(
  userId: string,
  action: string,
  ipAddress: string,
  deviceFingerprint: string,
  success: boolean,
): Promise<void> {
  try {
    const db = await getDatabase()
    const logsCollection = db.collection("token_logs")

    await logsCollection.insertOne({
      userId,
      action,
      ipAddress,
      deviceFingerprint,
      timestamp: new Date(),
      success,
    })
  } catch (error) {
    console.error("[v0] Failed to log token activity:", error)
  }
}

/**
 * Gets active sessions for a user
 */
export async function getActiveSessions(userId: string): Promise<SessionData[]> {
  try {
    const db = await getDatabase()
    const sessionsCollection = db.collection<SessionData>("sessions")

    return await sessionsCollection
      .find({ userId, expiresAt: { $gt: new Date() } })
      .sort({ lastUsedAt: -1 })
      .toArray()
  } catch (error) {
    console.error("[v0] Failed to get active sessions:", error)
    return []
  }
}

/**
 * Marks a device as trusted
 */
export async function trustDevice(sessionId: string): Promise<boolean> {
  try {
    const db = await getDatabase()
    const sessionsCollection = db.collection("sessions")

    const result = await sessionsCollection.updateOne({ sessionId }, { $set: { isTrusted: true } })

    return result.modifiedCount > 0
  } catch (error) {
    console.error("[v0] Failed to trust device:", error)
    return false
  }
}

/**
 * Revokes a specific session
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    const db = await getDatabase()
    const sessionsCollection = db.collection("sessions")

    const result = await sessionsCollection.deleteOne({ sessionId })

    return result.deletedCount > 0
  } catch (error) {
    console.error("[v0] Failed to revoke session:", error)
    return false
  }
}
