import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { checkDDoS } from "@/lib/middleware/ddos-protection"

export async function proxy(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 200 })

      // Add CORS headers for preflight
      const origin = request.headers.get("origin")
      const allowedOrigins = [
        "https://buzzfiling.com",
        "https://www.buzzfiling.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ]

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin)
      }

      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      )
      response.headers.set("Access-Control-Allow-Credentials", "true")
      response.headers.set("Access-Control-Max-Age", "86400")

      return addSecurityHeaders(response)
    }

    const ddosResult = await checkDDoS(request)

    if (url.pathname === "/blocked") {
      const response = NextResponse.next()
      const origin = request.headers.get("origin")
      const allowedOrigins = [
        "https://buzzfiling.com",
        "https://www.buzzfiling.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ]

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin)
        response.headers.set("Access-Control-Allow-Credentials", "true")
      }

      return addSecurityHeaders(response)
    }

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

      const origin = request.headers.get("origin")
      const allowedOrigins = [
        "https://buzzfiling.com",
        "https://www.buzzfiling.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ]

      const headers: Record<string, string> = {
        "X-Security-Block": "true",
        "X-Blocked-IP": ip,
      }

      if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
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
          headers,
        },
      )
    }

    const response = NextResponse.next()

    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://buzzfiling.com",
      "https://www.buzzfiling.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ]

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }

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
