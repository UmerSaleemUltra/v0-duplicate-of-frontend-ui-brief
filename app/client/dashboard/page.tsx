"use client"

import { ClientShell } from "@/components/client/client-shell"
import { DashboardSkeleton } from "@/components/client/dashboard-skeleton"
import {
  Building2,
  Hash,
  Bell,
  Copy,
  Check,
  CheckCircle2,
  Package,
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileBarChart,
  Info,
  AlertTriangle,
  XCircle,
  X,
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

const BANNER_STYLES = {
  info: {
    wrapper: "bg-blue-50 border-blue-200 text-blue-800",
    icon: <Info className="w-4 h-4 shrink-0 text-blue-500" />,
    dismiss: "text-blue-400 hover:text-blue-600",
  },
  warning: {
    wrapper: "bg-amber-50 border-amber-200 text-amber-800",
    icon: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />,
    dismiss: "text-amber-400 hover:text-amber-600",
  },
  success: {
    wrapper: "bg-green-50 border-green-200 text-green-800",
    icon: <Check className="w-4 h-4 shrink-0 text-green-500" />,
    dismiss: "text-green-400 hover:text-green-600",
  },
  error: {
    wrapper: "bg-red-50 border-red-200 text-red-800",
    icon: <XCircle className="w-4 h-4 shrink-0 text-red-500" />,
    dismiss: "text-red-400 hover:text-red-600",
  },
}

function BannerBar({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: "info" | "warning" | "success" | "error"
  onDismiss: () => void
}) {
  const styles = BANNER_STYLES[type] ?? BANNER_STYLES.info
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles.wrapper}`}>
      {styles.icon}
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss banner"
        className={`shrink-0 transition-colors ${styles.dismiss}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ClientDashboard() {
  const { selectedCompanyId, setSelectedCompanyId, companiesLoading, hasCompanies, initialLoadDone, isResetting } = useSelectedCompany()
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
  const [banner, setBanner] = useState<{ message: string; type: "info" | "warning" | "success" | "error" } | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false)

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

    // If companies are still loading or resetting after login, don't proceed yet
    if (companiesLoading || isResetting) {
      return
    }

    // After companies finish loading (API call complete), determine if there are ANY companies.
    // Guard with initialLoadDone to avoid showing NoCompanyState during the fetch on fresh login/refresh.
    if (!selectedCompanyId && !hasCompanies && initialLoadDone) {
      // No selected company AND no companies available = show NoCompanyState
      setHasNoCompanies(true)
      setIsLoadingData(false)
      setDataLoaded(false)
      return
    }

    // If we get here, we have a selectedCompanyId (guaranteed by CompanyProvider logic)
    setHasNoCompanies(false)

    // Check if we need to reload data (company selection changed)
    if (selectedCompanyId && selectedCompanyId !== lastLoadedCompanyId) {
      setDataLoaded(false)
    }

    // If data is already loaded for this company, don't reload
    if (dataLoaded && selectedCompanyId === lastLoadedCompanyId) {
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

        const [selectedComp, companyDocuments, companyMail, companyNotifications, bannerRes] = await Promise.all([
          ApiClient.companies.getById(selectedCompanyId, token),
          ApiClient.documents.getAll(token, selectedCompanyId),
          ApiClient.mail.getAll(token, selectedCompanyId),
          ApiClient.notifications.getAll(token, selectedCompanyId),
          fetch(`/api/banners?companyId=${selectedCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ])

        setCompany(selectedComp.data)
        setNotifications(companyNotifications.data || [])
        setBanner(bannerRes?.data ?? null)
        setBannerDismissed(false)

        const companyOrders = selectedComp.data?.orders || []
        if (companyOrders.length > 0) {
          setOrder(companyOrders[0])
        }

        setDocuments(companyDocuments.data || [])
        setMailItems(companyMail.data || [])
        setLastLoadedCompanyId(selectedCompanyId)
        setDataLoaded(true)
      } catch (error) {
        // Handle 403 Forbidden - user doesn't have access to this company
        if (error instanceof Error && error.message.includes("Forbidden")) {
          try {
            localStorage.removeItem("selectedCompanyId")
            localStorage.removeItem("companies_cache")
          } catch {
            // ignore
          }
          // Force company provider to reload
          window.location.reload()
          return
        }
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
  }, [isAuthenticating, companiesLoading, hasCompanies, initialLoadDone, isResetting, selectedCompanyId, lastLoadedCompanyId, dataLoaded, router])

  // Silent background refresh — no skeleton, just update data in place
  useEffect(() => {
    const silentRefresh = async () => {
      if (!selectedCompanyId || isSilentRefreshing) return
      const token = authService.getToken()
      if (!token) return

      setIsSilentRefreshing(true)
      try {
        const [selectedComp, companyDocuments, companyMail, companyNotifications, bannerRes] = await Promise.all([
          ApiClient.companies.getById(selectedCompanyId, token),
          ApiClient.documents.getAll(token, selectedCompanyId),
          ApiClient.mail.getAll(token, selectedCompanyId),
          ApiClient.notifications.getAll(token, selectedCompanyId),
          fetch(`/api/banners?companyId=${selectedCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ])

        setCompany(selectedComp.data)
        setNotifications(companyNotifications.data || [])
        setBanner(bannerRes?.data ?? null)

        const companyOrders = selectedComp.data?.orders || []
        if (companyOrders.length > 0) {
          setOrder(companyOrders[0])
        }

        setDocuments(companyDocuments.data || [])
        setMailItems(companyMail.data || [])
        setLastLoadedCompanyId(selectedCompanyId)
        setDataLoaded(true)
      } catch (error) {
        // Handle 403 Forbidden in silent refresh
        if (error instanceof Error && error.message.includes("Forbidden")) {
          try {
            localStorage.removeItem("selectedCompanyId")
            localStorage.removeItem("companies_cache")
          } catch {
            // ignore
          }
          window.location.reload()
          return
        }
      } finally {
        setIsSilentRefreshing(false)
      }
    }

    const handleRefresh = () => silentRefresh()
    window.addEventListener("client-dashboard-refresh", handleRefresh)
    return () => window.removeEventListener("client-dashboard-refresh", handleRefresh)
  }, [selectedCompanyId, isSilentRefreshing])

  useEffect(() => {
    if (!company) return

  const defaultMilestones = [
    company.milestones?.orderSuccessfullyProcessed,
    company.milestones?.registeredAgentAssigned,
    company.milestones?.businessMailingAddressIssued,
    company.milestones?.companyApplicationApplied,
    company.milestones?.companyFormationCompleted,
    company.milestones?.einApplicationSubmitted,
    company.milestones?.einObtained,
  ]

    const customMilestoneValues = Object.values(company.milestones?.custom || {}).map((m: any) => m.completed)

    const allDefaultMilestonesComplete =
      defaultMilestones.length === 7 &&
      defaultMilestones.every((m) => m === true) &&
      defaultMilestones.filter((m) => m === undefined || m === null).length === 0

    if (allDefaultMilestonesComplete && !celebrationShown) {
      const celebrationKey = `celebration_shown_${company.id}`
      const wasShown = localStorage.getItem(celebrationKey)

      if (!wasShown) {
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
            console.error(" Error sending completion notification:", error)
          }
        }

        sendCompletionNotification()
      }
    }
  }, [company, celebrationShown])

  const handleCloseCelebration = () => {
    setShowCelebration(false)
  }



  // Show no-company state only after auth is done, the API fetch has completed (initialLoadDone),
  // resetting is finished, and there are confirmed no companies — prevents flash on fresh login/refresh
  if (!isAuthenticating && !companiesLoading && !isResetting && initialLoadDone && hasNoCompanies) {
    return (
      <ClientShell>
        <NoCompanyState />
      </ClientShell>
    )
  }

  // Keep the skeleton until ALL of these are true at once:
  //   1. Auth check complete
  //   2. Company list loaded from API (initialLoadDone) and not currently resetting
  //   3. A company is selected (selectedCompanyId is set)
  //   4. Dashboard data for that company has been fetched (dataLoaded)
  // This ensures the sidebar company name AND the dashboard cards appear together with no flicker.
  const everythingReady =
    !isAuthenticating &&
    !companiesLoading &&
    !isResetting &&
    initialLoadDone &&
    !!selectedCompanyId &&
    dataLoaded &&
    !isLoadingData

  if (!everythingReady) {
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
    orderSuccessfullyProcessed: true,
    registeredAgentAssigned: true,
    businessMailingAddressIssued: true,
    companyApplicationApplied: false,
    companyFormationCompleted: false,
    einApplicationSubmitted: false,
    einObtained: false,
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
      completed: milestones.orderSuccessfullyProcessed,
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
      completed: milestones.businessMailingAddressIssued,
      icon: Home,
    },
    {
      id: 4,
      title: "Company Application Submitted",
      completed: milestones.companyApplicationApplied,
      icon: FileCheck,
    },
    {
      id: 5,
      title: "Company Formation Completed",
      completed: milestones.companyFormationCompleted,
      icon: FileCheck,
    },
    {
      id: 6,
      title: "EIN Application Submitted",
      completed: milestones.einApplicationSubmitted,
      icon: HashIcon,
    },
    {
      id: 7,
      title: "EIN Obtained Successfully",
      completed: milestones.einObtained,
      icon: CheckCircle2,
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
    if (typeof window !== "undefined") {
      const adminToken = sessionStorage.getItem("admin_impersonation_token")
      const adminDataStr = sessionStorage.getItem("admin_impersonation_data")

      if (adminToken && adminDataStr) {
        try {
          const adminData = JSON.parse(adminDataStr)
          authService.setAuth(adminToken, adminData)

          sessionStorage.removeItem("admin_impersonation_token")
          sessionStorage.removeItem("admin_impersonation_data")
          sessionStorage.removeItem("impersonating_user_id")
          sessionStorage.removeItem("impersonating_user_name")
          sessionStorage.removeItem("impersonating_user_email")
          localStorage.removeItem("selectedCompanyId")

          router.push("/admin")
          return
        } catch (error) {
          console.error(" Error restoring admin session:", error)
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
      console.error(" Failed to copy to clipboard:", error)
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
          {banner && !bannerDismissed && (
            <BannerBar
              message={banner.message}
              type={banner.type}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}

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


        </div>
      </TooltipProvider>
    </ClientShell>
  )
}
