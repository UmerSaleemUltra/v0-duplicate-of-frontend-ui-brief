import type { NextRequest } from "next/server"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { revokeSession } from "@/lib/secure-token-service"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

/**
 * POST /api/auth/logout
 * Logs out the user from current session
 * Revokes the current session and clears cookies
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("X-Session-ID")

    if (sessionId) {
      await revokeSession(sessionId)
    }

    // Create response with cleared cookies
    const response = addSecurityHeaders(
      apiResponse({
        success: true,
        message: "Logged out successfully",
      }),
    )

    // Clear all auth cookies
    response.cookies.delete("accessToken")
    response.cookies.delete("refreshToken")

    return response
  } catch (error) {
    console.error("[v0] Logout error:", error)
    // Still clear cookies even if database operation fails
    const response = addSecurityHeaders(
      apiResponse({
        success: true,
        message: "Logged out",
      }),
    )
    response.cookies.delete("accessToken")
    response.cookies.delete("refreshToken")
    return response
  }
}
