import webpush from "web-push"
import type { Db } from "mongodb"

/**
 * Server-side Web Push sender for abandoned-checkout recovery.
 *
 * Configures web-push with the project's VAPID keys and sends a notification to
 * every stored subscription for a lead. If the VAPID keys are not configured,
 * sending is skipped gracefully so the rest of the recovery flow still runs.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@buzzfiling.com"

let configured = false
export function isPushConfigured(): boolean {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  if (!configured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    configured = true
  }
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Sends a push notification to all subscriptions matching the given identity.
 * Prunes subscriptions that the push service reports as gone (404/410).
 */
export async function sendPushToIdentity(
  db: Db,
  identity: { sessionId?: string | null; email?: string | null },
  payload: PushPayload
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: true }
  }

  const or: Record<string, unknown>[] = []
  if (identity.email) or.push({ email: identity.email.trim().toLowerCase() })
  if (identity.sessionId) or.push({ sessionId: identity.sessionId })
  if (or.length === 0) return { sent: 0, failed: 0, skipped: false }

  const subs = await db.collection("push_subscriptions").find({ $or: or }).toArray()
  if (subs.length === 0) return { sent: 0, failed: 0, skipped: false }

  const body = JSON.stringify(payload)
  let sent = 0
  let failed = 0

  await Promise.all(
    subs.map(async (record) => {
      try {
        await webpush.sendNotification(record.subscription, body)
        sent++
      } catch (error: any) {
        failed++
        const status = error?.statusCode
        if (status === 404 || status === 410) {
          await db
            .collection("push_subscriptions")
            .deleteOne({ _id: record._id })
            .catch(() => {})
        }
      }
    })
  )

  return { sent, failed, skipped: false }
}
