import type { NextRequest } from "next/server"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { verifyDeviceAndIP } from "@/lib/middleware/verify-device"
import { invalidateAllSessionsForUser } from "@/lib/secure-token-service"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

/**
 * POST /api/auth/logout-all
 * Emergency logout - invalidates all sessions for the user
 * Used when user suspects account compromise
 */
export async function POST(request: NextRequest) {
  try {
    // Verify device and IP
    const verified = await verifyDeviceAndIP(request)

    if (verified instanceof Response) {
      return verified
    }

    // Invalidate all sessions for this user
    await invalidateAllSessionsForUser(verified.userId, "emergency_logout")

    // Create response with cleared cookies
    const response = addSecurityHeaders(
      apiResponse({
        success: true,
        message: "All sessions have been invalidated",
      }),
    )

    // Clear all auth cookies
    response.cookies.delete("accessToken")
    response.cookies.delete("refreshToken")

    return response
  } catch (error) {
    console.error("[v0] Failed to logout all sessions:", error)
    return addSecurityHeaders(apiError("Failed to logout from all devices", 500))
  }
}
