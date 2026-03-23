"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { DOCUMENT_TYPES } from "@/components/admin/request-document-modal"

interface DocumentRequest {
  id: string
  documentType: string
  description?: string
  status: "pending" | "submitted" | "approved" | "rejected"
  requestedAt: string
  submittedAt?: string
  notes?: string
  companyName?: string
}

interface DocumentRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requests: DocumentRequest[]
  onRequestFulfilled?: (requestId: string) => void
}

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      )
    case "submitted":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          Submitted
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 gap-1 shrink-0">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}

function UploadZone({
  onFile,
  uploading,
  uploaded,
  fileName,
}: {
  onFile: (f: File) => void
  uploading: boolean
  uploaded: boolean
  fileName?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  if (uploaded) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800 truncate">{fileName}</p>
          <p className="text-xs text-green-600 mt-0.5">File ready to submit</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs text-green-600 hover:underline shrink-0"
        >
          Change
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        rounded-xl border-2 border-dashed px-6 py-8 flex flex-col items-center gap-3 cursor-pointer transition-colors
        ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"}
        ${uploading ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      {uploading ? (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      ) : (
        <UploadCloud className="w-8 h-8 text-gray-300" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          {uploading ? "Uploading..." : "Click or drag & drop to upload"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, DOC — max 200 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic,.webp"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  )
}

export function DocumentRequestModal({
  open,
  onOpenChange,
  requests,
  onRequestFulfilled,
}: DocumentRequestModalProps) {
  const pendingRequests = requests.filter((r) => r.status === "pending")
  const [currentIndex, setCurrentIndex] = useState(0)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedForId, setUploadedForId] = useState<string | null>(null)

  const currentRequest = pendingRequests[currentIndex] ?? null

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadedForId(null)
  }

  const handleSubmit = async () => {
    if (!selectedFile || !currentRequest) return
    setUploading(true)
    try {
      const token = authService.getToken()
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch(`/api/document-requests/${currentRequest.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")

      setUploadedForId(currentRequest.id)
      onRequestFulfilled?.(currentRequest.id)

      toast({
        title: "Document submitted",
        description: "Your document has been uploaded successfully.",
      })

      // Auto-advance to next pending request after a short delay
      setTimeout(() => {
        setSelectedFile(null)
        setUploadedForId(null)
        const nextIndex = currentIndex < pendingRequests.length - 1 ? currentIndex : Math.max(0, currentIndex - 1)
        setCurrentIndex(nextIndex)
      }, 1500)
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setUploadedForId(null)
    onOpenChange(false)
  }

  // No pending requests — show a "all done" state
  if (pendingRequests.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">All Requests Fulfilled</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-0.5">
                  You have uploaded all requested documents.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center text-center gap-2">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="text-sm text-gray-500">No pending document requests.</p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const justUploaded = uploadedForId === currentRequest?.id

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-gray-900">Document Required</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-0.5">
                  Your admin has requested a document. Please upload it below.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Pagination if multiple pending requests */}
          {pendingRequests.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Request {currentIndex + 1} of {pendingRequests.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setSelectedFile(null); setUploadedForId(null) }}
                  disabled={currentIndex === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => { setCurrentIndex((i) => Math.min(pendingRequests.length - 1, i + 1)); setSelectedFile(null); setUploadedForId(null) }}
                  disabled={currentIndex === pendingRequests.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Request details card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {DOCUMENT_TYPES.find((t) => t.value === currentRequest?.documentType)?.label ?? currentRequest?.documentType}
              </p>
              {statusBadge(currentRequest?.status)}
            </div>
            {currentRequest?.description && (
              <p className="text-xs text-gray-600 leading-relaxed">{currentRequest.description}</p>
            )}
            <p className="text-xs text-gray-400">
              Requested{" "}
              {currentRequest?.requestedAt
                ? new Date(currentRequest.requestedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </p>
          </div>

          {/* Upload zone */}
          {justUploaded ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-sm font-medium text-green-700">Document submitted successfully!</p>
            </div>
          ) : (
            <UploadZone
              onFile={handleFileSelect}
              uploading={uploading}
              uploaded={!!selectedFile && !uploading}
              fileName={selectedFile?.name}
            />
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="order-last sm:order-first"
          >
            Close — Remind me later
          </Button>
          {!justUploaded && (
            <Button
              size="sm"
              disabled={!selectedFile || uploading}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Submit Document
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
