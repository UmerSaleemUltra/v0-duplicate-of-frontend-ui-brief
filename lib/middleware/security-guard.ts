import { NextRequest, NextResponse } from "next/server"
import { detectThreats, respondToThreat, isBlocked } from "@/lib/security/automated-response"
import { applySecurityHeaders } from "./security-headers"

// Master security middleware that combines all protections
export async function securityGuard(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  // First check if IP is blocked
  const blockStatus = isBlocked(ip)
  if (blockStatus.blocked) {
    const response = NextResponse.json(
      { 
        error: blockStatus.reason || "Access denied",
        blocked: true,
        ...(blockStatus.unblockTime && {
          unblockIn: Math.ceil((blockStatus.unblockTime - Date.now()) / 1000 / 60) + " minutes"
        })
      },
      { status: 403 }
    )
    return applySecurityHeaders(response)
  }

  // Detect threats in the request
  const threat = await detectThreats(req)
  
  if (threat) {
    // Take automated action
    const tracker = await respondToThreat(threat)

    // Return appropriate response based on action taken
    if (tracker.permanentBlock) {
      const response = NextResponse.json(
        { 
          error: "Access permanently denied due to security violation",
          type: threat.type,
          severity: threat.severity
        },
        { status: 403 }
      )
      return applySecurityHeaders(response)
    }

    if (tracker.blocked && tracker.blockedUntil) {
      const minutesRemaining = Math.ceil((tracker.blockedUntil - Date.now()) / 1000 / 60)
      const response = NextResponse.json(
        { 
          error: `Access temporarily blocked due to ${threat.type}. Try again in ${minutesRemaining} minutes.`,
          unblockIn: minutesRemaining + " minutes"
        },
        { status: 429 }
      )
      return applySecurityHeaders(response)
    }
  }

  // Request is clean, proceed
  return null
}
