"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Package, UserCheck, Home, FileCheck, HashIcon, CheckCircle2, Trash2 } from "lucide-react"

interface MilestoneState {
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
}

interface Company {
  name: string
  customMilestones?: CustomMilestone[]
}

interface MilestonesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  milestones: MilestoneState
  milestoneUpdating: boolean
  completedDefaultMilestones: number
  totalDefaultMilestones: number
  completionPercentage: number
  completedMilestonesWithCustom: number
  totalMilestonesWithCustom: number
  onMilestoneToggle: (milestone: keyof MilestoneState) => void
  onCustomMilestoneToggle?: (id: string) => void
  onDeleteCustomMilestone: (id: string) => void
  deletingMilestoneId: string | null
}

export function MilestonesDialog({
  open,
  onOpenChange,
  company,
  milestones,
  milestoneUpdating,
  completedDefaultMilestones,
  totalDefaultMilestones,
  completionPercentage,
  completedMilestonesWithCustom,
  totalMilestonesWithCustom,
  onMilestoneToggle,
  onCustomMilestoneToggle,
  onDeleteCustomMilestone,
  deletingMilestoneId,
}: MilestonesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Manage Formation Milestones</DialogTitle>
          <DialogDescription>
            Toggle milestones to update the formation progress for {company?.name}
            <br />
            <span className="text-sm text-slate-600 mt-2 block">
              Core Progress: {completedDefaultMilestones}/{totalDefaultMilestones} ({completionPercentage}%)
              {company?.customMilestones && company.customMilestones.length > 0 && (
                <span className="text-slate-500">
                  {" "}
                  • Total with Custom: {completedMilestonesWithCustom}/{totalMilestonesWithCustom}
                </span>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <div className="flex items-start gap-3 flex-1">
                <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Order Successfully Processed</p>
                  <p className="text-xs text-slate-500 mt-0.5">Order received and confirmed</p>
                </div>
              </div>
              <Switch
                checked={milestones.orderSuccessfullyProcessed}
                onCheckedChange={() => onMilestoneToggle("orderSuccessfullyProcessed")}
                disabled={milestoneUpdating}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <div className="flex items-start gap-3 flex-1">
                <UserCheck className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Registered Agent Assigned</p>
                  <p className="text-xs text-slate-500 mt-0.5">Agent information provided</p>
                </div>
              </div>
              <Switch
                checked={milestones.registeredAgentAssigned}
                onCheckedChange={() => onMilestoneToggle("registeredAgentAssigned")}
                disabled={milestoneUpdating}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <div className="flex items-start gap-3 flex-1">
                <Home className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Business Mailing Address Issued</p>
                  <p className="text-xs text-slate-500 mt-0.5">Business address assigned</p>
                </div>
              </div>
              <Switch
                checked={milestones.businessMailingAddressIssued}
                onCheckedChange={() => onMilestoneToggle("businessMailingAddressIssued")}
                disabled={milestoneUpdating}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <div className="flex items-start gap-3 flex-1">
                <FileCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Company Formation Completed</p>
                  <p className="text-xs text-slate-500 mt-0.5">Business entity formed</p>
                </div>
              </div>
              <Switch
                checked={milestones.companyFormationCompleted}
                onCheckedChange={() => onMilestoneToggle("companyFormationCompleted")}
                disabled={milestoneUpdating}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <div className="flex items-start gap-3 flex-1">
                <HashIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">EIN Application Submitted</p>
                  <p className="text-xs text-slate-500 mt-0.5">Application sent to IRS</p>
                </div>
              </div>
              <Switch
                checked={milestones.einApplicationSubmitted}
                onCheckedChange={() => onMilestoneToggle("einApplicationSubmitted")}
                disabled={milestoneUpdating}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <div className="flex items-start gap-3 flex-1">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">EIN Obtained Successfully</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tax ID number received</p>
                </div>
              </div>
              <Switch
                checked={milestones.einObtained}
                onCheckedChange={() => onMilestoneToggle("einObtained")}
                disabled={milestoneUpdating}
                className="flex-shrink-0"
              />
            </div>

            {company?.customMilestones && company.customMilestones.length > 0 && (
              <>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Custom Milestones</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Custom milestones are tracked separately and don&apos;t affect the core progress percentage
                  </p>
                </div>
                {company.customMilestones.map((customMilestone) => (
                  <div
                    key={customMilestone.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <CheckCircle2
                        className={`w-5 h-5 flex-shrink-0 ${(customMilestone as any).completed ? "text-green-600" : "text-slate-400"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{customMilestone.title}</p>
                        {customMilestone.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{customMilestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={(customMilestone as any).completed ?? false}
                        onCheckedChange={() => onCustomMilestoneToggle?.(customMilestone.id)}
                        disabled={milestoneUpdating}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCustomMilestone(customMilestone.id)}
                        disabled={deletingMilestoneId === customMilestone.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
