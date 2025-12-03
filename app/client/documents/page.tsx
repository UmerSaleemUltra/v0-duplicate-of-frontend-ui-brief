"use client"

import { useAuthGuard } from "@/lib/use-auth-guard"
import { ClientShell } from "@/components/client/client-shell"
import { FileText, Download, Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

export default function DocumentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("client")
  const { selectedCompanyId } = useSelectedCompany()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (selectedCompanyId) {
      loadDocuments()
    }
  }, [selectedCompanyId])

  const loadDocuments = async () => {
    if (!selectedCompanyId) return

    setLoading(true)
    try {
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view documents.",
          variant: "destructive",
        })
        return
      }

      const response = await ApiClient.documents.getAll(token, selectedCompanyId)
      const docs = response.data || []
      const businessDocs = docs
        .filter((doc: any) => !doc.isMailDocument)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.uploadedAt).getTime()
          const dateB = new Date(b.createdAt || b.uploadedAt).getTime()
          return dateB - dateA
        })
      setDocuments(businessDocs)
    } catch (error) {
      console.error("Error loading documents:", error)
      toast({
        title: "Error Loading Documents",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDocuments()
    setRefreshing(false)
    toast({
      title: "Documents Refreshed",
      description: "Document list has been updated.",
    })
  }

  const handleDownload = async (doc: any) => {
    try {
      if (doc.fileUrls && doc.fileUrls.length > 1) {
        // Download all files
        for (const fileInfo of doc.fileUrls) {
          if (!fileInfo.url) {
            console.error("[v0] Missing URL for file:", fileInfo.name)
            continue
          }

          const response = await fetch(fileInfo.url)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = fileInfo.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        toast({
          title: "Downloads Started",
          description: `Downloading ${doc.fileUrls.length} files from ${doc.title}`,
        })
      } else {
        // Single file download
        const fileUrl = doc.fileUrl
        if (!fileUrl) {
          console.error("[v0] Document URL not available for:", doc.title)
          toast({
            title: "Download Failed",
            description: "Document URL not available.",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(fileUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = doc.fileName || doc.name || doc.title || "document"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: "Download Started",
          description: `Downloading ${doc.fileName || doc.name || doc.title}`,
        })
      }
    } catch (error) {
      console.error("[v0] Download error:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleView = async (doc: any) => {
    try {
      if (doc.fileUrls && doc.fileUrls.length > 1) {
        setSelectedDoc({
          ...doc,
          url: doc.fileUrls[0].url,
          allFiles: doc.fileUrls,
        })
      } else {
        const fileUrl = doc.fileUrl
        if (!fileUrl) {
          toast({
            title: "View Failed",
            description: "Document URL not available.",
            variant: "destructive",
          })
          return
        }
        setSelectedDoc({ ...doc, url: fileUrl })
      }
    } catch (error) {
      console.error("View error:", error)
      toast({
        title: "View Failed",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const completedDocs = documents.filter((d) => d.status === "ready" || !d.status)
  const pendingDocs = documents.filter((d) => d.status === "pending")

  if (authLoading) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying authentication...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ClientShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Documents</h1>
              <p className="text-slate-600 text-sm sm:text-base">Access and manage your business documents</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{documents.length}</div>
                <div className="text-sm text-slate-600">Total Documents</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{completedDocs.length}</div>
                <div className="text-sm text-slate-600">Ready to Download</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-spin" />
              <p className="text-slate-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No documents yet</p>
              <p className="text-sm text-slate-500">Documents uploaded by admin will appear here</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4 gap-2 bg-transparent">
                <RefreshCw className="w-4 h-4" />
                Check for Updates
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 truncate">
                        {doc.title || doc.name || "Untitled Document"}
                        {doc.fileCount && doc.fileCount > 1 && (
                          <Badge variant="secondary" className="ml-2">
                            {doc.fileCount} files
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600">
                        {doc.type || doc.category || "Document"} •{" "}
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"} •{" "}
                        {doc.fileSize
                          ? `${(doc.fileSize / 1024).toFixed(0)} KB`
                          : doc.size
                            ? `${(doc.size / 1024).toFixed(0)} KB`
                            : "N/A"}
                      </div>
                      {doc.fileUrls && doc.fileUrls.length > 1 && (
                        <div className="text-xs text-slate-500 mt-1">
                          Files: {doc.fileUrls.map((f: any) => f.name).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => handleView(doc)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle>
                              {selectedDoc?.name || selectedDoc?.title || "Document Preview"}
                              {selectedDoc?.allFiles && selectedDoc.allFiles.length > 1 && (
                                <div className="mt-2">
                                  <select
                                    className="text-sm border rounded px-2 py-1"
                                    onChange={(e) => {
                                      const fileIndex = Number.parseInt(e.target.value)
                                      setSelectedDoc({
                                        ...selectedDoc,
                                        url: selectedDoc.allFiles[fileIndex].url,
                                      })
                                    }}
                                  >
                                    {selectedDoc.allFiles.map((file: any, idx: number) => (
                                      <option key={idx} value={idx}>
                                        {file.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="overflow-auto max-h-[70vh]">
                            {selectedDoc?.url && (
                              <iframe
                                src={selectedDoc.url}
                                className="w-full h-[600px] border-0"
                                title={selectedDoc.name || selectedDoc.title}
                              />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientShell>
  )
}
