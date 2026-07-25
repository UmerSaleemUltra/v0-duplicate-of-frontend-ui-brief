import type { NextRequest } from "next/server"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { refreshAccessToken } from "@/lib/secure-token-service"
import { getClientIpAddress } from "@/lib/device-fingerprint"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

/**
 * POST /api/auth/refresh
 * Refreshes an access token using a refresh token
 * Validates device fingerprint and IP address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken, deviceFingerprint } = body

    if (!refreshToken || !deviceFingerprint) {
      return apiError("Missing refresh token or device fingerprint", 400)
    }

    if (deviceFingerprint.length !== 64) {
      return apiError("Invalid device fingerprint format", 400)
    }

    // Get current IP and device info
    const currentIpAddress = getClientIpAddress(request)

    // Attempt token refresh with device/IP verification
    const tokenData = await refreshAccessToken(refreshToken, deviceFingerprint, currentIpAddress)

    if (!tokenData) {
      return addSecurityHeaders(apiError("Invalid refresh token or device/location mismatch. Please log in again.", 401))
    }

    // Create response with new tokens in httpOnly cookies
    const response = addSecurityHeaders(
      apiResponse({
        sessionId: tokenData.sessionId,
        success: true,
      }),
    )

    // Update httpOnly cookie with new access token
    response.cookies.set("accessToken", tokenData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Token refresh error:", error)
    return addSecurityHeaders(apiError("Failed to refresh token. Please try again.", 500))
  }
}
