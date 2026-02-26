"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "outline" | "destructive"
  loading?: boolean
  loadingLabel?: string
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "outline",
  loading,
  loadingLabel,
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      className={`w-full justify-start h-11 gap-3 font-medium ${
        variant === "outline"
          ? "hover:bg-slate-50 text-slate-700 bg-transparent"
          : "hover:bg-red-600"
      }`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingLabel || label}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
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
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          Admin Actions
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">Manage order and company details</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <ActionButton icon={<Plus className="w-4 h-4" />} label="Add Milestone" onClick={onAddMilestone} />
          <ActionButton
            icon={<UserCheck className="w-4 h-4" />}
            label="Assign Registered Agent"
            onClick={onAssignAgent}
            disabled={agentUpdating || !company}
          />
          <ActionButton
            icon={<MapPin className="w-4 h-4" />}
            label="Assign Mailing Address"
            onClick={onAssignAddress}
            disabled={addressUpdating || !company}
          />
          <ActionButton
            icon={<Hash className="w-4 h-4" />}
            label={hasEIN ? "View / Edit EIN" : "Assign EIN"}
            onClick={onAssignEIN}
            disabled={einUpdating || !company}
          />
          <ActionButton
            icon={<Hash className="w-4 h-4" />}
            label={company?.itin ? "View / Edit ITIN" : "Assign ITIN"}
            onClick={onAssignITIN}
            disabled={itinUpdating || !company}
          />
          <ActionButton
            icon={<Building2 className="w-4 h-4" />}
            label={company?.businessId ? "View / Edit Business ID" : "Assign Business ID"}
            onClick={onAssignBusinessId}
            disabled={businessIdUpdating || !company}
          />
          <ActionButton
            icon={<FileBarChart className="w-4 h-4" />}
            label="Tax Information"
            onClick={onTaxInfo}
            disabled={taxUpdating || !company}
          />
          <ActionButton
            icon={<FileCheck className="w-4 h-4" />}
            label="Manage Milestones"
            onClick={onManageMilestones}
            disabled={milestoneUpdating}
          />
          <ActionButton
            icon={<Download className="w-4 h-4" />}
            label="Download Invoice"
            onClick={onDownloadInvoice}
          />

          <div className="pt-2 border-t border-slate-100">
            <ActionButton
              icon={<Trash2 className="w-4 h-4" />}
              label="Delete Order"
              onClick={onDeleteOrder}
              variant="destructive"
              loading={deleting}
              loadingLabel="Deleting..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
