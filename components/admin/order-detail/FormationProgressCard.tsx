"use client"

import { Button } from "@/components/ui/button"
import {
  Package,
  UserCheck,
  Home,
  FileCheck,
  FileText,
  Hash,
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

function MilestoneStep({
  icon,
  label,
  completed,
  isLast = false,
}: {
  icon: React.ReactNode
  label: string
  completed: boolean
  isLast?: boolean
}) {
  return (
    <div className="flex gap-4">
      {/* Timeline track */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            completed ? "bg-stone-900" : "bg-stone-100"
          }`}
        >
          <span className={`${completed ? "text-white" : "text-stone-400"}`}>
            {icon}
          </span>
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 mb-1 min-h-[1.25rem] ${completed ? "bg-stone-300" : "bg-stone-100"}`} />
        )}
      </div>

      {/* Label */}
      <div className={`pb-${isLast ? "0" : "4"} pt-0.5 flex-1`}>
        <p className={`text-sm leading-tight font-medium ${completed ? "text-stone-900" : "text-stone-400"}`}>
          {label}
        </p>
        {completed && (
          <p className="text-xs text-stone-400 mt-0.5">Completed</p>
        )}
      </div>
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
  const coreMilestones = [
    { icon: <Package className="w-3.5 h-3.5" />, label: "Order Processed", done: milestones.orderSuccessfullyProcessed },
    { icon: <UserCheck className="w-3.5 h-3.5" />, label: "Registered Agent Assigned", done: milestones.registeredAgentAssigned },
    { icon: <Home className="w-3.5 h-3.5" />, label: "Business Address Issued", done: milestones.businessMailingAddressIssued },
    { icon: <FileCheck className="w-3.5 h-3.5" />, label: "Company Formation Completed", done: milestones.companyFormationCompleted },
    { icon: <FileText className="w-3.5 h-3.5" />, label: "EIN Application Submitted", done: milestones.einApplicationSubmitted },
    { icon: <Hash className="w-3.5 h-3.5" />, label: "EIN Obtained", done: milestones.einObtained },
  ]

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-stone-800 tracking-tight">Formation Progress</span>
          <span className="text-xs font-medium text-stone-400">
            {completedDefaultMilestones}/{totalDefaultMilestones}
          </span>
        </div>
        {/* Thin progress bar — Apple style */}
        <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-900 rounded-full transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Core milestones timeline */}
      <div className="px-6 py-5">
        <div>
          {coreMilestones.map((m, i) => (
            <MilestoneStep
              key={m.label}
              icon={m.icon}
              label={m.label}
              completed={m.done}
              isLast={i === coreMilestones.length - 1 && (!company?.customMilestones?.length)}
            />
          ))}
        </div>

        {/* Custom milestones */}
        {company?.customMilestones && company.customMilestones.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Custom</p>
            <div className="space-y-1">
              {company.customMilestones.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCustomMilestoneToggle(m.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        m.completed
                          ? "bg-stone-900 border-stone-900"
                          : "border-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {m.completed && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p className={`text-sm font-medium leading-none ${m.completed ? "text-stone-400 line-through" : "text-stone-800"}`}>
                        {m.title}
                      </p>
                      {m.description && (
                        <p className="text-xs text-stone-400 mt-0.5">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteCustomMilestone(m.id)}
                    disabled={deletingMilestoneId === m.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
