"use client"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** True when the browser can support web push and a public key is configured. */
export function canUsePush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY
  )
}

/**
 * Registers the service worker, requests notification permission, subscribes to
 * push, and stores the subscription on the server keyed by session/email.
 * Safe to call repeatedly; it reuses an existing subscription.
 */
export async function enablePushForLead(identity: {
  sessionId: string
  email?: string | null
}): Promise<boolean> {
  if (!canUsePush()) return false

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready

    if (Notification.permission === "denied") return false
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return false
    }

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      })
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        sessionId: identity.sessionId,
        email: identity.email || null,
      }),
    })

    return true
  } catch (error) {
    console.error("[v0] Failed to enable push:", error)
    return false
  }
}
