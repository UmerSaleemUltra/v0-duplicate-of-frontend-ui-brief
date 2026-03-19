"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Upload, Download, FileText, CheckCircle2, X, Pencil, Trash2, Clock, Copy, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const MAX_LEN = 28

function TruncatedCell({ text, maxLen = MAX_LEN }: { text: string; maxLen?: number }) {
  const [copied, setCopied] = useState(false)
  if (!text || text === "—") return <span className="text-slate-400">—</span>
  const isTruncated = text.length > maxLen
  const display = isTruncated ? text.slice(0, maxLen) + "…" : text

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!isTruncated) return <span>{text}</span>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 cursor-default">
          <span className="truncate max-w-[160px]">{display}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy() }}
            className="shrink-0 text-slate-300 hover:text-slate-600 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedDocType, setSelectedDocType] = useState("")
  const [documentTitle, setDocumentTitle] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [companySearch, setCompanySearch] = useState("")

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<any | null>(null)
  const [editFileName, setEditFileName] = useState("")
  const [editDocType, setEditDocType] = useState("")
  const [editFile, setEditFile] = useState<File | null>(null)

  const [documents, setDocuments] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  useEffect(() => {
    loadData()

    const intervalId = setInterval(() => {
      loadData()
    }, 10000) // Refresh every 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const token = authService.getToken()
      if (!token) return

      const [companiesResponse, documentsResponse, usersResponse] = await Promise.all([
        ApiClient.companies.getAll(token),
        ApiClient.documents.getAll(token),
        ApiClient.users.getAll(token),
      ])

      const companiesData = (companiesResponse.data || []).map((c: any) => ({
        ...c,
        id: c.id || c._id?.toString() || c._id,
      }))

      const usersData = (usersResponse.data || []).map((u: any) => ({
        ...u,
        id: u.id || u._id?.toString() || u._id,
      }))

      const docsData = (documentsResponse.data || [])
        .filter((doc: any) => !doc.isMailDocument)
        .map((doc: any) => ({
          ...doc,
          id: doc.id || doc._id?.toString() || doc._id,
          fileUrls: Array.isArray(doc.fileUrls) ? doc.fileUrls : [doc.fileUrl || doc.url].filter(Boolean),
          documentType: doc.documentType || doc.type || "Document",
        }))

      setCompanies(companiesData)
      setUsers(usersData)
      setDocuments(docsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedCompany || !selectedDocType || !documentTitle || selectedFiles.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select at least one file",
        variant: "destructive",
      })
      return
    }

    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) return

    setUploading(true)

    try {
      const token = authService.getToken()
      if (!token) throw new Error("No auth token")

      const formData = new FormData()
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })
      formData.append("companyId", company.id)
      formData.append("userId", company.userId)
      formData.append("title", documentTitle)
      formData.append("type", selectedDocType)
      formData.append("category", "general")

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      // Create notification
      try {
        await ApiClient.notifications.create(
          {
            userId: company.userId,
            type: "document",
            title: "New Document Uploaded",
            message:
              selectedFiles.length > 1
                ? `${documentTitle} with ${selectedFiles.length} files has been uploaded to your account for ${company.name}`
                : `${documentTitle} has been uploaded to your account for ${company.name}`,
            actionUrl: "/client/documents",
            metadata: {
              documentTitle,
              documentType: selectedDocType,
              companyName: company.name,
              companyId: company.id,
              fileCount: selectedFiles.length,
            },
          },
          token,
        )
      } catch (notifError) {
        // Notification creation failed
      }

      toast({
        title: "Document Uploaded",
        description:
          selectedFiles.length > 1
            ? `Successfully uploaded ${documentTitle} with ${selectedFiles.length} files to ${company.name}`
            : `Successfully uploaded ${documentTitle} to ${company.name}`,
      })

      await loadData()

      setSelectedCompany("")
      setSelectedDocType("")
      setDocumentTitle("")
      setSelectedFiles([])
      setUploadModalOpen(false)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = authService.getToken()
      if (!token) throw new Error("No auth token")

      await ApiClient.documents.delete(docId, token)

      toast({
        title: "Document Deleted",
        description: `Successfully deleted ${docName}`,
      })

      await loadData()
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc)
    setEditFileName(doc.fileName || doc.title)
    setEditDocType(doc.documentType || "Other")
    setEditFile(null)
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingDocument || !editFileName) {
      toast({
        title: "Missing Information",
        description: "Please provide a file name",
        variant: "destructive",
      })
      return
    }

    try {
      const token = authService.getToken()
      if (!token) throw new Error("No auth token")

      if (editFile) {
        // Replace document by uploading new one first, then deleting old one
        const docId = editingDocument.id || editingDocument._id?.toString() || editingDocument._id
        
        if (!docId) {
          throw new Error("Document ID is missing")
        }

        // First upload the new document with same metadata using direct fetch like the working upload
        const formData = new FormData()
        formData.append("files", editFile)
        formData.append("companyId", editingDocument.companyId)
        formData.append("userId", editingDocument.userId)
        formData.append("title", editFileName)
        formData.append("type", editDocType)
        formData.append("category", "general")

        const uploadResponse = await fetch("/api/documents", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Upload failed: ${errorText}`)
        }

        await uploadResponse.json()

        // Only delete the old document after successful upload
        await ApiClient.documents.delete(docId, token)

        toast({
          title: "Document Replaced",
          description: `Successfully replaced document with ${editFile.name}`,
        })
      } else {
        const updateData = {
          title: editFileName,
          fileName: editFileName,
          type: editDocType,
          documentType: editDocType,
          category: editDocType,
        }
        
        // Update document metadata without changing the file
        await ApiClient.documents.update(
          editingDocument.id,
          updateData,
          token,
        )

        toast({
          title: "Document Updated",
          description: `Successfully updated ${editFileName}`,
        })
      }

      await loadData()
      setEditModalOpen(false)
      setEditingDocument(null)
      setEditFile(null)
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const totalDocuments = documents.length
  const completedDocuments = documents.filter((d) => d.status === "ready").length

  const filteredDocuments = documents.filter((doc) => {
    const company = companies.find((c) => String(c.id) === String(doc.companyId))
    const user = users.find((u) => String(u.id) === String(doc.userId))

    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter

    const matchesType = typeFilter === "all" || doc.type === typeFilter || doc.category === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter])

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded w-40"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-100 rounded w-32"></div>
          <div className="h-10 bg-slate-100 rounded w-32"></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-32"></div>
                  <div className="h-6 bg-slate-100 rounded-full w-24"></div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-slate-100 rounded"></div>
                  <div className="h-3 bg-slate-100 rounded w-32"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-slate-100 rounded"></div>
                  <div className="h-3 bg-slate-100 rounded w-24"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-slate-100 rounded"></div>
                  <div className="h-3 bg-slate-100 rounded w-28"></div>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <div className="flex-1 h-9 bg-slate-200 rounded"></div>
                <div className="h-9 w-9 bg-slate-200 rounded"></div>
                <div className="h-9 w-9 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and upload formation documents</p>
        </div>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl w-full md:w-auto">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document to Company</DialogTitle>
              <DialogDescription>Select a company and upload a document to their account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="company">Select Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger id="company" className="h-10">
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => {
                      const user = users.find((u) => u.id === company.userId)
                      return (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({user?.name || "Unknown"})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Title */}
              <div className="space-y-2">
                <Label htmlFor="documentTitle">Document Title</Label>
                <Input
                  id="documentTitle"
                  placeholder="e.g., Certificate of Formation - 2024"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor="docType">Document Type</Label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger id="docType" className="h-10">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Articles of Organization">Articles of Organization</SelectItem>
                    <SelectItem value="EIN Confirmation">EIN Confirmation</SelectItem>
                    <SelectItem value="Operating Agreement">Operating Agreement</SelectItem>
                    <SelectItem value="Certificate of Formation">Certificate of Formation</SelectItem>
                    <SelectItem value="Banking Resolution">Banking Resolution</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Upload Files</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="h-10"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {selectedFiles.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setSelectedFiles([])}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.length} file(s) selected - Total:{" "}
                    {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUploadSubmit} className="bg-primary hover:bg-primary/90" disabled={uploading}>
                {uploading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Documents</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{totalDocuments}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by customer, company, or document..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm"
        />
      </div>

      <TooltipProvider delayDuration={300}>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">Documents</span>
          <span className="text-xs text-slate-400">{filteredDocuments.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Size</th>
                <th className="px-6 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">No documents found</td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => {
                  const company = companies.find((c) => c.id === doc.companyId)
                  const user = users.find((u) => u.id === doc.userId)

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        <TruncatedCell text={doc.title || doc.fileName || doc.name || "Untitled"} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <TruncatedCell text={user?.name || "—"} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <TruncatedCell text={company?.name || "—"} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{doc.documentType || "Document"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">
                          {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={() => handleEditDocument(doc)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                            onClick={async () => {
                              try {
                                const token = authService.getToken()
                                if (!token) { toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" }); return }
                                const blob = await ApiClient.documents.download(token, doc.id)
                                if (blob) {
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement("a")
                                  a.href = url; a.download = doc.fileName || doc.title || "document"; a.click(); URL.revokeObjectURL(url)
                                  toast({ title: "Download Started", description: `Downloading ${doc.fileName || doc.title}` })
                                }
                              } catch { toast({ title: "Download Failed", description: "Failed to download", variant: "destructive" }) }
                            }} title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500" onClick={() => handleDeleteDocument(doc.id, doc.fileName || doc.title)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">{startIndex + 1}–{Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-3 text-xs">Previous</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button key={page} variant="ghost" size="sm" onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600"}`}>
                  {page}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-3 text-xs">Next</Button>
            </div>
          </div>
        )}
      </div>
      </TooltipProvider>

      {/* Edit Document Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document name, type, or replace the file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFileName">Document Name</Label>
              <Input
                id="editFileName"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="Enter document name"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDocType">Document Type</Label>
              <Select value={editDocType} onValueChange={setEditDocType}>
                <SelectTrigger id="editDocType" className="h-10">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Articles of Organization">Articles of Organization</SelectItem>
                  <SelectItem value="EIN Confirmation">EIN Confirmation</SelectItem>
                  <SelectItem value="Operating Agreement">Operating Agreement</SelectItem>
                  <SelectItem value="Certificate of Formation">Certificate of Formation</SelectItem>
                  <SelectItem value="Banking Resolution">Banking Resolution</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editFile">Replace File (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="editFile"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditFile(e.target.files[0])
                    }
                  }}
                  className="h-10"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {editFile && (
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setEditFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {editFile && (
                <p className="text-sm text-muted-foreground">
                  New file: {editFile.name} ({(editFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              {!editFile && editingDocument && (
                <p className="text-sm text-muted-foreground">
                  Current file: {editingDocument.fileName || editingDocument.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
              {editFile ? "Replace Document" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
