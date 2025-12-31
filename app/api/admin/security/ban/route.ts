import { NextResponse } from "next/server"
import { blockIP } from "@/lib/middleware/ddos-protection"

function getAuthToken(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Check cookies
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=")
        return [key, v.join("=")]
      }),
    )
    return cookies.admin_auth_token || cookies.auth_token || null
  }

  return null
}

export async function POST(request: Request) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No auth token" }, { status: 401 })
    }

    const body = await request.json()
    const { ip, duration, reason } = body

    if (!ip || !duration || !reason) {
      return NextResponse.json({ error: "IP, duration, and reason are required" }, { status: 400 })
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 })
    }

    let durationMs: number | undefined
    if (duration === "30min") {
      durationMs = 30 * 60 * 1000
    } else if (duration === "24h") {
      durationMs = 24 * 60 * 60 * 1000
    } else if (duration === "permanent") {
      durationMs = undefined
    }

    await blockIP(ip, durationMs, reason)

    console.log(`[ADMIN BAN] IP ${ip} banned by admin for ${duration}. Reason: ${reason}`)

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been banned successfully for ${duration}`,
      bannedIP: ip,
      duration,
      reason,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[BAN IP] Error:", error)
    return NextResponse.json({ error: "Failed to ban IP address" }, { status: 500 })
  }
}
