"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Send,
  ToggleRight,
  ToggleLeft,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react"
import { NotificationService } from "@/lib/notification-service"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"

interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "error" | "warning" | "info"
  createdAt: Date
  read: boolean
  userId?: string
}

interface NotificationStats {
  total: number
  read: number
  unread: number
}

export default function AdminNotificationsPage() {
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationType, setNotificationType] = useState<"success" | "error" | "warning" | "info">("info")
  const [recipientId, setRecipientId] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    read: 0,
    unread: 0,
  })
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    const supported = NotificationService.isSupported()
    setIsSupported(supported)

    if (supported) {
      setPermissionStatus(NotificationService.getPermissionStatus())
      loadNotifications()
    }
  }, [])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const token = authService.getToken()
      
      if (!token) {
        toast.error("Not authenticated. Please log in again.")
        return
      }

      const response = await fetch("/api/admin/notifications/send", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const notifs = data.notifications || []
        setNotifications(notifs)

        // Calculate stats
        const unreadCount = notifs.filter((n: Notification) => !n.read).length
        setStats({
          total: notifs.length,
          read: notifs.length - unreadCount,
          unread: unreadCount,
        })
      } else if (response.status === 401) {
        toast.error("Not authenticated. Please log in again.")
      } else {
        toast.error("Failed to load notifications")
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestPermission = async () => {
    try {
      const permission = await NotificationService.requestPermission()
      setPermissionStatus(permission)

      if (permission === "granted") {
        toast.success("Notification permission granted!")
        // Show a test notification
        await NotificationService.success("Notifications Enabled", "You will now receive notifications", 3000)
      } else if (permission === "denied") {
        toast.error("Notification permission denied. Please enable it in your browser settings.")
      }
    } catch (error) {
      console.error("Error requesting permission:", error)
      toast.error("Failed to request notification permission")
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error("Please fill in title and message")
      return
    }

    setIsSending(true)

    try {
      const token = authService.getToken()

      if (!token) {
        toast.error("Not authenticated. Please log in again.")
        setIsSending(false)
        return
      }

      // Send to server
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          userId: recipientId || undefined,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated. Please log in again.")
        }
        throw new Error("Failed to send notification")
      }

      // Show browser notification if permission is granted
      if (NotificationService.getPermissionStatus() === "granted") {
        await NotificationService.show({
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          duration: 4000,
        })
      }

      toast.success("Notification sent successfully!")

      // Reset form
      setNotificationTitle("")
      setNotificationMessage("")
      setNotificationType("info")
      setRecipientId("")

      // Reload notifications
      await loadNotifications()
    } catch (error) {
      console.error("Error sending notification:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send notification")
    } finally {
      setIsSending(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      success: <CheckCircle className="h-4 w-4 text-green-600" />,
      error: <AlertCircle className="h-4 w-4 text-red-600" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      info: <Info className="h-4 w-4 text-blue-600" />,
    }
    return icons[type] || <Info className="h-4 w-4" />
  }

  const getTypeColor = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      error: "destructive",
      warning: "secondary",
      info: "outline",
    }
    return colors[type] || "outline"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-8 w-8 text-[#ff3b30]" />
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        </div>
        <p className="text-slate-600">Send and manage notifications to users and devices</p>
      </div>

      {/* Browser Support Alert */}
      {!isSupported && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Browser notifications are not supported in your current browser. Notifications will only be sent to the
            server.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Send Notification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permission Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleRight className="h-5 w-5" />
                Notification Permissions
              </CardTitle>
              <CardDescription>Manage browser notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-medium text-slate-900">Browser Notifications</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Status:{" "}
                    <Badge
                      variant={
                        permissionStatus === "granted"
                          ? "default"
                          : permissionStatus === "denied"
                            ? "destructive"
                            : "secondary"
                      }
                      className="ml-1"
                    >
                      {permissionStatus || "unknown"}
                    </Badge>
                  </p>
                </div>
                {permissionStatus !== "granted" && (
                  <Button onClick={handleRequestPermission} className="bg-[#ff3b30] hover:bg-[#ff3b30]/90">
                    Enable Notifications
                  </Button>
                )}
                {permissionStatus === "granted" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Enabled</span>
                  </div>
                )}
              </div>

              {permissionStatus === "granted" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your browser is ready to receive notifications. Test notifications will be shown on this device.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Send Notification Form */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Notification
              </CardTitle>
              <CardDescription>Create and send notifications to users</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Order Confirmed"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    className="mt-1 border-slate-300"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter notification message..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={4}
                    className="mt-1 border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-slate-700">
                      Type
                    </Label>
                    <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
                      <SelectTrigger className="mt-1 border-slate-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recipient" className="text-sm font-medium text-slate-700">
                      Recipient (Optional)
                    </Label>
                    <Input
                      id="recipient"
                      placeholder="User ID (broadcast if empty)"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      className="mt-1 border-slate-300"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white font-medium"
                >
                  {isSending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {/* Statistics */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#ff3b30]" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Total</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{stats.total}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Read</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{stats.read}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-slate-700">Unread</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{stats.unread}</span>
                </div>
              </div>

              <Button
                onClick={loadNotifications}
                disabled={isLoading}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                    Loading...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Notifications */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#ff3b30]" />
            Recent Notifications
          </CardTitle>
          <CardDescription>Recently sent notifications ({notifications.length} total)</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600">No notifications yet</p>
              <p className="text-sm text-slate-500 mt-1">Send your first notification above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-[#ff3b30]/30 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{notif.title}</p>
                      <Badge variant={getTypeColor(notif.type)} className="text-xs">
                        {notif.type}
                      </Badge>
                      {!notif.read && <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
