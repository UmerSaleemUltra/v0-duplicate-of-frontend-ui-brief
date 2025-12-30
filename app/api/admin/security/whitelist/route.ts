import { type NextRequest, NextResponse } from "next/server"
import { addToWhitelist as addToDDoSWhitelist } from "@/lib/middleware/ddos-protection"
import { addToWhitelist as addToSecurityWhitelist } from "@/lib/security/automated-response"

export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // Add to both whitelists
    addToDDoSWhitelist(ip)
    addToSecurityWhitelist(ip)

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been whitelisted`,
    })
  } catch (error) {
    console.error("[SECURITY] Failed to whitelist IP:", error)
    return NextResponse.json({ error: "Failed to whitelist IP" }, { status: 500 })
  }
}
