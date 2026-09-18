"use client"

import type React from "react"
import { Clock } from "lucide-react" // Import Clock here

import { useState, useEffect } from "react"
import { Search, Upload, Download, FileText, CheckCircle2, X, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { companyStorage, userStorage, orderStorage, type Company } from "@/lib/local-storage"
import { documentStorage } from "@/lib/document-storage"
import { useToast } from "@/hooks/use-toast"

export default function DocumentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedDocType, setSelectedDocType] = useState("")
  const [documentTitle, setDocumentTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<any | null>(null)
  const [editFileName, setEditFileName] = useState("")
  const [editDocType, setEditDocType] = useState("")

  const [documents, setDocuments] = useState<any[]>([])
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    loadDocuments()
    setCompanies(companyStorage.getAll())
  }, [])

  const loadDocuments = async () => {
    const allDocs = await documentStorage.getAll()
    const businessDocs = allDocs.filter((doc) => !doc.isMailDocument)
    setDocuments(businessDocs)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedCompany || !selectedDocType || !documentTitle || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select a file",
        variant: "destructive",
      })
      return
    }

    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) return

    setUploading(true)

    try {
      await documentStorage.store(selectedFile, {
        companyId: company.id,
        userId: company.userId,
        title: documentTitle,
        description: `${selectedDocType} for ${company.name}`,
        uploadedBy: "admin",
        uploadedAt: new Date().toISOString(),
      })

      toast({
        title: "Document Uploaded",
        description: `Successfully uploaded ${selectedFile.name} to ${company.name}`,
      })

      await loadDocuments()
      setSelectedCompany("")
      setSelectedDocType("")
      setDocumentTitle("")
      setSelectedFile(null)
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
      await documentStorage.delete(docId)
      toast({
        title: "Document Deleted",
        description: `Successfully deleted ${docName}`,
      })
      await loadDocuments()
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
    setEditDocType(doc.documentType || doc.title)
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
      await documentStorage.update(editingDocument.id, {
        fileName: editFileName,
        documentType: editDocType,
      })

      toast({
        title: "Document Updated",
        description: `Successfully updated ${editFileName}`,
      })

      await loadDocuments()
      setEditModalOpen(false)
      setEditingDocument(null)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-brand/10 text-brand border-brand/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const company = companies.find((c) => c.id === doc.companyId)
    const user = userStorage.getById(doc.userId)

    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesType = typeFilter === "all" || doc.title === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and upload formation documents</p>
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
                      const user = userStorage.getById(company.userId)
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
                <Label htmlFor="file">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="h-10"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {selectedFile && (
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setSelectedFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
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
                <th className="text-left p-4 font-medium text-sm">Source</th>
                <th className="text-left p-4 font-medium text-sm">Date</th>
                <th className="text-left p-4 font-medium text-sm">Size</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const company = companies.find((c) => c.id === doc.companyId)
                  const user = userStorage.getById(doc.userId)
                  const order = doc.orderId ? orderStorage.getById(doc.orderId) : null

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
                        {order ? (
                          <Badge variant="outline" className="text-xs">
                            Order #{order.id.slice(-8)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Direct Upload</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={async () => {
                              const blob = await documentStorage.download(doc.id)
                              if (blob) {
                                const url = URL.createObjectURL(blob)
                                window.open(url, "_blank")
                                setTimeout(() => URL.revokeObjectURL(url), 100)
                              }
                            }}
                            title="View document"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
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
                              const blob = await documentStorage.download(doc.id)
                              if (blob) {
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement("a")
                                a.href = url
                                a.download = doc.fileName || doc.title || "document"
                                a.click()
                                URL.revokeObjectURL(url)
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
      </div>

      {/* Edit Document Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document name and type</DialogDescription>
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
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
