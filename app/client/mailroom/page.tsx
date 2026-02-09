"use client"

import { ClientShell } from "@/components/client/client-shell"
import { Mail, Eye, Search, FileText, Building2, User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import type { MailItem } from "@/lib/types"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { MailroomSkeleton } from "@/components/client/mailroom-skeleton"

export default function MailroomPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const { selectedCompanyId } = useSelectedCompany()
  const { toast } = useToast()
  const [mailItems, setMailItems] = useState<MailItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MailItem[]>([])
  const [typeFilter, setTypeFilter] = useState("all-types")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (selectedCompanyId) {
      loadMailroomData()
    }
  }, [selectedCompanyId])

  const loadMailroomData = async () => {
    if (!selectedCompanyId) return

    try {
      setLoading(true)
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view mail.",
          variant: "destructive",
        })
        return
      }

      const response = await ApiClient.mail.getAll(token, selectedCompanyId)
      const items = response.data || []

      const normalizedItems = items.map((mail: any) => ({
        ...mail,
        id: mail.id || mail._id?.toString(),
        sender: mail.from || mail.sender || "Unknown Sender",
        receivedAt: mail.receivedDate || mail.receivedAt || new Date(),
        type: mail.type || "general",
      }))

      setMailItems(normalizedItems)
      setFilteredItems(normalizedItems)
    } catch (error) {
      console.error("[v0] Error loading mail:", error)
      toast({
        title: "Error Loading Mail",
        description: "Failed to load mail items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = mailItems

    if (typeFilter !== "all-types") {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.from || item.sender || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredItems(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [typeFilter, searchQuery, mailItems])

  const handleDownloadDocument = async (mailId: string) => {
    const mail = mailItems.find((m) => m.id === mailId)
    if (!mail) {
      toast({
        title: "Error",
        description: "Mail item not found",
        variant: "destructive",
      })
      return
    }

    if (!mail.attachments || mail.attachments.length === 0) {
      toast({
        title: "No Attachments",
        description: "This mail item doesn't have any attached documents",
        variant: "destructive",
      })
      return
    }

    try {
      for (const attachment of mail.attachments) {
        const link = document.createElement("a")
        link.href = attachment.fileUrl
        link.download = attachment.name
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast({
        title: "Download Started",
        description: `Downloading ${mail.attachments.length} file(s)`,
      })
    } catch (error) {
      console.error("[v0] Download error:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download attachments. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewDocument = async (mailId: string) => {
    const mail = mailItems.find((m) => m.id === mailId)
    if (!mail || !mail.attachments || mail.attachments.length === 0) {
      toast({
        title: "No Attachments",
        description: "This mail item doesn't have any attached documents",
        variant: "destructive",
      })
      return
    }

    try {
      window.open(mail.attachments[0].fileUrl, "_blank", "noopener,noreferrer")

      toast({
        title: "Document Opened",
        description: "Document opened in a new tab",
      })
    } catch (error) {
      console.error("[v0] View error:", error)
      toast({
        title: "View Failed",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const totalMail = mailItems.length
  const mailWithAttachments = mailItems.filter(
    (m) => m.hasAttachment && m.attachments && m.attachments.length > 0,
  ).length

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMailItems = filteredItems.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "legal":
        return FileText
      case "tax":
        return Building2
      case "letter":
      case "official":
        return Mail
      default:
        return User
    }
  }

  if (isLoading || loading) {
    return (
      <ClientShell>
        <MailroomSkeleton />
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
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Mailroom</h1>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base">
              View and manage official correspondence
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search mail by subject or sender..."
                  className="pl-10 h-10 border-slate-200 focus:border-primary focus:ring-primary text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200 cursor-pointer">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="official">Official</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
                <SelectItem value="package">Package</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2 text-sm sm:text-base">No mail items found</p>
                <p className="text-xs sm:text-sm text-slate-500">Mail sent to your company will appear here</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">From</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Attachments</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMailItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index !== currentMailItems.length - 1 ? "border-b border-slate-200" : ""}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-900 truncate">{item.subject}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{item.from || item.sender}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(item.receivedDate || item.receivedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.hasAttachment && item.attachments && item.attachments.length > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.attachments.length} file(s)
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {item.hasAttachment && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 cursor-pointer"
                                onClick={() => handleViewDocument(item.id)}
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-slate-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 cursor-pointer"
                                onClick={() => handleDownloadDocument(item.id)}
                                title="Download"
                              >
                                <Download className="w-4 h-4 text-slate-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredItems.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 bg-white">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} mail items
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
