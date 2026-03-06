"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Package, UserCheck, Home, FileCheck, FileText, Hash, Trash2, Mail, Loader2 } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

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
  onCustomMilestoneComplete?: (milestone: { id: string; title: string; description?: string }) => void
  onDeleteCustomMilestone: (id: string) => void
  deletingMilestoneId: string | null
  customerEmail?: string
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
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            completed ? "bg-stone-900" : "bg-stone-100"
          }`}
        >
          <span className={`${completed ? "text-white" : "text-stone-400"}`}>{icon}</span>
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 mb-1 min-h-[1.25rem] ${completed ? "bg-stone-300" : "bg-stone-100"}`} />
        )}
      </div>
      <div className={`pb-${isLast ? "0" : "4"} pt-0.5 flex-1`}>
        <p className={`text-sm leading-tight font-medium ${completed ? "text-stone-900" : "text-stone-400"}`}>
          {label}
        </p>
        {completed && <p className="text-xs text-stone-400 mt-0.5">Completed</p>}
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
  customerEmail,
}: FormationProgressCardProps) {
  const { toast } = useToast()

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [pendingMilestoneId, setPendingMilestoneId] = useState<string | null>(null)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [emailSending, setEmailSending] = useState(false)

  const handleCustomMilestoneClick = (m: any) => {
    if (!m.completed) {
      // Marking as complete — open email modal
      setEmailTo(customerEmail || "")
      setEmailSubject(`Milestone Completed: ${m.title}`)
      setEmailContent(
        `Dear Customer,\n\nWe are pleased to inform you that the following milestone has been completed:\n\n${m.title}${m.description ? `\n${m.description}` : ""}\n\nThank you for your business.\n\nBuzz Filing Team`,
      )
      setPendingMilestoneId(m.id)
      setEmailModalOpen(true)
    } else {
      // Uncompleting — just toggle
      onCustomMilestoneToggle(m.id)
    }
  }

  const handleConfirmComplete = async (sendEmail: boolean) => {
    if (!pendingMilestoneId) return

    // Save the milestone completion
    onCustomMilestoneToggle(pendingMilestoneId)

    if (sendEmail) {
      if (!emailTo || !emailSubject || !emailContent) {
        toast({ title: "Missing fields", description: "Please fill in all email fields.", variant: "destructive" })
        return
      }
      setEmailSending(true)
      try {
        const token = authService.getToken()
        const res = await fetch("/api/email/milestone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ to: emailTo, subject: emailSubject, content: emailContent }),
        })
        const data = await res.json()
        if (data.success) {
          toast({ title: "Email Sent", description: `Notification sent to ${emailTo}` })
        } else {
          toast({ title: "Email Failed", description: data.error || "Failed to send email", variant: "destructive" })
        }
      } catch {
        toast({ title: "Email Failed", description: "Could not send email", variant: "destructive" })
      } finally {
        setEmailSending(false)
      }
    }

    setEmailModalOpen(false)
    setPendingMilestoneId(null)
  }

  const coreMilestones = [
    { icon: <Package className="w-3.5 h-3.5" />, label: "Order Processed", done: milestones.orderSuccessfullyProcessed },
    { icon: <UserCheck className="w-3.5 h-3.5" />, label: "Registered Agent Assigned", done: milestones.registeredAgentAssigned },
    { icon: <Home className="w-3.5 h-3.5" />, label: "Business Address Issued", done: milestones.businessMailingAddressIssued },
    { icon: <FileCheck className="w-3.5 h-3.5" />, label: "Company Formation Completed", done: milestones.companyFormationCompleted },
    { icon: <FileText className="w-3.5 h-3.5" />, label: "EIN Application Submitted", done: milestones.einApplicationSubmitted },
    { icon: <Hash className="w-3.5 h-3.5" />, label: "EIN Obtained", done: milestones.einObtained },
  ]

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-stone-800 tracking-tight">Formation Progress</span>
            <span className="text-xs font-medium text-stone-400">
              {completedDefaultMilestones}/{totalDefaultMilestones}
            </span>
          </div>
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
                isLast={i === coreMilestones.length - 1 && !company?.customMilestones?.length}
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
                        onClick={() => handleCustomMilestoneClick(m)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          m.completed ? "bg-stone-900 border-stone-900" : "border-stone-300 hover:border-stone-500"
                        }`}
                      >
                        {m.completed && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                            <path
                              d="M1 4l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-medium leading-none ${m.completed ? "text-stone-400 line-through" : "text-stone-800"}`}
                        >
                          {m.title}
                        </p>
                        {m.description && <p className="text-xs text-stone-400 mt-0.5">{m.description}</p>}
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

      {/* Email notification modal */}
      <Dialog open={emailModalOpen} onOpenChange={(v) => { if (!emailSending) setEmailModalOpen(v) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-stone-600" />
              Send Milestone Notification
            </DialogTitle>
            <DialogDescription>
              Milestone marked as completed. Optionally send an email notification to the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="customer@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-content">Content</Label>
              <Textarea
                id="email-content"
                placeholder="Email body..."
                rows={6}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleConfirmComplete(false)}
              disabled={emailSending}
            >
              Skip, just complete
            </Button>
            <Button
              onClick={() => handleConfirmComplete(true)}
              disabled={emailSending}
              className="bg-stone-900 hover:bg-stone-800 text-white"
            >
              {emailSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send & Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
