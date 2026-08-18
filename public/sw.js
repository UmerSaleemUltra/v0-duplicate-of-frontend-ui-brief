/* BuzzFiling push + abandoned-checkout recovery service worker */

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: "BuzzFiling", body: event.data ? event.data.text() : "" }
  }

  const title = payload.title || "Finish setting up your business"
  const options = {
    body: payload.body || "You're just a few steps away from completing your filing.",
    icon: payload.icon || "/images/buzz-filing-logo.png",
    badge: payload.badge || "/images/buzz-filing-logo.png",
    tag: payload.tag || "buzzfiling-abandoned-checkout",
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.url || "/checkout",
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || "/checkout"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    }),
  )
})
