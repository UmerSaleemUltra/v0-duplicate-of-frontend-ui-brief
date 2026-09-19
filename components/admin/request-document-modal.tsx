"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileSearch, Send, Trash2, CheckCircle2, Clock, XCircle, FileText, ExternalLink } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "government_id", label: "Government-Issued ID" },
  { value: "passport", label: "Passport" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "tax_return", label: "Tax Return" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "business_license", label: "Business License" },
  { value: "articles_of_incorporation", label: "Articles of Incorporation" },
  { value: "operating_agreement", label: "Operating Agreement" },
  { value: "ein_letter", label: "EIN Letter" },
  { value: "other", label: "Other / Custom" },
]

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      )
    case "submitted":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Submitted
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}

interface RequestDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  companyId: string
  userId: string
  companyName?: string
  customerName?: string
  customerEmail?: string
}

export function RequestDocumentModal({
  open,
  onOpenChange,
  orderId,
  companyId,
  userId,
  companyName,
  customerName,
  customerEmail,
}: RequestDocumentModalProps) {
  const { toast } = useToast()

  // Form state
  const [documentType, setDocumentType] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Existing requests list
  const [requests, setRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [view, setView] = useState<"form" | "list">("form")

  // Status update state
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoadingRequests(true)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/document-requests?orderId=${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      setRequests(json.data || [])
    } catch {
      toast({ title: "Error", description: "Failed to load requests.", variant: "destructive" })
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    if (v) {
      // Reset form when opening
      setDocumentType("")
      setDescription("")
      setView("form")
    }
    onOpenChange(v)
  }

  const handleViewList = () => {
    setView("list")
    fetchRequests()
  }

  const handleSubmit = async () => {
    if (!documentType) {
      toast({ title: "Select a document type", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const token = authService.getToken()
      const res = await fetch("/api/document-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          companyId,
          userId,
          documentType,
          description: description.trim(),
          companyName,
          customerName,
          customerEmail,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({
        title: "Document Requested",
        description: `A request for "${DOCUMENT_TYPES.find((t) => t.value === documentType)?.label}" has been sent to the client.`,
      })
      setDocumentType("")
      setDescription("")
      setView("list")
      fetchRequests()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
    setUpdatingId(requestId)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/document-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      setRequests((prev) => prev.map((r) => (r.id === requestId ? json.data : r)))
      toast({ title: "Status updated" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (requestId: string) => {
    setDeletingId(requestId)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/document-requests/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast({ title: "Request deleted" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {/* ── FORM VIEW ── */}
        {view === "form" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileSearch className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">Request Document from Client</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-0.5">
                    {companyName ? `For ${companyName}` : "Send a document upload request to the client."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="docType" className="text-sm font-medium text-gray-700">
                  Document Type <span className="text-red-500">*</span>
                </Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="docType" className="h-10">
                    <SelectValue placeholder="Select document type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Additional Instructions{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="e.g. Please upload a color scan of your passport (all pages), valid within the last 6 months..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[90px] text-sm resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewList}
                className="text-sm order-last sm:order-first"
              >
                View Past Requests
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !documentType}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileSearch className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">Document Requests</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-0.5">
                    {companyName ? `Requests for ${companyName}` : "All document requests for this order."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2 max-h-[400px] overflow-y-auto space-y-3">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <FileText className="w-10 h-10 text-gray-200" />
                  <p className="text-sm text-gray-500">No document requests yet for this order.</p>
                </div>
              ) : (
                requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {DOCUMENT_TYPES.find((t) => t.value === r.documentType)?.label ?? r.documentType}
                        </p>
                        {r.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          Requested{" "}
                          {new Date(r.requestedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="shrink-0">{statusBadge(r.status)}</div>
                    </div>

                    {/* Submitted document link */}
                    {r.submittedDocumentUrl && (
                      <a
                        href={r.submittedDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{r.submittedDocumentName || "View uploaded document"}</span>
                      </a>
                    )}

                    {/* Admin status actions */}
                    {r.status === "submitted" && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                          disabled={updatingId === r.id}
                          onClick={() => handleUpdateStatus(r.id, "approved")}
                        >
                          {updatingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                          disabled={updatingId === r.id}
                          onClick={() => handleUpdateStatus(r.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Delete */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Delete request"
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                size="sm"
                onClick={() => setView("form")}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                New Request
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
