import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityGuard } from "@/lib/middleware/security-guard"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { checkDDoS } from "@/lib/middleware/ddos-protection"

export async function proxy(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const url = new URL(request.url)

    if (url.pathname === "/blocked" || url.pathname.startsWith("/admin/security")) {
      const response = NextResponse.next()
      return addSecurityHeaders(response)
    }

    try {
      const ddosResult = await checkDDoS(request)
      if (!ddosResult.allowed) {
        console.log("\n")
        console.log("╔════════════════════════════════════════════════════════════╗")
        console.log("║         🔒 ACCESS DENIED BY SECURITY SYSTEM               ║")
        console.log("╚════════════════════════════════════════════════════════════╝")
        console.log(`IP: ${ip}`)
        console.log(`Reason: ${ddosResult.reason}`)
        console.log(`URL: ${request.url}`)
        console.log(`Method: ${request.method}`)
        console.log(`Time: ${new Date().toISOString()}`)
        if (ddosResult.blockedUntil) {
          const remaining = Math.ceil((ddosResult.blockedUntil - Date.now()) / 1000 / 60)
          console.log(`Unblock in: ${remaining} minutes`)
        }
        if (ddosResult.permanent) {
          console.log(`Status: PERMANENTLY BLOCKED`)
        }
        console.log("════════════════════════════════════════════════════════════\n")

        const acceptHeader = request.headers.get("accept") || ""
        const isApiRequest = url.pathname.startsWith("/api/")

        if (!isApiRequest && acceptHeader.includes("text/html")) {
          const blockedUrl = new URL("/blocked", request.url)
          blockedUrl.searchParams.set("reason", ddosResult.reason || "Security policy violation")
          blockedUrl.searchParams.set("ip", ip)
          if (ddosResult.blockedUntil) {
            blockedUrl.searchParams.set("until", new Date(ddosResult.blockedUntil).toISOString())
          }
          if (ddosResult.permanent) {
            blockedUrl.searchParams.set("permanent", "true")
          }

          return NextResponse.redirect(blockedUrl, 307)
        }

        return NextResponse.json(
          {
            error: ddosResult.reason || "Access denied",
            blocked: true,
            details: {
              ip: ip,
              timestamp: new Date().toISOString(),
              url: request.url,
              method: request.method,
              ...(ddosResult.blockedUntil && { blockedUntil: new Date(ddosResult.blockedUntil).toISOString() }),
              ...(ddosResult.permanent && { permanent: true }),
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
