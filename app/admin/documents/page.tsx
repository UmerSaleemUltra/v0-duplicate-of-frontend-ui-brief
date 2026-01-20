"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Upload, Download, FileText, CheckCircle2, X, Pencil, Trash2, Clock } from "lucide-react"
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

      console.log("[v0] Uploading document...", {
        title: documentTitle,
        type: selectedDocType,
        files: selectedFiles.length,
      })

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

      console.log("[v0] Document uploaded successfully, refreshing list...")

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
        console.log("[v0] Failed to create notification:", notifError)
      }

      toast({
        title: "Document Uploaded",
        description:
          selectedFiles.length > 1
            ? `Successfully uploaded ${documentTitle} with ${selectedFiles.length} files to ${company.name}`
            : `Successfully uploaded ${documentTitle} to ${company.name}`,
      })

      await loadData()
      console.log("[v0] Document list refreshed")

      setSelectedCompany("")
      setSelectedDocType("")
      setDocumentTitle("")
      setSelectedFiles([])
      setUploadModalOpen(false)
    } catch (error) {
      console.error("[v0] Upload error:", error)
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
        await ApiClient.documents.delete(editingDocument.id, token)

        await ApiClient.documents.upload(token, editFile, {
          companyId: editingDocument.companyId,
          userId: editingDocument.userId,
          title: editFileName,
          documentType: editDocType,
          description: editingDocument.description || `${editDocType}`,
          uploadedBy: "admin",
        })

        toast({
          title: "Document Replaced",
          description: `Successfully replaced document with ${editFile.name}`,
        })
      } else {
        // Update document metadata without changing the file
        await ApiClient.documents.update(
          editingDocument.id,
          {
            title: editFileName,
            fileName: editFileName,
            type: editDocType,
            documentType: editDocType,
            category: editDocType,
          },
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
        description: "Failed to update document. Please try again.",
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-1">Manage and upload formation documents</p>
        </div>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
              <Upload className="mr-2 h-4 w-4" />
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold mt-1">{totalDocuments}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ready</p>
              <p className="text-2xl font-bold mt-1">{completedDocuments}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer, company, or document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Document Name</th>
                <th className="text-left p-4 font-medium text-sm">Customer</th>
                <th className="text-left p-4 font-medium text-sm">Company</th>
                <th className="text-left p-4 font-medium text-sm">Type</th>
                <th className="text-left p-4 font-medium text-sm">Date</th>
                <th className="text-left p-4 font-medium text-sm">Size</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No documents found
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => {
                  const company = companies.find((c) => c.id === doc.companyId)
                  const user = users.find((u) => u.id === doc.userId)

                  return (
                    <tr key={doc.id} className="border-b border-white/5 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="font-medium">
                          {doc.title || doc.fileName || doc.name || "Untitled Document"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{user?.name || "Unknown"}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{company?.name || "Unknown"}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{doc.documentType || doc.title || "Document"}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : doc.createdAt
                              ? new Date(doc.createdAt).toLocaleDateString()
                              : "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {doc.size
                            ? `${(doc.size / 1024).toFixed(2)} KB`
                            : doc.fileSize
                              ? `${(doc.fileSize / 1024).toFixed(2)} KB`
                              : "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditDocument(doc)}
                            title="Edit document"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={async () => {
                              try {
                                console.log("[v0] Admin downloading document:", doc.id)
                                const token = authService.getToken()
                                if (!token) {
                                  toast({
                                    title: "Authentication Required",
                                    description: "Please log in to download documents.",
                                    variant: "destructive",
                                  })
                                  return
                                }

                                const blob = await ApiClient.documents.download(token, doc.id)
                                if (blob) {
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement("a")
                                  a.href = url
                                  a.download = doc.fileName || doc.title || "document"
                                  a.click()
                                  URL.revokeObjectURL(url)

                                  toast({
                                    title: "Download Started",
                                    description: `Downloading ${doc.fileName || doc.title}`,
                                  })
                                }
                              } catch (error) {
                                console.error("[v0] Download error:", error)
                                toast({
                                  title: "Download Failed",
                                  description: "Failed to download document",
                                  variant: "destructive",
                                })
                              }
                            }}
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteDocument(doc.id, doc.fileName || doc.title)}
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length}{" "}
              documents
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-primary" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

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
                  <SelectItem value="BOI Report">BOI Report</SelectItem>
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
