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
        console.error(`╔═══════════════════════════════════════════════════════════╗`)
        console.error(`║         REQUEST BLOCKED BY SECURITY SYSTEM               ║`)
        console.error(`╚═══════════════════════════════════════════════════════════╝`)
        console.error(`[PROXY BLOCK] IP: ${ip}`)
        console.error(`[PROXY BLOCK] Reason: ${ddosResult.reason}`)
        console.error(`[PROXY BLOCK] URL: ${request.url}`)
        console.error(`[PROXY BLOCK] Method: ${request.method}`)
        console.error(`[PROXY BLOCK] Timestamp: ${new Date().toISOString()}`)
        if (ddosResult.blockedUntil) {
          console.error(`[PROXY BLOCK] Unblock Time: ${new Date(ddosResult.blockedUntil).toISOString()}`)
        }
        console.error(`═══════════════════════════════════════════════════════════`)

        return NextResponse.json(
          {
            error: ddosResult.reason || "Access denied",
            blocked: true,
            details: {
              ip: ip,
              timestamp: new Date().toISOString(),
              url: request.url,
              method: request.method,
            },
          },
          {
            status: 403,
            headers: {
              "X-Security-Block": "true",
              "X-Blocked-IP": ip,
            },
          },
        )
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
