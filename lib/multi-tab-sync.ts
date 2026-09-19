const STORAGE_KEY = "auth_sync"
const ADMIN_TOKEN_KEY = "admin_auth_token"
const USER_TOKEN_KEY = "auth_token"

export function setupMultiTabSync(onLogout: () => void) {
  if (typeof window === "undefined") return

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue === "logout") {
      onLogout()
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  window.addEventListener("storage", handleStorageChange)

  return () => {
    window.removeEventListener("storage", handleStorageChange)
  }
}

export function broadcastLogout() {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, "logout")
  setTimeout(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, 100)
}

export function getAuthTokenKey(role: "admin" | "client") {
  return role === "admin" ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY
}
