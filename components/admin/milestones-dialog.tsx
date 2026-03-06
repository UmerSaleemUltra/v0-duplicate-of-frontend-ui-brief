"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Package, UserCheck, Home, FileCheck, HashIcon, CheckCircle2, Trash2, Mail, Bell, X } from "lucide-react"

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
  onCustomMilestoneToggle?: (id: string, sendEmail?: boolean, emailSubject?: string, emailContent?: string, sendNotification?: boolean, notificationMessage?: string) => void
  onDeleteCustomMilestone: (id: string) => void
  deletingMilestoneId: string | null
}

interface PendingToggle {
  milestoneId: string
  milestoneTitle: string
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
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [sendNotification, setSendNotification] = useState(true)

  const handleCustomMilestoneClick = (milestone: CustomMilestone & { completed?: boolean }) => {
    const isCurrentlyCompleted = (milestone as any).completed ?? false

    // If toggling OFF, just toggle directly without modal
    if (isCurrentlyCompleted) {
      onCustomMilestoneToggle?.(milestone.id)
      return
    }

    setEmailSubject("")
    setEmailContent("")
    setNotificationMessage("")
    setSendEmail(true)
    setSendNotification(true)
    setPendingToggle({ milestoneId: milestone.id, milestoneTitle: milestone.title })
  }

  const handleConfirm = () => {
    if (!pendingToggle) return
    onCustomMilestoneToggle?.(
      pendingToggle.milestoneId,
      sendEmail,
      sendEmail ? emailSubject : undefined,
      sendEmail ? emailContent : undefined,
      sendNotification,
      sendNotification ? notificationMessage : undefined,
    )
    setPendingToggle(null)
  }

  const handleSkip = () => {
    if (!pendingToggle) return
    onCustomMilestoneToggle?.(pendingToggle.milestoneId, false, undefined, undefined, false, undefined)
    setPendingToggle(null)
  }

  const handleCancelModal = () => {
    setPendingToggle(null)
  }

  return (
    <>
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
                          onCheckedChange={() => handleCustomMilestoneClick(customMilestone as any)}
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

      {/* Notify customer modal — opens when toggling a custom milestone to completed */}
      <Dialog open={!!pendingToggle} onOpenChange={(v) => { if (!v) handleCancelModal() }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Notify Customer</DialogTitle>
            <DialogDescription>
              Milestone{" "}
              <span className="font-medium text-slate-700">&quot;{pendingToggle?.milestoneTitle}&quot;</span>{" "}
              will be marked as complete. Choose how to notify the customer.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Email section */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-800">Send Email</span>
                </div>
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              </div>
              {sendEmail && (
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-subject" className="text-xs font-medium text-slate-600">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-content" className="text-xs font-medium text-slate-600">Content</Label>
                    <Textarea
                      id="email-content"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      placeholder="Write the email content for the customer..."
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* Email Preview */}
                  {(emailContent || emailSubject) && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600">Email Preview</Label>
                      <div style={{ backgroundColor: "#f5f5f5", padding: "16px", borderRadius: "6px" }}>
                        <div style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          overflow: "hidden",
                          maxWidth: "100%",
                          border: "1px solid #e5e7eb",
                        }}>
                          {/* Logo header */}
                          <div style={{ padding: "20px 24px 16px 24px", textAlign: "center" }}>
                            <img
                              src="/images/buzz-filing-logo.png"
                              alt="Buzz Filing"
                              style={{ height: "32px", width: "auto" }}
                            />
                          </div>
                          {/* Divider */}
                          <div style={{ height: "1px", backgroundColor: "#f0f0f0", margin: "0 24px" }} />
                          {/* Body */}
                          <div style={{ padding: "16px 24px 16px 24px" }}>
                            <p style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#333333",
                              lineHeight: "1.6",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}>
                              {emailContent || <span style={{ color: "#aaa" }}>Email body will appear here...</span>}
                            </p>
                          </div>
                          {/* Footer */}
                          <div style={{ padding: "12px 24px", textAlign: "center", borderTop: "1px solid #f0f0f0" }}>
                            <p style={{ margin: 0, fontSize: "11px", color: "#999999" }}>
                              All rights reserved &copy; 2026 |{" "}
                              <span style={{ color: "#880000", fontWeight: 600 }}>Buzz Filing</span>
                            </p>
                          </div>
                          {/* Bottom accent bar */}
                          <div style={{ backgroundColor: "#880000", height: "6px" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification section */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-800">Send Notification</span>
                </div>
                <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
              </div>
              {sendNotification && (
                <div className="p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="notification-message" className="text-xs font-medium text-slate-600">Message</Label>
                    <Textarea
                      id="notification-message"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Write the in-app notification message..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {/* Primary actions row */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelModal} className="flex-1">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!sendEmail && !sendNotification}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
              >
                {sendEmail && sendNotification
                  ? "Send Email & Notification"
                  : sendEmail
                    ? "Send Email"
                    : sendNotification
                      ? "Send Notification"
                      : "Complete Milestone"}
              </Button>
            </div>
            {/* Secondary action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-slate-500 hover:text-slate-700 gap-1.5 w-full justify-center"
            >
              <X className="w-3.5 h-3.5 flex-shrink-0" />
              Skip &amp; complete later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
