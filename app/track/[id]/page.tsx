"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
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
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { formatEIN, getDisplayValue } from "@/lib/utils"

// ─── Types ────────────────────────────────────
interface PublicData {
  order: {
    id: string
    status: string
    packageType?: string
    state?: string
    createdAt: string
    updatedAt: string
  }
  company: {
    name: string
    entityType?: string
    state?: string
    serviceStatus?: string
    ein?: string
    businessId?: string
    milestones: {
      orderSuccessfullyProcessed: boolean
      registeredAgentAssigned: boolean
      businessMailingAddressIssued: boolean
      companyFormationCompleted: boolean
      einApplicationSubmitted: boolean
      einObtained: boolean
    }
    customMilestones: { id: string; title: string; description?: string; completed: boolean }[]
  } | null
}

// ─── Main Page ────────────────────────────────
export default function PublicOrderDashboard() {
  const params = useParams()
  const orderId = params?.id as string

  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedEIN, setCopiedEIN] = useState(false)
  const [copiedBusinessId, setCopiedBusinessId] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError("Invalid link.")
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/orders/${orderId}/public`)
        const json = await res.json()

        if (!res.ok || !json.success) {
          setError(json.error || "Unable to load order details.")
          return
        }

        setData(json.data)
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [orderId])

  const handleCopy = async (text: string, setCopiedState: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedState(true)
      setTimeout(() => setCopiedState(false), 2000)
    } catch {
      // ignore
    }
  }

  // ─── Loading ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading your dashboard&hellip;</p>
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center">
            <Image src="/images/buzz-filing-logo.png" alt="Buzz Filing" width={120} height={32} className="h-7 w-auto object-contain" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Unable to Load Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {error ?? "This link may be invalid. Please contact support."}
              </p>
            </div>
            <a href="https://www.buzzfiling.com" className="inline-block text-sm font-medium text-slate-600 underline underline-offset-4">
              Return to Buzz Filing
            </a>
          </div>
        </main>
      </div>
    )
  }

  const company = data.company
  const order = data.order

  const businessName = company?.name || order.packageType || "Your Company"
  const entityType = company?.entityType || "LLC"
  const stateName = company?.state || order.state || getDisplayValue(null, "Not yet")

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

  const displayEIN = ein || "Not Yet Assigned"
  const displayBusinessId = businessId || "Not Yet Assigned"

  const milestones = company?.milestones || {
    orderSuccessfullyProcessed: false,
    registeredAgentAssigned: false,
    businessMailingAddressIssued: false,
    companyFormationCompleted: false,
    einApplicationSubmitted: false,
    einObtained: false,
  }

  const formationMilestones = [
    { id: 1, title: "Order Successfully Processed", completed: milestones.orderSuccessfullyProcessed, icon: Package },
    { id: 2, title: "Registered Agent Assigned", completed: milestones.registeredAgentAssigned, icon: UserCheck },
    { id: 3, title: "Business Mailing Address Issued", completed: milestones.businessMailingAddressIssued, icon: Home },
    { id: 4, title: "Company Formation Completed", completed: milestones.companyFormationCompleted, icon: FileCheck },
    { id: 5, title: "EIN Application Submitted", completed: milestones.einApplicationSubmitted, icon: HashIcon },
    { id: 6, title: "EIN Obtained Successfully", completed: milestones.einObtained, icon: CheckCircle2 },
  ]

  const customMilestones = (company?.customMilestones || []).map((m, index) => ({
    id: `custom-${index + 7}`,
    title: m.title,
    description: m.description,
    completed: m.completed,
    icon: FileCheck,
  }))

  const allMilestones = [...formationMilestones, ...customMilestones]
  const completedDefaultCount = formationMilestones.filter((m) => m.completed).length
  const progressPercentage = (completedDefaultCount / formationMilestones.length) * 100

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* ─── Navbar ─────────────────────────── */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Image src="/images/buzz-filing-logo.png" alt="Buzz Filing" width={120} height={32} className="h-7 w-auto object-contain" />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-6 pb-16">

            {/* ─── Header ─────────────────────── */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-slate-900 break-words">
                {businessName}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {entityType} &middot; {stateName}
              </p>
            </div>

            {/* ─── Top stat cards ─────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Business Name */}
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

              {/* EIN */}
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
                      onClick={() => handleCopy(company!.ein!, setCopiedEIN)}
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

              {/* Business ID */}
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

            {/* ─── Service status card ─────────── */}
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

            {/* ─── Formation Progress ──────────── */}
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
                          {"description" in milestone && milestone.description && (
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

            {/* ─── Footer ─────────────────────── */}
            <p className="text-center text-xs text-slate-400 pb-6">
              Powered by{" "}
              <a href="https://www.buzzfiling.com" className="underline underline-offset-2 text-slate-500 font-medium">
                Buzz Filing
              </a>
            </p>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
