"use client"

import { ClientShell } from "@/components/client/client-shell"
import {
  Building2,
  Hash,
  Bell,
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
import { useState, useEffect } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { formatEIN, getDisplayValue } from "@/lib/utils"
import Image from "next/image"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function ClientDashboard() {
  const { selectedCompanyId } = useSelectedCompany()
  const [company, setCompany] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [mailItems, setMailItems] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log("[v0] Checking authentication...")

      if (!authService.isAuthenticated()) {
        console.log("[v0] No auth token found, redirecting to login")
        router.push("/login")
        return
      }

      const user = authService.getCurrentUser()
      if (!user) {
        console.log("[v0] Invalid auth token, redirecting to login")
        router.push("/login")
        return
      }

      if (user.role !== "client") {
        console.log("[v0] User is not a client, redirecting to admin dashboard")
        router.push("/admin/dashboard")
        return
      }

      console.log("[v0] Authentication successful for:", user.name)
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
      try {
        setLoading(true)

        const token = authService.getToken()
        if (!token) {
          console.log("[v0] No token found, redirecting to login")
          router.push("/login")
          return
        }

        if (selectedCompanyId) {
          const [selectedComp, allOrders, companyDocuments, companyMail] = await Promise.all([
            ApiClient.companies.getById(selectedCompanyId, token),
            ApiClient.orders.getAll(token),
            ApiClient.documents.getAll(token, selectedCompanyId),
            ApiClient.mail.getAll(token, selectedCompanyId),
          ])

          setCompany(selectedComp.data)

          const companyOrders = allOrders.data.filter((o: any) => o.companyId === selectedCompanyId)
          if (companyOrders.length > 0) {
            setOrder(companyOrders[0])
          }

          setDocuments(companyDocuments.data || [])
          setMailItems(companyMail.data || [])
        }
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          authService.logout()
          router.push("/login")
        }
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCompanyId, isAuthenticating, router])

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

  if (loading) {
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
    authService.logout()
    router.push("/")
  }

  return (
    <ClientShell>
      <TooltipProvider>
        <div className="space-y-6 pb-16 sm:pb-24 lg:pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">
                Welcome back, {responsibleMemberName}!
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {"You're managing " + businessName + " today. Here's your current formation status."}
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
                  <Image src="/images/design-mode/us.png" alt="US Flag" width={24} height={16} className="rounded" />
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
                    onClick={() => handleCopyEIN(company)}
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
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
                    onClick={() => navigator.clipboard.writeText(businessId)}
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
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
                          {isCustom && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
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
                    <p className="text-sm font-mono font-semibold text-slate-900">{orderId}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyOrderId(orderId, setCopied)}
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
                  <p className="text-sm font-semibold text-slate-900">{entityType}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">State</p>
                  <p className="text-sm font-semibold text-slate-900">{stateName}</p>
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

            {hasRegisteredAgent && (
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
                      {registeredAgent.address}
                      <br />
                      {registeredAgent.city}, {registeredAgent.state} {registeredAgent.zip}
                      <br />
                      USA
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-md shadow-red-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-600">Latest updates on your formation</p>
              </div>
            </div>

            <div className="space-y-4">
              {allMilestones
                .filter((m) => m.completed)
                .slice(-3)
                .reverse()
                .map((milestone) => {
                  const Icon = milestone.icon
                  return (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{milestone.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Completed recently</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
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

function handleCopyOrderId(orderId: string, setCopied: any) {
  navigator.clipboard.writeText(orderId)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}

function handleCopyEIN(company: any) {
  if (company?.ein) {
    navigator.clipboard.writeText(company.ein)
  }
}
