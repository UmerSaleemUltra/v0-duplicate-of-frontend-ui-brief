"use client"

import { ClientShell } from "@/components/client/client-shell"
import {
  Building2,
  Hash,
  Bell,
  BellDot,
  MapPin,
  Clock,
  MoreVertical,
  Copy,
  Check,
  CheckCircle2,
  Package,
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileBarChart,
  LogOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useState, useEffect, useMemo } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { formatEIN, getDisplayValue } from "@/lib/utils"
import Image from "next/image"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { OrderCelebration } from "@/components/celebration/order-celebration"

export default function ClientDashboard() {
  const { selectedCompanyId, setSelectedCompanyId } = useSelectedCompany()
  const [company, setCompany] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [mailItems, setMailItems] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [copiedEIN, setCopiedEIN] = useState(false)
  const [copiedBusinessId, setCopiedBusinessId] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [hasNoCompanies, setHasNoCompanies] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const router = useRouter()
  const [showCelebration, setShowCelebration] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [celebrationShown, setCelebrationShown] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const user = authService.getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      if (user.role !== "client") {
        router.push("/admin/dashboard")
        return
      }

      const hasVisitedBefore = localStorage.getItem(`dashboard_visited_${user.id}`)
      if (!hasVisitedBefore) {
        setIsFirstVisit(true)
        localStorage.setItem(`dashboard_visited_${user.id}`, "true")
      }

      setCurrentUser(user)
      setIsAuthenticating(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (isAuthenticating) {
      return
    }

    const loadData = async () => {
      const startTime = Date.now()

      if (!dataLoaded) {
        setIsLoadingData(true)
      }

      try {
        const token = authService.getToken()
        if (!token) {
          router.push("/login")
          return
        }

        const companiesResponse = await ApiClient.companies.getAll(token)
        const allCompanies = companiesResponse.data || []

        const userCompanies = allCompanies.filter((c: any) => String(c.userId) === String(currentUser?.id))

        if (userCompanies.length === 0) {
          console.log("[v0] User has no companies")
          setHasNoCompanies(true)
          setIsLoadingData(false)
          setDataLoaded(true)
          return
        }

        let companyToLoad = selectedCompanyId

        // If user has only one company, auto-select it
        if (userCompanies.length === 1) {
          companyToLoad = userCompanies[0].id
          if (companyToLoad !== selectedCompanyId) {
            console.log("[v0] Auto-selecting single company:", companyToLoad)
            setSelectedCompanyId(companyToLoad)
            if (typeof window !== "undefined") {
              localStorage.setItem("selectedCompanyId", companyToLoad)
            }
          }
        }
        // If no company is selected or selected company doesn't exist in user's companies
        else if (!companyToLoad || !userCompanies.find((c: any) => c.id === companyToLoad)) {
          const sortedCompanies = userCompanies.sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
          companyToLoad = sortedCompanies[0].id
          console.log("[v0] Auto-selecting most recent company:", companyToLoad)
          setSelectedCompanyId(companyToLoad)
          if (typeof window !== "undefined") {
            localStorage.setItem("selectedCompanyId", companyToLoad)
          }
        }

        if (companyToLoad) {
          const [selectedComp, allOrders, companyDocuments, companyMail, notificationsResponse] = await Promise.all([
            ApiClient.companies.getById(companyToLoad, token),
            ApiClient.orders.getAll(token),
            ApiClient.documents.getAll(token, companyToLoad),
            ApiClient.mail.getAll(token, companyToLoad),
            ApiClient.notifications.getAll(token, companyToLoad),
          ])

          setCompany(selectedComp.data)

          const notifs = notificationsResponse.data || []
          setNotifications(notifs)
          setUnreadCount(notifs.filter((n: any) => !n.isRead).length)

          const companyOrders = allOrders.data.filter((o: any) => String(o.companyId) === String(companyToLoad))
          if (companyOrders.length > 0) {
            setOrder(companyOrders[0])
          }

          setDocuments(companyDocuments.data || [])
          setMailItems(companyMail.data || [])
          console.log("[v0] Dashboard data loaded successfully")
        }

        setDataLoaded(true)

        const loadTime = Date.now() - startTime
        if (loadTime < 100) {
          setIsLoadingData(false)
        } else {
          setTimeout(() => setIsLoadingData(false), 300)
        }
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          authService.logout()
          router.push("/login")
        }
        if (error instanceof Error && error.message.includes("Company not found")) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("selectedCompanyId")
          }
          setSelectedCompanyId(null)
        }
        setIsLoadingData(false)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [isAuthenticating, currentUser, selectedCompanyId, dataLoaded, router, setSelectedCompanyId, toast])

  useEffect(() => {
    if (!company) return

    const defaultMilestones = [
      company.milestones?.orderProcessed,
      company.milestones?.registeredAgentAssigned,
      company.milestones?.mailingAddressIssued,
      company.milestones?.formationCompleted,
      company.milestones?.einProcessed,
      company.milestones?.boiReportFiled,
    ]

    const customMilestoneValues = Object.values(company.milestones?.custom || {}).map((m: any) => m.completed)
    const allMilestones = [...defaultMilestones, ...customMilestoneValues]
    const allMilestonesComplete = allMilestones.length > 0 && allMilestones.every((m) => m === true)

    if (allMilestonesComplete && !celebrationShown) {
      // Check localStorage to see if celebration was already shown for this company
      const celebrationKey = `celebration_shown_${company.id}`
      const wasShown = localStorage.getItem(celebrationKey)

      if (!wasShown) {
        console.log("[v0] All milestones completed! Showing celebration...")
        setShowCelebration(true)
        setCelebrationShown(true)

        // Mark celebration as shown in localStorage
        localStorage.setItem(celebrationKey, "true")

        const sendCompletionNotification = async () => {
          try {
            const token = authService.getToken()
            const user = authService.getCurrentUser()

            if (token && user) {
              await ApiClient.notifications.create(
                {
                  userId: user.id,
                  type: "order_completed",
                  title: "Order Completed Successfully",
                  message: `Congratulations! All milestones for ${company.name} have been completed. Your business is ready to launch!`,
                  metadata: {
                    companyId: company.id,
                    companyName: company.name,
                  },
                },
                token,
              )
            }
          } catch (error) {
            console.log("[v0] Error sending completion notification:", error)
          }
        }

        sendCompletionNotification()
      } else {
        console.log("[v0] Celebration already shown for this company")
      }
    }
  }, [company, celebrationShown])

  const handleCloseCelebration = () => {
    console.log("[v0] Closing celebration modal")
    setShowCelebration(false)
  }

  const recentActivities = useMemo(() => {
    const activities: Array<{
      id: string
      title: string
      description: string
      icon: any
      timestamp?: string
      type: "milestone" | "notification"
    }> = []

    // Add completed milestones
    const milestones = company?.milestones || {}
    const milestoneKeys = Object.keys(milestones)
    milestoneKeys.forEach((key) => {
      if (milestones[key]) {
        activities.push({
          id: key,
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
          description: "Completed recently",
          icon: Bell,
          type: "milestone",
        })
      }
    })

    // Add recent notifications
    if (notifications) {
      notifications.slice(0, 5).forEach((notif: any) => {
        activities.push({
          id: notif.id || notif._id,
          title: notif.title,
          description: notif.message?.substring(0, 60) + "..." || "",
          icon: Bell,
          timestamp: notif.createdAt,
          type: "notification",
        })
      })
    }

    // Sort by most recent and limit to 6 items
    return activities
      .sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        }
        return 0
      })
      .slice(0, 6)
  }, [company, notifications])

  const fetchNotifications = async () => {
    if (!company?.id) return

    try {
      const token = authService.getToken()
      if (!token) return

      const response = await ApiClient.notifications.getAll(token, company.id)
      const notifs = response.data || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n: any) => !n.isRead).length)
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const unreadNotifs = notifications.filter((n) => !n.isRead)

      for (const notif of unreadNotifs) {
        await ApiClient.notifications.markAsRead(notif.id, token)
      }

      fetchNotifications()
    } catch (error) {
      console.error("[v0] Error marking notifications as read:", error)
    }
  }

  useEffect(() => {
    if (!company?.id) return

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [company?.id])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      // Clear admin impersonation data if exists
      sessionStorage.removeItem("admin_impersonation_token")
      sessionStorage.removeItem("admin_impersonation_data")
      sessionStorage.removeItem("impersonating_user_id")
      sessionStorage.removeItem("impersonating_user_name")
      sessionStorage.removeItem("impersonating_user_email")

      // Clear selected company
      localStorage.removeItem("selectedCompanyId")
    }

    authService.logout()
    router.push("/")
  }

  const handleExitAdminMode = () => {
    console.log("[v0] Exiting admin mode")

    if (typeof window !== "undefined") {
      const adminToken = sessionStorage.getItem("admin_impersonation_token")
      const adminDataStr = sessionStorage.getItem("admin_impersonation_data")

      if (adminToken && adminDataStr) {
        try {
          const adminData = JSON.parse(adminDataStr)
          console.log("[v0] Restoring admin session:", adminData.email)

          // Restore admin auth
          authService.setAuth(adminToken, adminData)

          // Clear impersonation data
          sessionStorage.removeItem("admin_impersonation_token")
          sessionStorage.removeItem("admin_impersonation_data")
          sessionStorage.removeItem("impersonating_user_id")
          sessionStorage.removeItem("impersonating_user_name")
          sessionStorage.removeItem("impersonating_user_email")

          // Clear selected company
          localStorage.removeItem("selectedCompanyId")

          console.log("[v0] Admin session restored successfully")

          // Redirect to admin dashboard
          router.push("/admin")
          return
        } catch (error) {
          console.error("[v0] Error restoring admin session:", error)
        }
      }

      // Fallback: clear everything and logout
      sessionStorage.removeItem("admin_impersonation_token")
      sessionStorage.removeItem("admin_impersonation_data")
      sessionStorage.removeItem("impersonating_user_id")
      sessionStorage.removeItem("impersonating_user_name")
      sessionStorage.removeItem("impersonating_user_email")
      localStorage.removeItem("selectedCompanyId")
    }

    authService.logout()
    router.push("/")
  }

  const handleCopy = async (text: string, setCopiedState: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedState(true)
      setTimeout(() => setCopiedState(false), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy to clipboard:", error)
      alert("Failed to copy. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-lg">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Welcome Back!</h1>
                <p className="text-xs md:text-sm text-red-50">{currentUser?.email}</p>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 relative"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    if (!showNotifications && unreadCount > 0) {
                      markAllAsRead()
                    }
                  }}
                >
                  {unreadCount > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
                            Mark all as read
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                              !notification.isRead ? "bg-red-50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-900">{notification.title}</p>
                                <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button variant="secondary" className="bg-white text-red-600 hover:bg-red-50" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Dashboard Content */}
          <ClientShell>
            <TooltipProvider>
              <OrderCelebration show={showCelebration} onClose={handleCloseCelebration} companyName={company?.name} />

              <div className="space-y-6 pb-16 sm:pb-24 lg:pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">
                      {isFirstVisit ? `Welcome, ${currentUser?.name}!` : `Welcome back, ${currentUser?.name}!`}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600">
                      {isFirstVisit
                        ? `Get started with ${company?.name}. Here's your formation status.`
                        : `You're managing ${company?.name} today. Here's your current formation status.`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="h-10 gap-2 bg-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Business Name Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Image
                          src="/images/design-mode/us.png"
                          alt="US Flag"
                          width={24}
                          height={16}
                          className="rounded"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Business Name</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="text-2xl font-bold text-slate-900 truncate cursor-help hover:opacity-80 transition-opacity">
                            {company?.name}
                          </h3>
                        </TooltipTrigger>
                        {company?.name.length > 25 && (
                          <TooltipContent side="bottom" className="max-w-xs">
                            {company?.name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>

                  {/* EIN Card - Shows "Not Yet Assigned" if not assigned by admin */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Hash className="w-6 h-6 text-slate-600" />
                      </div>
                      {company?.ein && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 -mt-2"
                          onClick={() => handleCopy(company.ein, setCopiedEIN)}
                        >
                          {copiedEIN ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">EIN</p>
                      <h3
                        className={`text-2xl font-bold truncate ${company?.ein ? "text-slate-900 cursor-help hover:opacity-80 transition-opacity" : "text-slate-400 opacity-50 blur-[0.5px]"}`}
                      >
                        {company?.ein ? formatEIN(company.ein, true) : "Not Yet Assigned"}
                      </h3>
                    </div>
                  </div>

                  {/* Business ID Card - Shows "Not Yet Assigned" if not assigned by admin */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-600" />
                      </div>
                      {company?.businessId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 -mt-2"
                          onClick={() => handleCopy(company.businessId, setCopiedBusinessId)}
                        >
                          {copiedBusinessId ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Business ID</p>
                      <h3
                        className={`text-2xl font-bold ${company?.businessId ? "text-slate-900" : "text-slate-400 opacity-50 blur-[0.5px]"}`}
                      >
                        {company?.businessId || "Not Yet Assigned"}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Second row for Service Status and Invoice Download */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-slate-600" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-medium">Service Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <h3 className="text-2xl font-bold text-slate-900">Active</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Formation Progress</h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {company?.milestones?.orderProcessed ? 1 : 0} of 6 core milestones completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
                        {company?.milestones?.orderProcessed ? 100 : 0}%
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Complete</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${company?.milestones?.orderProcessed ? 100 : 0}%` }}
                    />
                  </div>

                  {/* Milestones Timeline */}
                  <div className="space-y-4">
                    {[
                      {
                        id: 1,
                        title: "Order Successfully Processed",
                        completed: company?.milestones?.orderProcessed,
                        icon: Package,
                      },
                      {
                        id: 2,
                        title: "Registered Agent Assigned",
                        completed: company?.milestones?.registeredAgentAssigned,
                        icon: UserCheck,
                      },
                      {
                        id: 3,
                        title: "Business Mailing Address Issued",
                        completed: company?.milestones?.mailingAddressIssued,
                        icon: Home,
                      },
                      {
                        id: 4,
                        title: "Company Formation Completed",
                        completed: company?.milestones?.formationCompleted,
                        icon: FileCheck,
                      },
                      {
                        id: 5,
                        title: "EIN Successfully Processed",
                        completed: company?.milestones?.einProcessed,
                        icon: HashIcon,
                      },
                      {
                        id: 6,
                        title: "BOI Report Filed",
                        completed: company?.milestones?.boiReportFiled,
                        icon: FileBarChart,
                      },
                    ].map((milestone) => {
                      const Icon = milestone.icon

                      return (
                        <div key={milestone.id} className="relative">
                          <div className="flex items-start gap-4">
                            {/* Icon and Timeline Line */}
                            <div className="relative flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  milestone.completed
                                    ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-lg shadow-red-500/30"
                                    : "bg-slate-100 border-2 border-slate-200"
                                }`}
                              >
                                {milestone.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                  <Icon className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              {!milestone.completed && (
                                <div className="w-0.5 h-12 mt-2 transition-all duration-300 bg-slate-200" />
                              )}
                            </div>

                            {/* Milestone Content */}
                            <div className="flex-1 pt-2">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`font-semibold transition-all duration-300 ${
                                    milestone.completed ? "text-slate-900" : "text-slate-500"
                                  }`}
                                >
                                  {milestone.title}
                                </h3>
                              </div>
                              {!milestone.completed && <p className="text-xs text-slate-500 mt-1">Pending</p>}
                              {milestone.completed && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-600" />
                                  Completed
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Company Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Company Details Card */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Company Information</h2>
                        <p className="text-sm text-slate-600">Your business details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Order ID</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-semibold text-slate-900">
                            {order?.id || "ORD-XXXX-XXXX"}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(order?.id || "ORD-XXXX-XXXX", setCopied)}
                          >
                            {copied ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Entity Type</p>
                        <p className="text-sm font-semibold text-slate-900">{company?.entityType || "LLC"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">State</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {company?.state || getDisplayValue(null, "Not yet")}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Status</p>
                        <Badge className="bg-green-100 text-green-700 border-green-200 capitalize font-semibold">
                          {company?.status || "Processing"}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Documents</p>
                        <p className="text-sm font-semibold text-slate-900">{documents.length} files</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Mail Items</p>
                        <p className="text-sm font-semibold text-slate-900">{mailItems.length} items</p>
                      </div>
                    </div>
                  </div>

                  {company?.registeredAgent && (
                    <div className="bg-gradient-to-br from-[#880000] to-[#ff0d13] rounded-2xl p-6 shadow-lg shadow-red-500/20 text-white">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">Registered Agent</h2>
                          <p className="text-sm text-white/80">Agent address</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            Address
                          </p>
                          <p className="text-sm leading-relaxed text-white">
                            {company.registeredAgent.address}
                            <br />
                            {company.registeredAgent.city}, {company.registeredAgent.state}{" "}
                            {company.registeredAgent.zip}
                            <br />
                            USA
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mailing Address Card */}
                  {company?.mailingAddress && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-md shadow-red-500/20">
                          <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Mailing Address</h2>
                          <p className="text-xs text-slate-600">Business mailing address</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Home className="w-3 h-3" />
                          Address
                        </p>
                        <p className="text-sm leading-relaxed text-slate-900">
                          {company.mailingAddress.street}
                          <br />
                          {company.mailingAddress.city}, {company.mailingAddress.state} {company.mailingAddress.zip}
                          <br />
                          USA
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-md shadow-red-500/20">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                      <p className="text-xs text-slate-600">Latest updates on your formation</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => {
                        const Icon = activity.icon
                        return (
                          <div
                            key={activity.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-md ${
                              activity.type === "milestone"
                                ? "bg-green-50/50 border-green-100 hover:bg-green-50"
                                : "bg-red-50/50 border-red-100 hover:bg-red-50"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                                activity.type === "milestone"
                                  ? "bg-gradient-to-br from-[#880000] to-[#ff0d13]"
                                  : "bg-gradient-to-br from-[#880000] to-[#ff0d13]"
                              }`}
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900 leading-tight break-words">
                                {activity.title}
                              </p>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                                {activity.description}
                              </p>
                            </div>
                            <CheckCircle2
                              className={`w-5 h-5 flex-shrink-0 ${
                                activity.type === "milestone" ? "text-green-600" : "text-[#ff0d13]"
                              }`}
                            />
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">No recent activity yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </ClientShell>
        </div>
      </header>
    </div>
  )
}
