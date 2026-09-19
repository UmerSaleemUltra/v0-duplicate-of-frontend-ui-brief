/* BuzzFiling push notification service worker */

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: "BuzzFiling", body: event.data ? event.data.text() : "" }
  }

  const title = payload.title || "Finish your BuzzFiling order"
  const options = {
    body: payload.body || "You're almost done — complete your business formation in a couple of clicks.",
    icon: payload.icon || "/images/buzz-filing-logo.png",
    badge: "/images/buzz-filing-logo.png",
    tag: payload.tag || "abandoned-checkout",
    renotify: true,
    requireInteraction: false,
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
    })
  )
})
