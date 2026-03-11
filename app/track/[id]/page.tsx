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
  LayoutDashboard,
  ArrowRight,
} from "lucide-react"

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

  const statusCfg = data ? (STATUS_CONFIG[data.order.status] ?? STATUS_CONFIG.pending) : null

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

  // ─── Loading skeleton ───────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500 font-medium">Loading order status&hellip;</p>
        </div>
      </div>
    )
  }

  // ─── Error state ─────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        {/* Navbar */}
        <header className="bg-white border-b border-stone-200">
          <div className="max-w-xl mx-auto px-4 py-4 flex items-center">
            <Image src="/images/buzz-filing-logo.png" alt="Buzz Filing" width={120} height={32} className="h-7 w-auto object-contain" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-stone-900">Unable to Load Status</h1>
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">
                {error ?? "This tracking link may be invalid or expired. Please contact support."}
              </p>
            </div>
            <a
              href="https://www.buzzfiling.com"
              className="inline-block text-sm font-medium text-stone-600 underline underline-offset-4"
            >
              Return to Buzz Filing
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* ─── Navbar ─────────────────────────────── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="/images/buzz-filing-logo.png"
            alt="Buzz Filing"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
          />
          <span className="text-xs font-medium text-stone-400 tracking-wide uppercase">Order Tracker</span>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 space-y-5">
        {/* ─── Hero card ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Top bar — status color accent */}
          <div
            className={`h-1.5 w-full ${
              data.order.status === "completed"
                ? "bg-emerald-500"
                : data.order.status === "processing"
                  ? "bg-blue-500"
                  : data.order.status === "cancelled"
                    ? "bg-red-500"
                    : "bg-amber-400"
            }`}
          />

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                {data.company ? (
                  <>
                    <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-1">Company</p>
                    <h1 className="text-xl font-semibold text-stone-900 leading-snug text-balance">
                      {data.company.name}
                    </h1>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {data.company.type} &middot; {data.company.state || data.order.state}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-1">Order</p>
                    <h1 className="text-xl font-semibold text-stone-900 text-balance">
                      {data.order.packageType ?? "LLC Formation"}
                    </h1>
                    {data.order.state && (
                      <p className="text-sm text-stone-500 mt-0.5">{data.order.state}</p>
                    )}
                  </>
                )}
              </div>

              {/* Status badge */}
              {statusCfg && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.color} ${statusCfg.bg}`}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
              <span className="text-xs text-stone-400">
                Ordered: <span className="text-stone-600 font-medium">{formatDate(data.order.createdAt)}</span>
              </span>
              <span className="text-xs text-stone-400">
                Updated: <span className="text-stone-600 font-medium">{formatDate(data.order.updatedAt)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ─── Progress card ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-stone-800 tracking-tight">Formation Progress</span>
              <span className="text-xs font-medium text-stone-400">
                {totalCompleted}/{totalCount} &middot; {pct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-900 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="px-6 py-5">
            {milestones ? (
              <>
                {CORE_MILESTONES.map((m, i) => (
                  <MilestoneStep
                    key={m.key}
                    icon={m.icon}
                    label={m.label}
                    completed={milestones[m.key as keyof Milestones]}
                    isLast={i === CORE_MILESTONES.length - 1 && customMilestones.length === 0}
                  />
                ))}

                {customMilestones.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Additional Steps</p>
                    {customMilestones.map((m, i) => (
                      <MilestoneStep
                        key={m.id}
                        icon={<Hash className="w-3.5 h-3.5" />}
                        label={m.title}
                        completed={m.completed}
                        isLast={i === customMilestones.length - 1}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-stone-400 text-center py-6">Progress information not available yet.</p>
            )}
          </div>
        </div>

        {/* ─── Package info ────────────────────────── */}
        {(data.order.packageType || data.order.state) && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-6 py-5">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Order Details</p>
            <dl className="space-y-2">
              {data.order.packageType && (
                <div className="flex justify-between text-sm">
                  <dt className="text-stone-500">Package</dt>
                  <dd className="font-medium text-stone-800 capitalize">{data.order.packageType}</dd>
                </div>
              )}
              {(data.order.state || data.company?.state) && (
                <div className="flex justify-between text-sm">
                  <dt className="text-stone-500">State</dt>
                  <dd className="font-medium text-stone-800">{data.order.state || data.company?.state}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* ─── Dashboard CTA ──────────────────────── */}
        <div className="bg-stone-900 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <LayoutDashboard className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">Access Your Dashboard</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                  Log in to your Buzz Filing account for documents, mailroom, and full order details.
                </p>
              </div>
            </div>
            <a
              href="https://www.buzzfiling.com/login"
              className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ─── Link expiry notice ─────────────────── */}
        {data.order.shareTokenExpiresAt && (
          <p className="text-center text-xs text-stone-400">
            This tracking link expires on{" "}
            <span className="font-medium text-stone-500">
              {new Date(data.order.shareTokenExpiresAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            .
          </p>
        )}

        {/* ─── Footer ─────────────────────────────── */}
        <p className="text-center text-xs text-stone-400 pb-6">
          Powered by{" "}
          <a href="https://www.buzzfiling.com" className="underline underline-offset-2 text-stone-500 font-medium">
            Buzz Filing
          </a>
        </p>
      </main>
    </div>
  )
}
