import type { NextRequest } from "next/server"
import { verifyAccessToken, logTokenActivity, invalidateAllSessionsForUser } from "@/lib/secure-token-service"
import { getGeoLocation, isImpossibleTravel } from "@/lib/geolocation"
import { getClientIpAddress } from "@/lib/device-fingerprint"
import { apiError } from "@/lib/api-middleware"

export interface VerifiedDevice {
  userId: string
  email: string
  role: string
  sessionId: string
  isValid: boolean
}

/**
 * Middleware to verify device/IP consistency on protected API routes
 * Extracts and validates access token, device fingerprint, and IP address
 * Returns error response if any security check fails
 */
export async function verifyDeviceAndIP(request: NextRequest): Promise<VerifiedDevice | Response> {
  try {
    // Extract access token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiError("Missing or invalid authorization token", 401)
    }

    const accessToken = authHeader.substring(7)

    // Extract device info from headers
    const deviceFingerprint = request.headers.get("X-Device-Fingerprint")
    const currentIpAddress = getClientIpAddress(request)

    if (!deviceFingerprint) {
      return apiError("Missing device fingerprint", 400)
    }

    if (deviceFingerprint.length !== 64) {
      return apiError("Invalid device fingerprint format", 400)
    }

    // Verify token with device/IP checks
    const tokenPayload = await verifyAccessToken(accessToken, deviceFingerprint, currentIpAddress)

    if (!tokenPayload) {
      return apiError("Invalid or expired token. Device or location mismatch detected.", 401)
    }

    // Additional security check: Verify token's claimed IP matches current IP
    if (tokenPayload.ipAddress !== currentIpAddress) {
      console.warn("[v0] IP mismatch on token verification:", {
        userId: tokenPayload.userId,
        tokenIp: tokenPayload.ipAddress,
        currentIp: currentIpAddress,
      })

      // Log suspicious activity
      await logTokenActivity(tokenPayload.userId, "ip_mismatch_detected", currentIpAddress, deviceFingerprint, false)

      // For extra safety, invalidate all sessions
      await invalidateAllSessionsForUser(tokenPayload.userId, "ip_mismatch")

      return apiError("Your session has been invalidated. Please log in again from your original location.", 403)
    }

    // Perform impossible travel check (optional but recommended for extra security)
    try {
      const currentGeo = await getGeoLocation(currentIpAddress)

      // In a real system, you'd have the previous location stored in session data
      // For now, we'll skip this check on refresh but it should be done on sensitive operations
      // This is left as a placeholder for future enhancement
    } catch (geoError) {
      // Geolocation failure is non-fatal - log but don't block
      console.warn("[v0] Geolocation check failed:", geoError)
    }

    return {
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      role: tokenPayload.role,
      sessionId: tokenPayload.sessionId,
      isValid: true,
    }
  } catch (error) {
    console.error("[v0] Device verification error:", error)
    return apiError("Security verification failed. Please try again.", 500)
  }
}

/**
 * Extract user ID from verified request
 * Safe to use after verifyDeviceAndIP passes
 */
export function extractUserId(verifiedDevice: VerifiedDevice | Response): string | null {
  if (verifiedDevice instanceof Response) {
    return null
  }
  return verifiedDevice.userId
}

/**
 * Check if response indicates an error
 */
export function isErrorResponse(response: any): boolean {
  return response instanceof Response
}
