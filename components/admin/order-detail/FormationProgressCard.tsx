"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react"

interface Milestones {
  orderSuccessfullyProcessed: boolean
  registeredAgentAssigned: boolean
  businessMailingAddressIssued: boolean
  companyFormationCompleted: boolean
  einApplicationSubmitted: boolean
  einObtained: boolean
}

interface FormationProgressCardProps {
  milestones: Milestones
  company: any
  completedDefaultMilestones: number
  totalDefaultMilestones: number
  completionPercentage: number
  completedMilestonesWithCustom: number
  totalMilestonesWithCustom: number
  onCustomMilestoneToggle: (id: string) => void
  onDeleteCustomMilestone: (id: string) => void
  deletingMilestoneId: string | null
}

interface MilestoneRowProps {
  icon: React.ReactNode
  label: string
  completed: boolean
}

function MilestoneRow({ icon, label, completed }: MilestoneRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        completed ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={completed ? "text-emerald-600" : "text-slate-400"}>{icon}</span>
        <span className={`text-sm font-medium ${completed ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
      </div>
      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      ) : (
        <Clock className="w-5 h-5 text-slate-300 shrink-0" />
      )}
    </div>
  )
}

export function FormationProgressCard({
  milestones,
  company,
  completedDefaultMilestones,
  totalDefaultMilestones,
  completionPercentage,
  completedMilestonesWithCustom,
  totalMilestonesWithCustom,
  onCustomMilestoneToggle,
  onDeleteCustomMilestone,
  deletingMilestoneId,
}: FormationProgressCardProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-slate-600" />
          Formation Progress
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          {completedDefaultMilestones} of {totalDefaultMilestones} core milestones completed ({completionPercentage}%)
          {company?.customMilestones?.length > 0 && (
            <span className="text-slate-400">
              {" "}
              &bull; {completedMilestonesWithCustom} of {totalMilestonesWithCustom} total
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Core Milestones */}
        <div className="space-y-2">
          <MilestoneRow
            icon={<Package className="w-4 h-4" />}
            label="Order Successfully Processed"
            completed={milestones.orderSuccessfullyProcessed}
          />
          <MilestoneRow
            icon={<UserCheck className="w-4 h-4" />}
            label="Registered Agent Assigned"
            completed={milestones.registeredAgentAssigned}
          />
          <MilestoneRow
            icon={<Home className="w-4 h-4" />}
            label="Business Mailing Address Issued"
            completed={milestones.businessMailingAddressIssued}
          />
          <MilestoneRow
            icon={<FileCheck className="w-4 h-4" />}
            label="Company Formation Completed"
            completed={milestones.companyFormationCompleted}
          />
          <MilestoneRow
            icon={<FileText className="w-4 h-4" />}
            label="EIN Application Submitted"
            completed={milestones.einApplicationSubmitted}
          />
          <MilestoneRow
            icon={<HashIcon className="w-4 h-4" />}
            label="EIN Successfully Processed"
            completed={milestones.einObtained}
          />

          {/* Custom Milestones */}
          {company?.customMilestones && company.customMilestones.length > 0 && (
            <>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Custom Milestones</p>
              </div>
              {company.customMilestones.map((milestone: any) => (
                <div
                  key={milestone.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    milestone.completed ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck
                      className={`w-4 h-4 ${milestone.completed ? "text-emerald-600" : "text-slate-400"}`}
                    />
                    <div>
                      <span
                        className={`text-sm font-medium ${milestone.completed ? "text-slate-900" : "text-slate-500"}`}
                      >
                        {milestone.title}
                      </span>
                      {milestone.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{milestone.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCustomMilestoneToggle(milestone.id)}
                      className="h-8 w-8 p-0"
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-300" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCustomMilestone(milestone.id)}
                      disabled={deletingMilestoneId === milestone.id}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
