"use client"

import { useEffect, useState, useCallback } from "react"
import { generateDeviceFingerprint, storeDeviceFingerprint, getStoredDeviceFingerprint, clearDeviceFingerprint } from "@/lib/browser-fingerprint"
import { useRouter } from "next/navigation"

export interface SecureAuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "client"
  phone?: string
  createdAt?: string
}

export interface UseSecureAuthReturn {
  user: SecureAuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  isAuthenticated: boolean
  deviceFingerprint: string | null
  securityAlert?: string
}

/**
 * Secure authentication hook with device fingerprinting
 * Manages login, logout, token refresh with device/IP verification
 */
export function useSecureAuth(): UseSecureAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<SecureAuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null)
  const [securityAlert, setSecurityAlert] = useState<string>()

  // Initialize device fingerprint on mount
  useEffect(() => {
    const initializeFingerprint = async () => {
      try {
        let fp = getStoredDeviceFingerprint()

        if (!fp) {
          fp = await generateDeviceFingerprint()
          storeDeviceFingerprint(fp)
        }

        setDeviceFingerprint(fp)
      } catch (err) {
        console.error("[v0] Failed to initialize device fingerprint:", err)
        setError("Security initialization failed")
      }
    }

    initializeFingerprint()
  }, [])

  // Load user from localStorage on mount
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const stored = localStorage.getItem("bzf_user")
        if (stored) {
          setUser(JSON.parse(stored))
        }
      } catch (err) {
        console.error("[v0] Failed to load stored user:", err)
      } finally {
        setLoading(false)
      }
    }

    loadStoredUser()
  }, [])

  // Login function
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setLoading(true)
      setError(null)

      try {
        if (!deviceFingerprint) {
          setError("Device security not initialized")
          return false
        }

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Fingerprint": deviceFingerprint,
          },
          body: JSON.stringify({ email, password }),
          credentials: "include", // Include cookies
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || "Login failed")
          return false
        }

        const data = await response.json()

        // Store user data (NOT tokens - they're in httpOnly cookies)
        const userData = data.data.user
        setUser(userData)
        localStorage.setItem("bzf_user", JSON.stringify(userData))
        localStorage.setItem("bzf_session_id", data.data.sessionId)

        if (data.data.loginLocation) {
          setSecurityAlert(`Login detected from ${data.data.loginLocation}`)
        }

        return true
      } catch (err) {
        console.error("[v0] Login error:", err)
        setError("An error occurred during login")
        return false
      } finally {
        setLoading(false)
      }
    },
    [deviceFingerprint],
  )

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.warn("[v0] Logout request failed:", err)
    }

    setUser(null)
    localStorage.removeItem("bzf_user")
    localStorage.removeItem("bzf_session_id")
    clearDeviceFingerprint()
    router.push("/login")
  }, [router])

  // Token refresh function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!deviceFingerprint) {
        return false
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Fingerprint": deviceFingerprint,
        },
        body: JSON.stringify({ deviceFingerprint }),
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired or device mismatch. Please log in again.")
          await logout()
        }
        return false
      }

      return true
    } catch (err) {
      console.error("[v0] Token refresh error:", err)
      return false
    }
  }, [deviceFingerprint, logout])

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    deviceFingerprint,
    securityAlert,
  }
}

/**
 * Hook to create API interceptor for automatic token refresh
 */
export function useApiInterceptor() {
  const { refreshToken } = useSecureAuth()

  // This should be used with a fetch wrapper or axios interceptor
  // Implementation depends on your HTTP library
  const interceptor = useCallback(
    async (response: Response) => {
      if (response.status === 401) {
        const refreshed = await refreshToken()
        if (refreshed) {
          // Retry the original request
          return fetch(response.url, {
            ...response,
            credentials: "include",
          })
        }
      }
      return response
    },
    [refreshToken],
  )

  return { interceptor }
}
