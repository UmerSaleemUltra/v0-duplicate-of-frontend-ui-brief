import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { deduplicateAbandonedCheckout } from "@/lib/abandoned-checkout-service"
import { sendPushToIdentity } from "@/lib/web-push-server"
import { sendUserEmail, emailTemplates } from "@/config/email"

/**
 * Fired when a lead closes / leaves the checkout page without ordering.
 *
 * Runs the full recovery flow in one call:
 *   1. Records/updates the single abandoned-checkout document for this lead.
 *   2. Sends a Web Push notification to their device (if they opted in).
 *   3. Sends a branded recovery email — at most once per lead per 24 hours.
 *
 * Designed to be called from a `navigator.sendBeacon` / `fetch(keepalive)` on
 * page close, so it must respond quickly and never throw to the client.
 */

const RECOVERY_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000
const STEP_LABELS = ["Account", "State & Package", "Business Info", "Owner Info", "Review", "Payment"]

const PACKAGE_LABELS: Record<string, string> = {
  starter: "Starter",
  advanced: "Advanced",
  professional: "Professional",
}

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

    if (!sessionId && !email) {
      return NextResponse.json({ error: "Identity required" }, { status: 400 })
    }

    const { db } = await connectDB()
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null

    // 1. Record / progressively update the single abandoned-checkout document.
    await deduplicateAbandonedCheckout(db, sessionId || "unknown", normalizedEmail, {
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

    const packageLabel = packageType ? PACKAGE_LABELS[packageType] || packageType : null
    const stepLabel = typeof lastStep === "number" ? STEP_LABELS[lastStep] : null

    // 2. Send a push notification to the lead's device (skips gracefully if
    //    push isn't configured or the lead never subscribed).
    const pushResult = await sendPushToIdentity(
      db,
      { sessionId, email: normalizedEmail },
      {
        title: "Your BuzzFiling order is waiting",
        body: packageLabel
          ? `You're almost done with your ${packageLabel} package. Tap to finish in a minute.`
          : "You're almost done. Tap to pick up right where you left off.",
        url: "/checkout?resume=1",
        tag: "abandoned-checkout",
      }
    ).catch(() => ({ sent: 0, failed: 0, skipped: true }))

    // 3. Send the branded recovery email with a 24h per-lead cooldown.
    let emailSent = false
    if (normalizedEmail) {
      const record = await db
        .collection("abandoned_checkouts")
        .findOne({ email: normalizedEmail })

      const lastSentAt = record?.recoveryEmailSentAt
        ? new Date(record.recoveryEmailSentAt).getTime()
        : 0
      const withinCooldown = Date.now() - lastSentAt < RECOVERY_EMAIL_COOLDOWN_MS

      if (!record?.recovered && !withinCooldown) {
        const resumeLink = "https://www.buzzfiling.com/checkout?resume=1"
        const template = emailTemplates.abandonedCheckout(name || null, resumeLink, packageLabel)

        const result = await sendUserEmail({
          to: normalizedEmail,
          subject: template.subject,
          html: template.html,
        }).catch((e) => ({ success: false, error: String(e) }))

        if (result.success) {
          emailSent = true
          await db
            .collection("abandoned_checkouts")
            .updateOne(
              { email: normalizedEmail },
              { $set: { recoveryEmailSentAt: new Date(), lastRecoveryStep: stepLabel } }
            )
        }
      }
    }

    return NextResponse.json({
      success: true,
      push: pushResult,
      emailSent,
    })
  } catch (error) {
    console.error("[v0] Error in checkout recovery:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
