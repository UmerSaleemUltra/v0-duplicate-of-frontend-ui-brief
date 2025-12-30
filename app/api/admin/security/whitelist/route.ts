import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"
import { addToWhitelist } from "@/lib/middleware/ddos-protection"

export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || authResult.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 })
    }

    // Add to whitelist
    addToWhitelist(ip)

    console.log(`[ADMIN WHITELIST] IP ${ip} whitelisted by admin ${authResult.user.email}`)

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
