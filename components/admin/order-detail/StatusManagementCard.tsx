"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

interface StatusManagementCardProps {
  company: any
  onUpdateCompanyStatus: () => void
  onUpdateAgentStatus: () => void
  onUpdateAddressStatus: () => void
  onUpdateServiceStatus: () => void
}

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-red-400",
  pending: "bg-amber-400",
}

const statusLabel: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
}

function StatusRow({
  label,
  status,
  onUpdate,
}: {
  label: string
  status: string
  onUpdate: () => void
}) {
  const dot = statusDot[status] || "bg-stone-300"
  const text = statusLabel[status] || status

  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <div>
          <p className="text-sm font-medium text-stone-800 leading-none">{label}</p>
          <p className="text-xs text-stone-400 mt-0.5 capitalize">{text}</p>
        </div>
      </div>
      <button
        onClick={onUpdate}
        className="text-xs text-stone-400 hover:text-stone-700 font-medium transition-colors cursor-pointer"
      >
        Update
      </button>
    </div>
  )
}

export function StatusManagementCard({
  company,
  onUpdateCompanyStatus,
  onUpdateAgentStatus,
  onUpdateAddressStatus,
  onUpdateServiceStatus,
}: StatusManagementCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-100">
        <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
          <Settings className="w-3.5 h-3.5 text-stone-500" />
        </div>
        <span className="text-sm font-semibold text-stone-800 tracking-tight">Service Status</span>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <div className="divide-y divide-stone-100">
          <StatusRow
            label="Company"
            status={company?.companyStatus || "pending"}
            onUpdate={onUpdateCompanyStatus}
          />
          <StatusRow
            label="Registered Agent"
            status={company?.registeredAgentStatus || "pending"}
            onUpdate={onUpdateAgentStatus}
          />
          <StatusRow
            label="Business Address"
            status={company?.businessAddressStatus || "pending"}
            onUpdate={onUpdateAddressStatus}
          />
          <StatusRow
            label="Service"
            status={company?.serviceStatus || "pending"}
            onUpdate={onUpdateServiceStatus}
          />
        </div>
      </div>
    </div>
  )
}
