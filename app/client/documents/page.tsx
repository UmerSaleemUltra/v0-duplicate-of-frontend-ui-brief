"use client"

import { useAuthGuard } from "@/lib/use-auth-guard"
import { ClientShell } from "@/components/client/client-shell"
import { FileText, Download, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  // Seed from localStorage cache for instant paint — API refresh happens in background
  const [documents, setDocuments] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`docs_cache_${selectedCompanyId}`)
        if (cached) return JSON.parse(cached)
      } catch { /* ignore */ }
    }
    return []
  })
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  // Only show skeleton if no cached data exists
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return !localStorage.getItem(`docs_cache_${selectedCompanyId}`)
      } catch { /* ignore */ }
    }
    return true
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
      try {
        localStorage.setItem(`docs_cache_${selectedCompanyId}`, JSON.stringify(businessDocs))
      } catch { /* ignore */ }
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

  const filteredDocuments = searchQuery
    ? documents.filter((d) =>
        (d.title || d.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.type || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
            <p className="text-slate-600 text-xs sm:text-sm md:text-base">
              Access and manage your business documents
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents by name or type..."
              className="pl-10 h-10 border-slate-200 focus:border-primary focus:ring-primary text-sm"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2 text-sm sm:text-base">No documents yet</p>
                <p className="text-xs sm:text-sm text-slate-500">
                  Documents uploaded by admin will appear here automatically
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Document Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Size</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDocuments.map((doc, index) => (
                    <tr
                      key={doc.id}
                      className={index !== currentDocuments.length - 1 ? "border-b border-slate-200" : ""}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-900 truncate">
                            {doc.title || doc.name || "Untitled Document"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {doc.fileSize
                          ? `${(doc.fileSize / 1024).toFixed(0)} KB`
                          : doc.size
                            ? `${(doc.size / 1024).toFixed(0)} KB`
                            : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                            onClick={() => handleView(doc)}
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                            onClick={() => handleDownload(doc)}
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-slate-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredDocuments.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 bg-white">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`${currentPage === 1 ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"}`}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(page)}
                    className={`min-w-[36px] cursor-pointer ${
                      currentPage === page 
                        ? "bg-[#dc0000] text-white" 
                        : "text-slate-700"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`${currentPage === totalPages ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"}`}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientShell>
  )
}
