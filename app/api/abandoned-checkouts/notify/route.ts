import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { deduplicateAbandonedCheckout, checkIfUserHasCompletedOrder } from "@/lib/abandoned-checkout-service"
import { sendUserEmail, emailTemplates } from "@/config/email"
import { sendPushToLead } from "@/lib/push-server"

const EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000 // once per lead per 24h

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, "")
  const origin = request.headers.get("origin")
  if (origin) return origin.replace(/\/$/, "")
  const host = request.headers.get("host")
  const proto = request.headers.get("x-forwarded-proto") || "https"
  return host ? `${proto}://${host}` : "https://www.buzzfiling.com"
}

/**
 * Fired when a lead closes/leaves the checkout page (via sendBeacon).
 * Records the abandoned checkout, pushes a device notification, and sends a
 * branded recovery email — at most once per lead per 24 hours.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      email,
      name,
      phone,
      lastStep,
      state,
      packageType,
      businessName,
      estimatedTotal,
      packagePrice,
      addons,
    } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const { db } = await connectDB()
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null

    // Do not chase customers who already completed an order.
    if (normalizedEmail) {
      const hasOrder = await checkIfUserHasCompletedOrder(db, normalizedEmail)
      if (hasOrder) {
        return NextResponse.json({ success: true, skipped: "already_ordered" })
      }
    }

    // Persist / merge progress into the single lead document.
    await deduplicateAbandonedCheckout(db, sessionId, normalizedEmail, {
      name,
      phone,
      lastStep,
      state,
      packageType,
      businessName,
      estimatedTotal,
      packagePrice,
      addons,
    })

    const baseUrl = getBaseUrl(request)
    const resumeLink = `${baseUrl}/checkout?resume=${encodeURIComponent(sessionId)}`

    // Device push (no-ops safely if VAPID keys are not configured).
    const pushed = await sendPushToLead(
      db,
      { sessionId, email: normalizedEmail },
      {
        title: "Your BuzzFiling order is waiting",
        body: "You're just a few steps away from completing your filing. Tap to resume.",
        url: resumeLink,
        tag: "buzzfiling-abandoned-checkout",
      },
    )

    // Instant recovery email with a 24h per-lead cooldown.
    let emailed = false
    if (normalizedEmail) {
      const collection = db.collection("abandoned_checkouts")
      const lead = await collection.findOne({ email: normalizedEmail })
      const lastSent = lead?.lastRecoveryEmailAt ? new Date(lead.lastRecoveryEmailAt).getTime() : 0
      const withinCooldown = Date.now() - lastSent < EMAIL_COOLDOWN_MS

      if (!withinCooldown) {
        const template = emailTemplates.abandonedCheckout(name || lead?.name || null, resumeLink, packageType, state)
        const result = await sendUserEmail({
          to: normalizedEmail,
          subject: template.subject,
          html: template.html,
        })
        if (result.success) {
          emailed = true
          await collection.updateOne(
            { email: normalizedEmail },
            { $set: { lastRecoveryEmailAt: new Date() } },
          )
        }
      }
    }

    return NextResponse.json({ success: true, pushed, emailed })
  } catch (error) {
    console.error("[v0] Abandon notify failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
