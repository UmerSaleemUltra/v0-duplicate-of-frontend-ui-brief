/**
 * Client-side Web Push helpers for abandoned-checkout recovery.
 *
 * Registers the push service worker, requests notification permission, and
 * syncs the resulting subscription to the server keyed by checkout sessionId
 * (and email/phone when available) so the server can push a reminder when the
 * lead leaves the page.
 *
 * Everything degrades gracefully: if the browser lacks support or the VAPID
 * public key is not configured, the helpers no-op instead of throwing.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

/**
 * Registers the service worker, asks for permission, and subscribes.
 * Returns true when a subscription was created/synced, false otherwise.
 */
export async function enableCheckoutPush(identity: {
  sessionId: string
  email?: string | null
  phone?: string | null
}): Promise<boolean> {
  try {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY || !identity.sessionId) return false

    // Only prompt when the user hasn't already denied.
    if (Notification.permission === "denied") return false

    const registration = await navigator.serviceWorker.register("/push-sw.js")
    await navigator.serviceWorker.ready

    let permission = Notification.permission
    if (permission === "default") {
      permission = await Notification.requestPermission()
    }
    if (permission !== "granted") return false

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: identity.sessionId,
        email: identity.email ?? null,
        phone: identity.phone ?? null,
        subscription,
      }),
    })

    return true
  } catch (error) {
    console.error("[v0] enableCheckoutPush failed:", error)
    return false
  }
}
