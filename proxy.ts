import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityGuard } from "@/lib/middleware/security-guard"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { checkDDoS } from "@/lib/middleware/ddos-protection"

export async function proxy(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    try {
      const ddosResult = await checkDDoS(request)
      if (!ddosResult.allowed) {
        // Only log, don't actually block in monitoring mode
        console.log(`[SECURITY] DDoS detected for IP ${ip} - monitoring only`)
      }
    } catch (ddosError) {
      console.error("[SECURITY] DDoS check failed, allowing request:", ddosError)
    }

    try {
      const securityResult = await securityGuard(request)
      if (securityResult) {
        // Just log security issues, don't block
        console.log(`[SECURITY] Security issue detected - monitoring only`)
      }
    } catch (securityError) {
      console.error("[SECURITY] Security guard failed, allowing request:", securityError)
    }

    // Continue with the request and apply security headers
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  } catch (error) {
    console.error("[SECURITY] Middleware error:", error)
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
