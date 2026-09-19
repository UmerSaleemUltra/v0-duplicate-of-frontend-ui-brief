import { NextResponse } from "next/server"
import { removeBannedIP } from "@/lib/security/security-db"
import { getDatabase } from "@/config/database"

/**
 * EMERGENCY UNBLOCK ENDPOINT
 * Use this when your IP is permanently blocked and cannot access the admin panel
 * Pass your IP and a master admin secret to instantly unblock yourself
 */

export async function POST(request: Request) {
  try {
    const { ip, masterSecret } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // SECURITY: Check master secret (set this to a strong password in your .env)
    const MASTER_UNBLOCK_SECRET = process.env.MASTER_UNBLOCK_SECRET || "admin123"

    if (masterSecret !== MASTER_UNBLOCK_SECRET) {
      console.warn(`[EMERGENCY UNBLOCK] Unauthorized attempt to unblock ${ip}`)
      return NextResponse.json({ error: "Invalid master secret" }, { status: 401 })
    }

    // Get database and remove the IP from banned_ips collection
    const db = await getDatabase()
    const bannedIPsCollection = db.collection("banned_ips")

    // Remove from database
    const result = await bannedIPsCollection.deleteOne({ ip })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: true,
        message: `IP ${ip} was not in the banned list (already unblocked)`,
        status: "already_unblocked",
        timestamp: new Date().toISOString(),
      })
    }

    // Also clear from in-memory cache via removeBannedIP function
    await removeBannedIP(ip)

    console.log(`[EMERGENCY UNBLOCK] IP ${ip} permanently unblocked - PERMANENT BLOCK REMOVED`)

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been PERMANENTLY UNBLOCKED`,
      status: "unblocked",
      unblockedIP: ip,
      timestamp: new Date().toISOString(),
      note: "Permanent block has been removed. System will now allow requests from this IP.",
    })
  } catch (error) {
    console.error("[EMERGENCY UNBLOCK] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to unblock IP address",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/**
 * GET endpoint to check if an IP is blocked
 * Usage: GET /api/admin/security/emergency-unblock?ip=YOUR_IP&masterSecret=YOUR_SECRET
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const ip = url.searchParams.get("ip")
    const masterSecret = url.searchParams.get("masterSecret")

    const MASTER_UNBLOCK_SECRET = process.env.MASTER_UNBLOCK_SECRET || "admin123"

    if (masterSecret !== MASTER_UNBLOCK_SECRET) {
      return NextResponse.json({ error: "Invalid master secret" }, { status: 401 })
    }

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bannedIPsCollection = db.collection("banned_ips")

    const bannedIP = await bannedIPsCollection.findOne({ ip })

    if (!bannedIP) {
      return NextResponse.json({
        ip,
        blocked: false,
        message: `IP ${ip} is NOT blocked`,
        status: "active",
      })
    }

    return NextResponse.json({
      ip,
      blocked: true,
      permanent: bannedIP.permanent,
      reason: bannedIP.reason,
      bannedAt: bannedIP.bannedAt,
      expiresAt: bannedIP.expiresAt || null,
      type: bannedIP.type,
      message: `IP ${ip} is BLOCKED`,
      status: bannedIP.permanent ? "permanent_block" : "temporary_block",
    })
  } catch (error) {
    console.error("[EMERGENCY CHECK] Error:", error)
    return NextResponse.json({ error: "Failed to check IP status" }, { status: 500 })
  }
}
