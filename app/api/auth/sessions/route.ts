import type { NextRequest } from "next/server"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { verifyDeviceAndIP } from "@/lib/middleware/verify-device"
import { getActiveSessions, revokeSession } from "@/lib/secure-token-service"
import { formatGeoLocation } from "@/lib/geolocation"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

/**
 * GET /api/auth/sessions
 * Returns list of active sessions for the current user
 * Requires valid access token with device/IP verification
 */
export async function GET(request: NextRequest) {
  try {
    // Verify device and IP
    const verified = await verifyDeviceAndIP(request)

    if (verified instanceof Response) {
      return verified
    }

    // Get active sessions
    const sessions = await getActiveSessions(verified.userId)

    const formattedSessions = sessions.map((session) => ({
      sessionId: session.sessionId,
      device: session.userAgent || "Unknown Device",
      location: `${session.city}, ${session.country}`,
      ipAddress: session.ipAddress,
      isTrusted: session.isTrusted,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
    }))

    return addSecurityHeaders(
      apiResponse({
        sessions: formattedSessions,
        totalSessions: formattedSessions.length,
      }),
    )
  } catch (error) {
    console.error("[v0] Failed to get sessions:", error)
    return addSecurityHeaders(apiError("Failed to retrieve sessions", 500))
  }
}

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revokes a specific session
 * User can remotely logout from other devices
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify device and IP
    const verified = await verifyDeviceAndIP(request)

    if (verified instanceof Response) {
      return verified
    }

    // Extract sessionId from URL
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("sessionId")

    if (!sessionId) {
      return apiError("Missing sessionId parameter", 400)
    }

    // Revoke the session
    const success = await revokeSession(sessionId)

    if (!success) {
      return addSecurityHeaders(apiError("Failed to revoke session", 500))
    }

    return addSecurityHeaders(
      apiResponse({
        success: true,
        message: "Session revoked successfully",
      }),
    )
  } catch (error) {
    console.error("[v0] Failed to revoke session:", error)
    return addSecurityHeaders(apiError("Failed to revoke session", 500))
  }
}
