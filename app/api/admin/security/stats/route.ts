import { type NextRequest, NextResponse } from "next/server"
import { getDDoSStats } from "@/lib/middleware/ddos-protection"

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

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ddosStats = getDDoSStats()

    return NextResponse.json({
      success: true,
      stats: {
        blockedIPs: Array.from(ddosStats.blacklistedIPs || []).length,
        whitelistedIPs: Array.from(ddosStats.whitelistedIPs || []).length,
        totalThreats: ddosStats.totalThreats || 0,
        totalRequests: ddosStats.totalRequests || 0,
        activeConnections: (ddosStats.activeIPs || []).length,
        recentBlocks: ddosStats.recentBlocks || [],
      },
    })
  } catch (error) {
    console.error("[SECURITY STATS] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch security stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
