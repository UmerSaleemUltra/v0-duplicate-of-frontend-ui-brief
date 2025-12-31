import { NextResponse } from "next/server"
import { unblockIP } from "@/lib/middleware/ddos-protection"

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

    await unblockIP(ip)

    console.log(`[ADMIN UNBLOCK] IP ${ip} unblocked by admin`)

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been unblocked successfully`,
      unblockedIP: ip,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[UNBLOCK IP] Error:", error)
    return NextResponse.json({ error: "Failed to unblock IP address" }, { status: 500 })
  }
}
