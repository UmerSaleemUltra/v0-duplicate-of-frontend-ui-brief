"use client"

import {
  Settings,
  Plus,
  UserCheck,
  MapPin,
  Hash,
  Building2,
  FileBarChart,
  FileCheck,
  Download,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react"

interface AdminActionsCardProps {
  company: any
  hasEIN: boolean
  agentUpdating: boolean
  addressUpdating: boolean
  einUpdating: boolean
  itinUpdating: boolean
  businessIdUpdating: boolean
  taxUpdating: boolean
  milestoneUpdating: boolean
  deleting: boolean
  onAddMilestone: () => void
  onAssignAgent: () => void
  onAssignAddress: () => void
  onAssignEIN: () => void
  onAssignITIN: () => void
  onAssignBusinessId: () => void
  onTaxInfo: () => void
  onManageMilestones: () => void
  onDownloadInvoice: () => void
  onDeleteOrder: () => void
}

function ActionRow({
  icon,
  label,
  onClick,
  disabled,
  loading,
  loadingLabel,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
    >
      <span className="w-4 h-4 text-gray-400 shrink-0 flex items-center justify-center">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      </span>
      <span className="flex-1 text-sm font-medium text-gray-800">{loading ? (loadingLabel || label) : label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
    </button>
  )
}

export function AdminActionsCard({
  company,
  hasEIN,
  agentUpdating,
  addressUpdating,
  einUpdating,
  itinUpdating,
  businessIdUpdating,
  taxUpdating,
  milestoneUpdating,
  deleting,
  onAddMilestone,
  onAssignAgent,
  onAssignAddress,
  onAssignEIN,
  onAssignITIN,
  onAssignBusinessId,
  onTaxInfo,
  onManageMilestones,
  onDownloadInvoice,
  onDeleteOrder,
}: AdminActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Settings className="w-4 h-4 text-gray-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Admin Actions</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage order and company details</p>
        </div>
      </div>

      {/* Action rows — Apple Settings style */}
      <div className="divide-y divide-gray-100">
        <ActionRow icon={<Plus className="w-4 h-4" />} label="Add Milestone" onClick={onAddMilestone} />
        <ActionRow
          icon={<UserCheck className="w-4 h-4" />}
          label="Assign Registered Agent"
          onClick={onAssignAgent}
          disabled={agentUpdating || !company}
          loading={agentUpdating}
          loadingLabel="Updating..."
        />
        <ActionRow
          icon={<MapPin className="w-4 h-4" />}
          label="Assign Mailing Address"
          onClick={onAssignAddress}
          disabled={addressUpdating || !company}
          loading={addressUpdating}
          loadingLabel="Updating..."
        />
        <ActionRow
          icon={<Hash className="w-4 h-4" />}
          label={hasEIN ? "View / Edit EIN" : "Assign EIN"}
          onClick={onAssignEIN}
          disabled={einUpdating || !company}
          loading={einUpdating}
          loadingLabel="Updating..."
        />
        <ActionRow
          icon={<Hash className="w-4 h-4" />}
          label={company?.itin ? "View / Edit ITIN" : "Assign ITIN"}
          onClick={onAssignITIN}
          disabled={itinUpdating || !company}
          loading={itinUpdating}
          loadingLabel="Updating..."
        />
        <ActionRow
          icon={<Building2 className="w-4 h-4" />}
          label={company?.businessId ? "View / Edit Business ID" : "Assign Business ID"}
          onClick={onAssignBusinessId}
          disabled={businessIdUpdating || !company}
          loading={businessIdUpdating}
          loadingLabel="Updating..."
        />
        <ActionRow
          icon={<FileBarChart className="w-4 h-4" />}
          label="Tax Information"
          onClick={onTaxInfo}
          disabled={taxUpdating || !company}
          loading={taxUpdating}
          loadingLabel="Loading..."
        />
        <ActionRow
          icon={<FileCheck className="w-4 h-4" />}
          label="Manage Milestones"
          onClick={onManageMilestones}
          disabled={milestoneUpdating}
          loading={milestoneUpdating}
          loadingLabel="Loading..."
        />
        <ActionRow icon={<Download className="w-4 h-4" />} label="Download Invoice" onClick={onDownloadInvoice} />
      </div>

      {/* Destructive zone */}
      <div className="border-t border-gray-100">
        <button
          onClick={onDeleteOrder}
          disabled={deleting}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <span className="w-4 h-4 text-red-400 shrink-0 flex items-center justify-center">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </span>
          <span className="flex-1 text-sm font-medium text-red-600">{deleting ? "Deleting..." : "Delete Order"}</span>
          <ChevronRight className="w-3.5 h-3.5 text-red-300 shrink-0" />
        </button>
      </div>
    </div>
  )
}
