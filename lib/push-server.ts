import webpush from "web-push"
import type { Db } from "mongodb"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@buzzfiling.com"

let configured = false

/** Returns true when VAPID keys are present and web-push is ready to send. */
export function isPushConfigured(): boolean {
  if (configured) return true
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  configured = true
  return true
}

export type PushSubscriptionRecord = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export type PushPayload = {
  title?: string
  body?: string
  url?: string
  tag?: string
}

/**
 * Sends a push notification to a single subscription. Returns false and prunes
 * the stored subscription when the endpoint is gone (410/404).
 */
export async function sendPushToSubscription(
  db: Db,
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<boolean> {
  if (!isPushConfigured()) return false

  try {
    await webpush.sendNotification(
      subscription as unknown as webpush.PushSubscription,
      JSON.stringify(payload),
    )
    return true
  } catch (error: any) {
    const statusCode = error?.statusCode
    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired — remove it so we stop trying.
      await db
        .collection("push_subscriptions")
        .deleteOne({ endpoint: subscription.endpoint })
        .catch(() => {})
    } else {
      console.error("[v0] Push send failed:", error?.message || error)
    }
    return false
  }
}

/** Sends a push to every subscription tied to a checkout session or email. */
export async function sendPushToLead(
  db: Db,
  identity: { sessionId?: string | null; email?: string | null },
  payload: PushPayload,
): Promise<number> {
  if (!isPushConfigured()) return 0

  const or: Record<string, unknown>[] = []
  if (identity.sessionId) or.push({ sessionId: identity.sessionId })
  if (identity.email) or.push({ email: identity.email.trim().toLowerCase() })
  if (or.length === 0) return 0

  const subs = await db
    .collection("push_subscriptions")
    .find({ $or: or })
    .toArray()

  let sent = 0
  for (const sub of subs) {
    const ok = await sendPushToSubscription(
      db,
      { endpoint: sub.endpoint, keys: sub.keys },
      payload,
    )
    if (ok) sent++
  }
  return sent
}
