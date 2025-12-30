import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityGuard } from "@/lib/middleware/security-guard"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { checkDDoS } from "@/lib/middleware/ddos-protection"

export async function proxy(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const ddosResult = await checkDDoS(request)
    if (!ddosResult.allowed) {
      console.warn(`[SECURITY] DDoS protection blocked IP ${ip}`)
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: ddosResult.reason,
          blockedUntil: ddosResult.blockedUntil,
        },
        { status: 429 },
      )
      return addSecurityHeaders(response)
    }

    const securityResult = await securityGuard(request)
    if (securityResult) {
      return securityResult // Already has security headers applied
    }

    // Continue with the request and apply security headers
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  } catch (error) {
    console.error("[SECURITY] Middleware error:", error)
    // On error, still apply security headers
    return addSecurityHeaders(NextResponse.next())
  }
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
