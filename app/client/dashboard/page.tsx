"use client"

import { ClientShell } from "@/components/client/client-shell"
import { DashboardSkeleton } from "@/components/client/dashboard-skeleton"
import {
  Building2,
  Hash,
  Bell,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  Package,
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileBarChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useState, useEffect, useMemo } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { formatEIN, getDisplayValue } from "@/lib/utils"
import Image from "next/image"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { NoCompanyState } from "@/components/client/no-company-state"
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
  const [celebrationShown, setCelebrationShown] = useState(false)
  const [lastLoadedCompanyId, setLastLoadedCompanyId] = useState<string | null>(null)

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
    if (isAuthenticating) return

    if (!selectedCompanyId) {
      console.log("[v0] No company selected, showing no-company state")
      setHasNoCompanies(true)
      setIsLoadingData(false)
      return
    }

    setHasNoCompanies(false)

    if (selectedCompanyId && selectedCompanyId !== lastLoadedCompanyId) {
      setDataLoaded(false)
    }

    if (dataLoaded && selectedCompanyId === lastLoadedCompanyId) {
      console.log("[v0] Data already loaded for company:", selectedCompanyId)
      return
    }

    const loadData = async () => {
      try {
        setIsLoadingData(true)
        const token = authService.getToken()

        if (!token) {
          router.push("/login")
          return
        }

        const [selectedComp, companyDocuments, companyMail, companyNotifications] = await Promise.all([
          ApiClient.companies.getById(selectedCompanyId, token),
          ApiClient.documents.getAll(token, selectedCompanyId),
          ApiClient.mail.getAll(token, selectedCompanyId),
          ApiClient.notifications.getAll(token, selectedCompanyId),
        ])

        setCompany(selectedComp.data)
        setNotifications(companyNotifications.data || [])

        const companyOrders = selectedComp.data?.orders || []
        if (companyOrders.length > 0) {
          setOrder(companyOrders[0])
        }

        setDocuments(companyDocuments.data || [])
        setMailItems(companyMail.data || [])
        setLastLoadedCompanyId(selectedCompanyId)
        setDataLoaded(true)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          authService.logout()
          router.push("/login")
        }
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [isAuthenticating, selectedCompanyId, lastLoadedCompanyId, dataLoaded, router])

  useEffect(() => {
    if (!company) return

  const defaultMilestones = [
    company.milestones?.orderProcessed,
    company.milestones?.registeredAgentAssigned,
    company.milestones?.mailingAddressIssued,
    company.milestones?.formationCompleted,
    company.milestones?.einProcessed,
  ]

    const customMilestoneValues = Object.values(company.milestones?.custom || {}).map((m: any) => m.completed)
    const allMilestones = [...defaultMilestones, ...customMilestoneValues]

    console.log("[v0] All milestones values:", allMilestones)
    console.log("[v0] Company milestones:", company.milestones)
    console.log("[v0] Default milestones:", defaultMilestones)
    console.log("[v0] Custom milestone values:", customMilestoneValues)

  const allDefaultMilestonesComplete =
    defaultMilestones.length === 5 &&
    defaultMilestones.every((m) => m === true) &&
    defaultMilestones.filter((m) => m === undefined || m === null).length === 0

    console.log("[v0] All default milestones complete?", allDefaultMilestonesComplete)
    console.log("[v0] Celebration already shown?", celebrationShown)

    if (allDefaultMilestonesComplete && !celebrationShown) {
      const celebrationKey = `celebration_shown_${company.id}`
      const wasShown = localStorage.getItem(celebrationKey)

      console.log("[v0] Celebration key:", celebrationKey, "Was shown:", wasShown)

      if (!wasShown) {
        console.log("[v0] All milestones completed! Showing celebration...")
        setShowCelebration(true)
        setCelebrationShown(true)

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
    } else {
      console.log("[v0] Celebration conditions not met:")
      console.log("  - Milestones length:", defaultMilestones.length)
      console.log(
        "  - All true:",
        defaultMilestones.every((m) => m === true),
      )
      console.log("  - No undefined/null:", defaultMilestones.filter((m) => m === undefined || m === null).length === 0)
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

    return activities
      .sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        }
        return 0
      })
      .slice(0, 6)
  }, [company, notifications])

  if (!isAuthenticating && hasNoCompanies) {
    return (
      <ClientShell>
        <NoCompanyState />
      </ClientShell>
    )
  }

  if (isAuthenticating || isLoadingData) {
    return (
      <ClientShell>
        <DashboardSkeleton />
      </ClientShell>
    )
  }

  const responsibleMemberName = currentUser?.name || "User"
  const businessName = company?.name || "Your Company"
  const entityType = company?.entityType || "LLC"
  const stateName = company?.state || getDisplayValue(null, "Not yet")

  const ein =
    company?.ein &&
    company.ein.trim() !== "" &&
    company.ein !== "Pending" &&
    company.ein !== "Not yet" &&
    company.ein !== "Not Yet Assigned" &&
    company.ein !== "Not provided" &&
    !company.ein.includes("PENDING") &&
    !company.ein.includes("pending")
      ? formatEIN(company.ein, true)
      : null

  const businessId =
    company?.businessId &&
    company.businessId.trim() !== "" &&
    !company.businessId.includes("PENDING") &&
    !company.businessId.includes("pending") &&
    company.businessId !== "BIZ-PENDING" &&
    company.businessId !== "Not yet" &&
    company.businessId !== "Not Yet Assigned" &&
    company.businessId !== "Not provided"
      ? company.businessId
      : null

  const orderId = order?.id || "ORD-XXXX-XXXX"

  const milestones = company?.milestones || {
    orderProcessed: true,
    registeredAgentAssigned: true,
    mailingAddressIssued: true,
    formationCompleted: false,
    einProcessed: false,
  }

  const registeredAgent = company?.registeredAgent
  const hasRegisteredAgent =
    registeredAgent &&
    registeredAgent.name &&
    registeredAgent.name.trim() !== "" &&
    registeredAgent.address &&
    registeredAgent.address.trim() !== "" &&
    registeredAgent.address !== "100 Ambition Parkway" &&
    registeredAgent.name !== "Buzz Filing Services Inc." &&
    registeredAgent.name !== "Buzz Filing Services" &&
    registeredAgent.name !== "Buzz Filing Registered Agent Services"

  const formationMilestones = [
    {
      id: 1,
      title: "Order Successfully Processed",
      completed: milestones.orderProcessed,
      icon: Package,
    },
    {
      id: 2,
      title: "Registered Agent Assigned",
      completed: milestones.registeredAgentAssigned,
      icon: UserCheck,
    },
    {
      id: 3,
      title: "Business Mailing Address Issued",
      completed: milestones.mailingAddressIssued,
      icon: Home,
    },
    {
      id: 4,
      title: "Company Formation Completed",
      completed: milestones.formationCompleted,
      icon: FileCheck,
    },
    {
      id: 5,
      title: "EIN Obtained",
      completed: milestones.einProcessed,
      icon: HashIcon,
    },
  ]

  const customMilestones = (company?.customMilestones || []).map((m, index) => ({
    id: `custom-${index + 7}`,
    title: m.title,
    description: m.description,
    completed: m.completed,
    icon: FileCheck,
  }))

  const completedDefaultCount = formationMilestones.filter((m) => m.completed).length
  const progressPercentage = (completedDefaultCount / formationMilestones.length) * 100

  const allMilestones = [...formationMilestones, ...customMilestones]

  const displayEIN = ein || "Not Yet Assigned"
  const displayBusinessId = businessId || "Not Yet Assigned"

  const handleLogout = () => {
    if (typeof window !== "undefined") {
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

  const handleExitAdminMode = () => {
    console.log("[v0] Exiting admin mode")

    if (typeof window !== "undefined") {
      const adminToken = sessionStorage.getItem("admin_impersonation_token")
      const adminDataStr = sessionStorage.getItem("admin_impersonation_data")

      if (adminToken && adminDataStr) {
        try {
          const adminData = JSON.parse(adminDataStr)
          console.log("[v0] Restoring admin session:", adminData.email)

          authService.setAuth(adminToken, adminData)

          sessionStorage.removeItem("admin_impersonation_token")
          sessionStorage.removeItem("admin_impersonation_data")
          sessionStorage.removeItem("impersonating_user_id")
          sessionStorage.removeItem("impersonating_user_name")
          sessionStorage.removeItem("impersonating_user_email")
          localStorage.removeItem("selectedCompanyId")

          console.log("[v0] Admin session restored successfully")

          router.push("/admin")
          return
        } catch (error) {
          console.error("[v0] Error restoring admin session:", error)
        }
      }

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

  const hasMailingAddress =
    company?.mailingAddress &&
    company.mailingAddress.street &&
    company.mailingAddress.city &&
    company.mailingAddress.state &&
    company.mailingAddress.zip

  return (
    <ClientShell>
      <TooltipProvider>
        <OrderCelebration show={showCelebration} onClose={handleCloseCelebration} companyName={company?.name} />

        <div className="space-y-6 pb-16 sm:pb-24 lg:pb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-slate-900 break-words">
              {isFirstVisit ? `Welcome, ${responsibleMemberName}!` : `Welcome back, ${responsibleMemberName}!`}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {isFirstVisit
                ? `Get started with ${businessName}. Here's your formation status.`
                : `You're managing ${businessName} today. Here's your current formation status.`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Image src="/images/design-mode/us.png" alt="US Flag" width={24} height={16} className="rounded" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 -mt-2 cursor-pointer"
                  onClick={() => handleCopy(businessName, setCopied)}
                  title="Copy business name"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600 cursor-pointer" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                  )}
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Business Name</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-2xl font-bold text-slate-900 truncate hover:opacity-80 transition-opacity">
                      {businessName}
                    </h3>
                  </TooltipTrigger>
                  {businessName.length > 25 && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      {businessName}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-slate-600" />
                </div>
                {ein && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 -mt-2 cursor-pointer"
                    onClick={() => handleCopy(company.ein, setCopiedEIN)}
                  >
                    {copiedEIN ? (
                      <Check className="w-4 h-4 text-green-600 cursor-pointer" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    )}
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">EIN</p>
                <h3
                  className={`text-2xl font-bold truncate ${ein ? "text-slate-900 hover:opacity-80 transition-opacity" : "text-slate-400 opacity-50 blur-[0.5px]"}`}
                >
                  {displayEIN}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                {businessId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 -mt-2 cursor-pointer"
                    onClick={() => handleCopy(businessId, setCopiedBusinessId)}
                  >
                    {copiedBusinessId ? (
                      <Check className="w-4 h-4 text-green-600 cursor-pointer" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    )}
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Business ID</p>
                <h3
                  className={`text-2xl font-bold ${businessId ? "text-slate-900" : "text-slate-400 opacity-50 blur-[0.5px]"}`}
                >
                  {displayBusinessId}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">Service Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      company?.serviceStatus === "active"
                        ? "bg-green-500"
                        : company?.serviceStatus === "inactive"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <h3 className="text-2xl font-bold text-slate-900 capitalize">
                    {company?.serviceStatus || "Pending"}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Formation Progress</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {completedDefaultCount} of {formationMilestones.length} core milestones completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
                  {Math.round(progressPercentage)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">Complete</p>
              </div>
            </div>

            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="space-y-4">
              {allMilestones.map((milestone, index) => {
                const Icon = milestone.icon
                const isLast = index === allMilestones.length - 1
                const isCustom = index >= formationMilestones.length

                return (
                  <div key={milestone.id} className="relative">
                    <div className="flex items-start gap-4">
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
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 mt-2 transition-all duration-300 ${
                              milestone.completed ? "bg-gradient-to-b from-[#880000] to-[#ff0d13]" : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>

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
                        {milestone.description && (
                          <p className="text-xs text-slate-500 mt-1">{milestone.description}</p>
                        )}
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
  )
}
