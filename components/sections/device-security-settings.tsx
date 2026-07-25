"use client"

import { useState, useEffect } from "react"
import { SessionList, DeviceSecurityStatus } from "@/components/security-alerts"
import { useSecureAuth } from "@/lib/hooks/use-secure-auth"

interface Session {
  sessionId: string
  device: string
  location: string
  createdAt: string
  isTrusted: boolean
  lastUsedAt: string
  expiresAt: string
}

/**
 * Device Security Settings Component
 * Allows users to:
 * - View current device status
 * - See all active sessions
 * - Remotely logout from other devices
 * - Manage trusted devices
 */
export default function DeviceSecuritySettings() {
  const { user, deviceFingerprint } = useSecureAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/auth/sessions", {
          method: "GET",
          headers: {
            "X-Device-Fingerprint": deviceFingerprint || "",
          },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || "Failed to load sessions")
          return
        }

        const data = await response.json()
        setSessions(data.data.sessions || [])

        const storedSessionId = localStorage.getItem("bzf_session_id")
        setCurrentSessionId(storedSessionId)
      } catch (err) {
        console.error("[v0] Failed to load sessions:", err)
        setError("Failed to load sessions")
      } finally {
        setLoading(false)
      }
    }

    if (deviceFingerprint) {
      loadSessions()
    }
  }, [deviceFingerprint])

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
        headers: {
          "X-Device-Fingerprint": deviceFingerprint || "",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to revoke session")
      }

      // Remove revoked session from list
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    } catch (err) {
      console.error("[v0] Failed to revoke session:", err)
      setError("Failed to revoke session")
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!confirm("Are you sure? You will be logged out from all devices.")) {
      return
    }

    try {
      const response = await fetch("/api/auth/logout-all", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        // Redirect to login
        window.location.href = "/login"
      }
    } catch (err) {
      console.error("[v0] Failed to logout all devices:", err)
      setError("Failed to logout from all devices")
    }
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Please log in to manage device security settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Device & Security Settings</h2>
        <p className="text-slate-600">
          Manage your connected devices and security preferences. You can view all active sessions and remotely log out from devices you don&apos;t recognize.
        </p>
      </div>

      {/* Current Device Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <DeviceSecurityStatus
          deviceTrusted={sessions.find((s) => s.sessionId === currentSessionId)?.isTrusted}
          lastLogin={sessions.find((s) => s.sessionId === currentSessionId)?.createdAt ? new Date(sessions.find((s) => s.sessionId === currentSessionId)!.createdAt) : undefined}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {loading ? (
          <p className="text-slate-600">Loading sessions...</p>
        ) : (
          <SessionList sessions={sessions} currentSessionId={currentSessionId} onRevokeSession={handleRevokeSession} />
        )}
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Security Information</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>Device Fingerprinting:</strong> Your browser is uniquely identified to prevent unauthorized access even if your password is compromised.
          </li>
          <li>
            <strong>IP Address Binding:</strong> Sessions are tied to your login IP address. Access from a different location requires re-authentication.
          </li>
          <li>
            <strong>Automatic Logout:</strong> Sessions expire after 7 days of inactivity. Sessions from unrecognized devices are immediately invalidated.
          </li>
          <li>
            <strong>Two-Factor Protection:</strong> New devices require email verification before access is granted.
          </li>
        </ul>
      </div>

      {/* Logout All Devices */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Emergency Logout</h3>
            <p className="text-sm text-slate-600 mt-1">
              If you believe your account has been compromised, immediately logout from all devices.
            </p>
          </div>
          <button
            onClick={handleLogoutAllDevices}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Logout All Devices
          </button>
        </div>
      </div>
    </div>
  )
}
