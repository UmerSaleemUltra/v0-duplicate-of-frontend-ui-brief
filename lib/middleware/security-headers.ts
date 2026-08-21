import type { NextResponse } from "next/server"

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://www.googletagmanager.com https://wati-integration-prod-service.clare.ai https://invitejs.trustpilot.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob: https://cdn.brandfetch.io; font-src 'self' data:; frame-src 'self' https://www.youtube.com https://youtube.com; connect-src 'self' https://buzzfiling.com https://www.buzzfiling.com https://*.buzzfiling.com https://*.blob.vercel-storage.com https://www.googletagmanager.com https://www.google-analytics.com https://wati-integration-prod-service.clare.ai;",
  )

  return response
}

export const applySecurityHeaders = addSecurityHeaders
