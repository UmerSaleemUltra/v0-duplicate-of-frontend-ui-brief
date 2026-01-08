"use client"

import { ClientShell } from "@/components/client/client-shell"
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

        let userId = currentUser?.id

        if (!userId && typeof window !== "undefined") {
          const storedUserId = localStorage.getItem("user_id")
          const storedUserData = localStorage.getItem("user_data")

          if (storedUserId) {
            userId = storedUserId
            console.log("[v0] Dashboard: Retrieved userId from localStorage:", userId)
          } else if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData)
              userId = userData.id
              console.log("[v0] Dashboard: Retrieved userId from stored user data:", userId)
            } catch (e) {
              console.error("[v0] Dashboard: Error parsing user data:", e)
            }
          }

          // Try to decode token as last resort
          if (!userId && token) {
            try {
              const tokenParts = token.split(".")
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]))
                userId = payload.userId || payload.id
                console.log("[v0] Dashboard: Retrieved userId from token:", userId)
              }
            } catch (e) {
              console.error("[v0] Dashboard: Error decoding token:", e)
            }
          }
        }

        if (!userId) {
          console.error("[v0] Dashboard: CRITICAL - No userId found anywhere!")
          console.log("[v0] Dashboard: currentUser:", currentUser)
          console.log("[v0] Dashboard: localStorage user_id:", localStorage.getItem("user_id"))
          console.log("[v0] Dashboard: localStorage user_data:", localStorage.getItem("user_data"))
          return
        }

        console.log("[v0] Dashboard: Loading companies for userId:", userId)

        const cacheBuster = `?t=${Date.now()}`
        const companiesResponse = await fetch(`/api/companies${cacheBuster}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }).then((res) => res.json())

        const allCompanies = companiesResponse.data || companiesResponse.companies || []

        console.log("[v0] Dashboard: Total companies fetched from API:", allCompanies.length)
        console.log(
          "[v0] Dashboard: All companies details:",
          allCompanies.map((c: any) => ({
            id: c.id,
            name: c.name,
            userId: c.userId,
            userIdType: typeof c.userId,
            createdAt: c.createdAt,
          })),
        )

        console.log("[v0] Dashboard: Current userId for filtering:", userId, "Type:", typeof userId)

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = String(c.userId).trim()
          const currentUserId = String(userId).trim()
          const match = companyUserId === currentUserId

          console.log("[v0] Dashboard: Comparing company:", {
            companyName: c.name,
            companyUserId,
            currentUserId,
            match,
            companyUserIdLength: companyUserId.length,
            currentUserIdLength: currentUserId.length,
          })

          return match
        })

        console.log("[v0] Dashboard: User companies after filtering:", userCompanies.length)
        console.log(
          "[v0] Dashboard: Filtered company names:",
          userCompanies.map((c: any) => c.name),
        )

        if (userCompanies.length === 0) {
          console.log("[v0] Dashboard: User has no companies - showing no company state")
          setHasNoCompanies(true)
          setIsLoadingData(false)
          setDataLoaded(true)
          return
        }

        setHasNoCompanies(false)

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
          const [selectedComp, companyDocuments, companyMail, companyNotifications] = await Promise.all([
            ApiClient.companies.getById(companyToLoad, token),
            ApiClient.documents.getAll(token, companyToLoad),
            ApiClient.mail.getAll(token, companyToLoad),
            ApiClient.notifications.getAll(token, companyToLoad),
          ])

          setCompany(selectedComp.data)
          setNotifications(companyNotifications.data || [])

          const companyOrders = selectedComp.data?.orders || []
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
  }, [isAuthenticating, currentUser, selectedCompanyId, dataLoaded, router, setSelectedCompanyId])

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

    console.log("[v0] All milestones values:", allMilestones)
    console.log("[v0] Company milestones:", company.milestones)
    console.log("[v0] Default milestones:", defaultMilestones)
    console.log("[v0] Custom milestone values:", customMilestoneValues)

    // Only check default milestones for completion (6 standard milestones)
    const allDefaultMilestonesComplete =
      defaultMilestones.length === 6 &&
      defaultMilestones.every((m) => m === true) &&
      defaultMilestones.filter((m) => m === undefined || m === null).length === 0

    console.log("[v0] All default milestones complete?", allDefaultMilestonesComplete)
    console.log("[v0] Celebration already shown?", celebrationShown)

    if (allDefaultMilestonesComplete && !celebrationShown) {
      // Check localStorage to see if celebration was already shown for this company
      const celebrationKey = `celebration_shown_${company.id}`
      const wasShown = localStorage.getItem(celebrationKey)

      console.log("[v0] Celebration key:", celebrationKey, "Was shown:", wasShown)

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

  if (isAuthenticating) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying authentication...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (isLoadingData && !dataLoaded) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (!isLoadingData && hasNoCompanies) {
    return (
      <ClientShell>
        <NoCompanyState />
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
    boiReportFiled: false,
  }

  const registeredAgent = company?.registeredAgent
  const hasRegisteredAgent =
    registeredAgent &&
    registeredAgent.name &&
    registeredAgent.name.trim() !== "" &&
    registeredAgent.address &&
    registeredAgent.address.trim() !== "" &&
    registeredAgent.address !== "100 Ambition Parkway" &&
    registeredAgent.name !== "BuzzFiling Services Inc." &&
    registeredAgent.name !== "BuzzFiling Services" &&
    registeredAgent.name !== "BuzzFiling Registered Agent Services"

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
      title: "EIN Successfully Processed",
      completed: milestones.einProcessed,
      icon: HashIcon,
    },
    {
      id: 6,
      title: "BOI Report Filed",
      completed: milestones.boiReportFiled,
      icon: FileBarChart,
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

  // Define hasMailingAddress for conditional rendering
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
            {/* Business Name Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Image src="/images/design-mode/us.png" alt="US Flag" width={24} height={16} className="rounded" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 -mt-2"
                  onClick={() => handleCopy(businessName, setCopied)}
                  title="Copy business name"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  )}
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Business Name</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-2xl font-bold text-slate-900 truncate cursor-help hover:opacity-80 transition-opacity">
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

            {/* EIN Card - Shows "Not Yet Assigned" if not assigned by admin */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-slate-600" />
                </div>
                {ein && (
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
                  className={`text-2xl font-bold truncate ${ein ? "text-slate-900 cursor-help hover:opacity-80 transition-opacity" : "text-slate-400 opacity-50 blur-[0.5px]"}`}
                >
                  {displayEIN}
                </h3>
              </div>
            </div>

            {/* Business ID Card - Shows "Not Yet Assigned" if not assigned by admin */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                {businessId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 -mt-2"
                    onClick={() => handleCopy(businessId, setCopiedBusinessId)}
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

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Milestones Timeline */}
            <div className="space-y-4">
              {allMilestones.map((milestone, index) => {
                const Icon = milestone.icon
                const isLast = index === allMilestones.length - 1
                const isCustom = index >= formationMilestones.length

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
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 mt-2 transition-all duration-300 ${
                              milestone.completed ? "bg-gradient-to-b from-[#880000] to-[#ff0d13]" : "bg-slate-200"
                            }`}
                          />
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
