"use client"

import { useAuthGuard } from "@/lib/use-auth-guard"
import { ClientShell } from "@/components/client/client-shell"
import { FileText, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { DocumentsSkeleton } from "@/components/client/documents-skeleton"

export default function DocumentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("client")
  const { selectedCompanyId } = useSelectedCompany()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedCompanyId) {
      loadDocuments()
    }
  }, [selectedCompanyId])

  useEffect(() => {
    const handleRefresh = () => {
      if (selectedCompanyId) {
        loadDocuments()
      }
    }

    window.addEventListener("client-dashboard-refresh", handleRefresh)
    return () => window.removeEventListener("client-dashboard-refresh", handleRefresh)
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

  const handleDownload = async (doc: any) => {
    try {
      console.log("[v0] Starting download for:", doc.title)
      const token = authService.getToken()

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to download documents.",
          variant: "destructive",
        })
        return
      }

      if (doc.fileUrls && doc.fileUrls.length > 1) {
        // Download all files using API proxy
        for (const fileInfo of doc.fileUrls) {
          if (!fileInfo.id && !doc.id) {
            console.error("[v0] Missing document ID for file:", fileInfo.name)
            continue
          }

          const blob = await ApiClient.documents.download(token, fileInfo.id || doc.id)
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
        // Single file download using API proxy
        if (!doc.id) {
          console.error("[v0] Document ID not available for:", doc.title)
          toast({
            title: "Download Failed",
            description: "Document ID not available.",
            variant: "destructive",
          })
          return
        }

        const blob = await ApiClient.documents.download(token, doc.id)
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
        // Open first file in new tab
        window.open(doc.fileUrls[0].url, "_blank", "noopener,noreferrer")

        toast({
          title: "Document Opened",
          description: `Opened ${doc.fileUrls[0].name}. ${doc.fileUrls.length - 1} more file(s) available for download.`,
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
        window.open(fileUrl, "_blank", "noopener,noreferrer")

        toast({
          title: "Document Opened",
          description: "Document opened in a new tab",
        })
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

  if (authLoading || loading) {
    return (
      <ClientShell>
        <DocumentsSkeleton />
      </ClientShell>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ClientShell>
      <div className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Documents</h1>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base">Access and manage your business documents</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900">{documents.length}</div>
                <div className="text-xs sm:text-sm text-slate-600">Total Documents</div>
              </div>
            </div>
          </div>

          {completedDocs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 transition-shadow duration-200 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm flex-shrink-0">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xl sm:text-2xl font-semibold text-slate-900">{completedDocs.length}</div>
                  <div className="text-xs sm:text-sm text-slate-600">Ready to Download</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Your Documents</h2>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2 text-sm sm:text-base">No documents yet</p>
              <p className="text-xs sm:text-sm text-slate-500">
                Documents uploaded by admin will appear here automatically
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 sm:p-4 rounded-lg bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 truncate text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        {doc.title || doc.name || "Untitled Document"}
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs whitespace-nowrap">
                          {doc.type || doc.category || "Document"}
                        </Badge>
                        {doc.fileCount && doc.fileCount > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.fileCount} files
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 break-words mt-1">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"} •{" "}
                        {doc.fileSize
                          ? `${(doc.fileSize / 1024).toFixed(0)} KB`
                          : doc.size
                            ? `${(doc.size / 1024).toFixed(0)} KB`
                            : "N/A"}
                      </div>
                      {doc.fileUrls && doc.fileUrls.length > 1 && (
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          Files: {doc.fileUrls.map((f: any) => f.name).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 self-end sm:self-center">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Ready</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="h-8 w-8 sm:h-10 sm:w-10 p-0 cursor-pointer"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 sm:h-10 sm:w-10 p-0 cursor-pointer"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer" />
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
