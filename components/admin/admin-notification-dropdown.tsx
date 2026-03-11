"use client"

import { Bell, Check, FileText, Mail, Package, Receipt, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"

interface Notification {
  id: string
  userId: string
  companyId?: string
  type: string
  title: string
  message: string
  read: boolean
  isRead?: boolean
  actionUrl?: string
  metadata?: any
  createdAt: string
}

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
    case "milestone_completed":
      return <Check className="w-4 h-4" />
    case "admin_message":
      return <User className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

export function AdminNotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const loadNotifications = async () => {
    try {
      const token = authService.getToken()

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/admin/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      setNotifications(data.data || [])
      setLoading(false)
    } catch (error) {
      console.error("Error loading admin notifications:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length

  const markAsRead = async (id: string) => {
    try {
      const token = authService.getToken()
      if (!token) return

      await fetch(`/api/notifications/${id}/mark-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const unreadNotifications = notifications.filter((n) => !n.read && !n.isRead)
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.id}/mark-read`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      )

      setNotifications(notifications.map((n) => ({ ...n, read: true, isRead: true })))
    } catch (error) {
      console.error("Error marking all as read:", error)
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
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const currentYear = now.getFullYear()

    if (year !== currentYear) {
      return `${day} ${month} ${year}`
    }
    return `${day} ${month}`
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative h-10 w-10">
        <Bell className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#ff3b30] text-white text-xs font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96 max-w-md p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-base">All Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-gray-500">{unreadCount} unread</p>}
              <p className="text-xs text-gray-400">{notifications.length} total</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {notifications.length > 0 && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 text-xs px-3 text-[#ff3b30] hover:text-[#ff3b30]/80 hover:bg-[#ff3b30]/10"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Tooltip key={notification.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-4 border-b hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                        !notification.read && !notification.isRead ? "bg-[#ff3b30]/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border ${
                            !notification.read && !notification.isRead
                              ? "bg-[#ff3b30]/10 border-[#ff3b30] text-[#ff3b30]"
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={`font-semibold text-sm truncate pr-1 ${
                                !notification.read && !notification.isRead ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.read && !notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#ff3b30] flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2 break-words">{notification.message}</p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                              <span className="text-xs text-gray-300">|</span>
                              <span className="text-xs text-gray-400 capitalize">{notification.type.replace(/_/g, " ")}</span>
                            </div>
                            {!notification.read && !notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="h-6 text-xs text-[#ff3b30] hover:text-[#ff3b30]/80 hover:bg-[#ff3b30]/10 whitespace-nowrap flex-shrink-0"
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs p-3 bg-gray-900 border-gray-800" sideOffset={4}>
                    <p className="font-semibold text-xs mb-1 text-white">{notification.title}</p>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{notification.message}</p>
                    {notification.metadata?.companyName && (
                      <p className="text-xs text-gray-400 mt-2">Company: {notification.metadata.companyName}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
