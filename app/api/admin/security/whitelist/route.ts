import { NextResponse } from "next/server"
import { addToWhitelist } from "@/lib/middleware/ddos-protection"

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

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

    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 })
    }

    addToWhitelist(ip)

    console.log(`[ADMIN WHITELIST] IP ${ip} whitelisted by admin`)

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been whitelisted successfully`,
      whitelistedIP: ip,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[WHITELIST IP] Error:", error)
    return NextResponse.json({ error: "Failed to whitelist IP address" }, { status: 500 })
  }
}
