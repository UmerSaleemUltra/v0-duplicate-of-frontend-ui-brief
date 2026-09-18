"use client"

import { Bell, Check, FileText, Mail, Package, Receipt, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import Link from "next/link"
import { notificationStorage, type Notification } from "@/lib/local-storage"
import { authService } from "@/lib/auth"

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
    default:
      return <Package className="w-4 h-4" />
  }
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      const userNotifications = notificationStorage.getByUserId(currentUser.id)
      setNotifications(userNotifications)
    }
    setLoading(false)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    notificationStorage.markAsRead(id)
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      notificationStorage.markAllAsRead(currentUser.id)
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
    }
  }

  const deleteNotification = (id: string) => {
    notificationStorage.delete(id)
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    notifications.forEach((n) => notificationStorage.delete(n.id))
    setNotifications([])
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
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs px-2 sm:px-3">
                  <Check className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={clearAll} className="h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
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
                  !notification.read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !notification.read
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">{formatTime(notification.createdAt)}</span>
                      {!notification.read && (
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
