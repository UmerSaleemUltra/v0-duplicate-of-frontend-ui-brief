"use client"

import { useState, useEffect } from "react"
import { AlertCircle, AlertTriangle, Shield, X } from "lucide-react"

export interface SecurityAlert {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[]
  onDismiss?: (id: string) => void
}

export function SecurityAlerts({ alerts, onDismiss }: SecurityAlertsProps) {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <SecurityAlertItem key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface SecurityAlertItemProps {
  alert: SecurityAlert
  onDismiss?: (id: string) => void
}

function SecurityAlertItem({ alert, onDismiss }: SecurityAlertItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (alert.type === "info" || alert.type === "success") {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.(alert.id)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [alert.id, alert.type, onDismiss])

  if (!isVisible) return null

  const getStyles = () => {
    switch (alert.type) {
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "text-yellow-600",
          title: "text-yellow-900",
          text: "text-yellow-800",
        }
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-600",
          title: "text-red-900",
          text: "text-red-800",
        }
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: "text-green-600",
          title: "text-green-900",
          text: "text-green-800",
        }
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-600",
          title: "text-blue-900",
          text: "text-blue-800",
        }
    }
  }

  const styles = getStyles()
  const Icon = alert.type === "error" ? AlertTriangle : alert.type === "success" ? Shield : AlertCircle

  return (
    <div className={`rounded-lg border ${styles.bg} ${styles.border} p-4`}>
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${styles.icon} mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${styles.title}`}>{alert.title}</h3>
          <p className={`mt-1 text-sm ${styles.text}`}>{alert.message}</p>
          {alert.action && (
            <button
              onClick={alert.action.onClick}
              className={`mt-2 text-sm font-medium ${
                alert.type === "error"
                  ? "text-red-600 hover:text-red-700"
                  : alert.type === "warning"
                    ? "text-yellow-600 hover:text-yellow-700"
                    : "text-blue-600 hover:text-blue-700"
              }`}
            >
              {alert.action.label}
            </button>
          )}
        </div>
        {alert.dismissible && (
          <button
            onClick={() => {
              setIsVisible(false)
              onDismiss?.(alert.id)
            }}
            className={`flex-shrink-0 ${styles.icon} hover:opacity-70`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Device Security Status Component
 * Shows current device/session security status
 */
interface DeviceSecurityStatusProps {
  sessionLocation?: string
  deviceTrusted?: boolean
  lastLogin?: Date
}

export function DeviceSecurityStatus({ sessionLocation, deviceTrusted, lastLogin }: DeviceSecurityStatusProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-slate-900">Device Security</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate-700">
        {sessionLocation && (
          <li>
            Location: <span className="font-medium">{sessionLocation}</span>
          </li>
        )}
        <li>
          Status: <span className={`font-medium ${deviceTrusted ? "text-green-600" : "text-yellow-600"}`}>{deviceTrusted ? "Trusted Device" : "New Device"}</span>
        </li>
        {lastLogin && (
          <li>
            Last Login: <span className="font-medium">{new Date(lastLogin).toLocaleString()}</span>
          </li>
        )}
      </ul>
    </div>
  )
}

/**
 * Session Management Component
 * Shows all active sessions and allows remote logout
 */
interface SessionListProps {
  sessions: Array<{
    sessionId: string
    device: string
    location: string
    createdAt: string
    isTrusted: boolean
    lastUsedAt: string
  }>
  currentSessionId?: string
  onRevokeSession?: (sessionId: string) => Promise<void>
}

export function SessionList({ sessions, currentSessionId, onRevokeSession }: SessionListProps) {
  const [revoking, setRevoking] = useState<string | null>(null)

  const handleRevoke = async (sessionId: string) => {
    if (!onRevokeSession) return

    setRevoking(sessionId)
    try {
      await onRevokeSession(sessionId)
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-900">Active Sessions</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-600">No active sessions</p>
      ) : (
        sessions.map((session) => (
          <div key={session.sessionId} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {session.device}
                  {session.sessionId === currentSessionId && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Current</span>}
                </p>
                <p className="text-sm text-slate-600 mt-1">{session.location}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Last used: {new Date(session.lastUsedAt).toLocaleString()}
                </p>
                {session.isTrusted && <span className="text-xs text-green-600 font-medium mt-2">Trusted Device</span>}
              </div>
              {session.sessionId !== currentSessionId && (
                <button
                  onClick={() => handleRevoke(session.sessionId)}
                  disabled={revoking === session.sessionId}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {revoking === session.sessionId ? "Revoking..." : "Sign Out"}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
