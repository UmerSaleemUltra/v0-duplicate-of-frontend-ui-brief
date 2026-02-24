"use client"

import { Bell, Check, FileText, Mail, Package, Receipt, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

const getNotificationStatus = (notification: Notification) => {
  if (notification.type === "milestone") {
    if (notification.title.includes("Complete")) return { label: "Completed", variant: "success" as const }
    if (notification.title.includes("Started")) return { label: "In progress", variant: "info" as const }
    return { label: "Action needed", variant: "warning" as const }
  }
  if (notification.type === "order") {
    return { label: "New order", variant: "info" as const }
  }
  return null
}

const getIconColor = (type: string) => {
  switch (type) {
    case "milestone":
      return "bg-purple-500"
    case "order":
      return "bg-blue-500"
    case "document":
      return "bg-green-500"
    case "mail":
      return "bg-orange-500"
    default:
      return "bg-slate-500"
  }
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { selectedCompany } = useSelectedCompany()

  const loadNotifications = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      const token = authService.getToken()

      if (!currentUser || !token) {
        setLoading(false)
        return
      }

      const response = await ApiClient.notifications.getAll(token)

      let userNotifications = (response.data || []).filter((n: any) => n.userId === currentUser.id)

      if (selectedCompany?.id) {
        userNotifications = userNotifications.filter((n: any) => {
          const notificationCompanyId = n.metadata?.companyId || n.companyId
          return notificationCompanyId === selectedCompany.id
        })
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
    
    // Less than 1 minute
    if (diffMins < 1) return 'Just now'
    // Less than 1 hour
    if (diffMins < 60) return `${diffMins}m ago`
    // Less than 24 hours
    if (diffHours < 24) return `${diffHours}h ago`
    // Less than 7 days
    if (diffDays < 7) return `${diffDays}d ago`
    
    // Otherwise show full date
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const currentYear = now.getFullYear()
    
    // Show year only if different from current year
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
          <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] xs:w-[calc(100vw-2rem)] sm:w-96 max-w-md p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-sm sm:text-base truncate">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-muted-foreground truncate">{unreadCount} unread</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {notifications.length > 0 && unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 sm:h-8 text-xs px-2 sm:px-3">
                  <Check className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 sm:h-8 sm:w-8 md:hidden"
                aria-label="Close notifications"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[70vh] xs:max-h-[65vh] sm:max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Tooltip key={notification.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 sm:p-4 border-b hover:bg-accent/50 transition-colors duration-200 cursor-pointer ${
                        !notification.read && !notification.isRead ? "bg-accent/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-white border ${
                            !notification.read && !notification.isRead
                              ? "border-[#880000] text-[#880000]"
                              : "border-gray-200 text-[#880000]"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-xs sm:text-sm truncate pr-1">
                              {notification.title}
                            </h4>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2 break-words">{notification.message}</p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground/80 truncate flex-shrink">{formatTime(notification.createdAt)}</span>
                            {!notification.read && !notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 text-xs text-primary hover:text-primary/80 whitespace-nowrap flex-shrink-0"
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
