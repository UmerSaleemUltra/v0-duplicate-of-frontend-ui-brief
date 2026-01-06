import type { NextResponse } from "next/server"

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; frame-src 'self' https://www.youtube.com https://youtube.com; connect-src 'self' https://buzzfiling.com https://v0-frontend-ui-brief.vercel.app https://*.buzzfiling.com https://*.blob.vercel-storage.com;",
  )

  return response
}

export const applySecurityHeaders = addSecurityHeaders
