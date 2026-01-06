"use client"

import { Bell, Check, FileText, Mail, Package, Receipt, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import type { Notification } from "@/lib/local-storage"
import { authService } from "@/lib/auth"
import { ApiClient } from "@/lib/api-client"
import { useSelectedCompany } from "@/lib/company-context"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "document":
      return <FileText className="w-4 h-4" />
    case "mail":
      return <Mail className="w-4 h-4" />
    case "order":
      return <Package className="w-4 h-4" />
    case "invoice":
      return <Receipt className="w-4 h-4" />
    case "milestone":
      return <Check className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { selectedCompany } = useSelectedCompany()

  const loadNotifications = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      const token = authService.getToken()

      if (!currentUser || !token) {
        setLoading(false)
        return
      }

      console.log("[v0] Loading notifications for user:", currentUser.id, "company:", selectedCompany?.name || "none")

      const response = await ApiClient.notifications.getAll(token)

      let userNotifications = (response.data || []).filter((n: any) => n.userId === currentUser.id)

      if (selectedCompany?.id) {
        userNotifications = userNotifications.filter((n: any) => {
          const notificationCompanyId = n.metadata?.companyId || n.companyId
          return notificationCompanyId === selectedCompany.id
        })
        console.log(
          "[v0] Filtered notifications for company:",
          selectedCompany.name,
          "count:",
          userNotifications.length,
        )
      } else {
        console.log("[v0] No company selected, showing all notifications:", userNotifications.length)
      }

      setNotifications(userNotifications)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    const interval = setInterval(loadNotifications, 30000)

    return () => clearInterval(interval)
  }, [selectedCompany])

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length

  const markAsRead = async (id: string) => {
    try {
      const token = authService.getToken()
      if (!token) return

      await ApiClient.notifications.markAsRead(id, token)
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)))
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      const token = authService.getToken()

      if (!currentUser || !token) return

      const unreadNotifications = notifications.filter((n) => !n.read && !n.isRead)
      await Promise.all(unreadNotifications.map((n) => ApiClient.notifications.markAsRead(n.id, token)))

      setNotifications(notifications.map((n) => ({ ...n, read: true, isRead: true })))
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadNotifications()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative h-10 w-10">
        <Bell className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900">Notifications</h3>
            {unreadCount > 0 && <p className="text-xs text-slate-600">{unreadCount} unread</p>}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs px-2 sm:px-3">
                <Check className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 text-xs px-2 sm:px-3"
            >
              <RefreshCw className={`w-3 h-3 sm:mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 ${
                  !notification.read && !notification.isRead ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !notification.read && !notification.isRead
                        ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1">
                        {notification.title}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">{formatTime(notification.createdAt)}</span>
                      {!notification.read && !notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 text-xs text-[#ff0d13] hover:text-[#cc0a0f] whitespace-nowrap"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
