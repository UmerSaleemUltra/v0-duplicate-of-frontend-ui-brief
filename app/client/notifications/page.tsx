"use client"

import { useState, useEffect } from "react"
import { ClientShell } from "@/components/client/client-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, AlertCircle, FileText, Mail } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch notifications")

      const result = await response.json()
      setNotifications(result.data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = authService.getToken()
      if (!token) return

      await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      })

      setNotifications((prev) => prev.map((notif) => (notif._id === notificationId ? { ...notif, read: true } : notif)))

      toast({
        title: "Success",
        description: "Notification marked as read",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) =>
            fetch(`/api/notifications/${n._id}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ read: true }),
            }),
          ),
      )

      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />
      case "mail":
        return <Mail className="w-5 h-5" />
      case "order":
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <ClientShell>
        <div className="space-y-8 animate-pulse">
          <div className="h-9 w-48 bg-slate-200 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded" />
          ))}
        </div>
      </ClientShell>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <ClientShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Notifications</h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" className="gap-2 bg-transparent">
              <Check className="w-4 h-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-slate-600">You're all caught up!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification._id}
                className={`p-6 ${notification.read ? "bg-white" : "bg-blue-50 border-blue-200"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      notification.read
                        ? "bg-slate-100 text-slate-600"
                        : "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
                    }`}
                  >
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                        <p className="text-slate-600 text-sm">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          onClick={() => markAsRead(notification._id)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientShell>
  )
}
