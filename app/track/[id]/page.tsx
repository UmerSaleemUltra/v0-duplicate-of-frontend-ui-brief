"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Package,
  UserCheck,
  Home,
  FileCheck,
  FileText,
  Hash,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  Bell,
  Copy,
  Check,
  HashIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Milestones {
  orderSuccessfullyProcessed: boolean
  registeredAgentAssigned: boolean
  businessMailingAddressIssued: boolean
  companyFormationCompleted: boolean
  einApplicationSubmitted: boolean
  einObtained: boolean
}

interface CustomMilestone {
  id: string
  title: string
  description?: string
  completed: boolean
  completedAt?: string
}

interface TrackData {
  order: {
    id: string
    status: string
    packageType?: string
    state?: string
    createdAt: string
    updatedAt: string
    shareTokenExpiresAt?: string | null
  }
  company: {
    name: string
    type: string
    state: string
    milestones: Milestones
    customMilestones: CustomMilestone[]
  } | null
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

const CORE_MILESTONES = [
  { key: "orderSuccessfullyProcessed", icon: <Package className="w-3.5 h-3.5" />, label: "Order Processed" },
  { key: "registeredAgentAssigned", icon: <UserCheck className="w-3.5 h-3.5" />, label: "Registered Agent Assigned" },
  { key: "businessMailingAddressIssued", icon: <Home className="w-3.5 h-3.5" />, label: "Business Address Issued" },
  { key: "companyFormationCompleted", icon: <FileCheck className="w-3.5 h-3.5" />, label: "Company Formation Completed" },
  { key: "einApplicationSubmitted", icon: <FileText className="w-3.5 h-3.5" />, label: "EIN Application Submitted" },
  { key: "einObtained", icon: <Hash className="w-3.5 h-3.5" />, label: "EIN Obtained" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// ─────────────────────────────────────────────
// Milestone Step Component
// ─────────────────────────────────────────────
function MilestoneStep({
  icon,
  label,
  completed,
  isLast,
}: {
  icon: React.ReactNode
  label: string
  completed: boolean
  isLast: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            completed ? "bg-stone-900" : "bg-stone-100"
          }`}
        >
          <span className={completed ? "text-white" : "text-stone-400"}>{icon}</span>
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 mb-1 min-h-5 ${completed ? "bg-stone-300" : "bg-stone-100"}`} />
        )}
      </div>
      <div className={`${isLast ? "pb-0" : "pb-4"} pt-0.5 flex-1`}>
        <p className={`text-sm font-medium leading-tight ${completed ? "text-stone-900" : "text-stone-400"}`}>
          {label}
        </p>
        {completed && <p className="text-xs text-stone-400 mt-0.5">Completed</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TrackOrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const orderId = params?.id as string
  const token = searchParams?.get("token") ?? ""

  const [data, setData] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!orderId || !token) {
      setError("Invalid tracking link.")
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/orders/${orderId}/status?token=${token}`)
        const json = await res.json()

        if (!res.ok || !json.success) {
          setError(json.error || "Unable to load order status.")
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
  }, [orderId, token])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  // Calculate progress
  const milestones = data?.company?.milestones
  const completedCount = milestones
    ? CORE_MILESTONES.filter((m) => milestones[m.key as keyof Milestones]).length
    : 0
  const customMilestones = data?.company?.customMilestones ?? []
  const completedCustom = customMilestones.filter((m) => m.completed).length
  const totalCount = CORE_MILESTONES.length + customMilestones.length
  const totalCompleted = completedCount + completedCustom
  const pct = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0

  const businessName = data?.company?.name || data?.order?.packageType || "Your Company"
  const stateName = data?.company?.state || data?.order?.state || "—"
  const entityType = data?.company?.type || "LLC"

  const formationMilestones = [
    { id: 1, title: "Order Successfully Processed", completed: milestones?.orderSuccessfullyProcessed ?? false, icon: Package },
    { id: 2, title: "Registered Agent Assigned", completed: milestones?.registeredAgentAssigned ?? false, icon: UserCheck },
    { id: 3, title: "Business Mailing Address Issued", completed: milestones?.businessMailingAddressIssued ?? false, icon: Home },
    { id: 4, title: "Company Formation Completed", completed: milestones?.companyFormationCompleted ?? false, icon: FileCheck },
    { id: 5, title: "EIN Application Submitted", completed: milestones?.einApplicationSubmitted ?? false, icon: FileText },
    { id: 6, title: "EIN Obtained Successfully", completed: milestones?.einObtained ?? false, icon: CheckCircle2 },
  ]

  const customMilestoneItems = customMilestones.map((m, i) => ({
    id: `custom-${i + 7}`,
    title: m.title,
    description: m.description,
    completed: m.completed,
    icon: FileCheck,
  }))

  const allMilestones = [...formationMilestones, ...customMilestoneItems]
  const completedDefaultCount = formationMilestones.filter((m) => m.completed).length
  const progressPercentage = (completedDefaultCount / formationMilestones.length) * 100

  const statusCfg = data ? (STATUS_CONFIG[data.order.status] ?? STATUS_CONFIG.pending) : null

  // ─── Loading skeleton ───────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading order status&hellip;</p>
        </div>
      </div>
    )
  }

  // ─── Error state ─────────────────────────────
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
              <h1 className="text-lg font-semibold text-slate-900">Unable to Load Status</h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {error ?? "This tracking link may be invalid or expired. Please contact support."}
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* ─── Navbar ─────────────────────────────── */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Image src="/images/buzz-filing-logo.png" alt="Buzz Filing" width={120} height={32} className="h-7 w-auto object-contain" />
            {statusCfg && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.color} ${statusCfg.bg}`}>
                {statusCfg.icon}
                {statusCfg.label}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="space-y-6 pb-16">
            {/* ─── Header ─────────────────────────── */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-slate-900 break-words">
                {businessName}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {entityType} &middot; {stateName} &middot; Ordered {formatDate(data.order.createdAt)}
              </p>
            </div>

            {/* ─── Stat cards ─────────────────────── */}
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
                    onClick={() => handleCopy(businessName)}
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
                      <h3 className="text-2xl font-bold text-slate-900 truncate hover:opacity-80 transition-opacity">
                        {businessName}
                      </h3>
                    </TooltipTrigger>
                    {businessName.length > 25 && (
                      <TooltipContent side="bottom" className="max-w-xs">{businessName}</TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>

              {/* Entity & State */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Entity &amp; State</p>
                  <h3 className="text-2xl font-bold text-slate-900 truncate">
                    {entityType}
                  </h3>
                  <p className="text-sm text-slate-500">{stateName}</p>
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Order Status</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        data.order.status === "completed"
                          ? "bg-green-500"
                          : data.order.status === "processing"
                            ? "bg-blue-500"
                            : data.order.status === "cancelled"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                      }`}
                    />
                    <h3 className="text-2xl font-bold text-slate-900 capitalize">
                      {statusCfg?.label || data.order.status}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Formation Progress ─────────────── */}
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

            {/* ─── Footer ─────────────────────────── */}
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
