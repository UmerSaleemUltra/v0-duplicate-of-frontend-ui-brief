import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"
import { blockIP } from "@/lib/middleware/ddos-protection"

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || authResult.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      durationMs = 30 * 60 * 1000 // 30 minutes
    } else if (duration === "24h") {
      durationMs = 24 * 60 * 60 * 1000 // 24 hours
    } else if (duration === "permanent") {
      durationMs = undefined // Permanent ban
    }

    // Block the IP with duration
    blockIP(ip, durationMs)

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
