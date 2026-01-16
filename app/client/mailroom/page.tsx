"use client"

import { ClientShell } from "@/components/client/client-shell"
import { Mail, Eye, Search, FileText, Building2, User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

      console.log("[v0] Loaded mail items:", normalizedItems.length)
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
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Mailroom</h1>
            <p className="text-slate-600 text-sm sm:text-base">View and manage official correspondence</p>
          </div>
        </div>

        <div className="grid md:grid-cols-1 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{totalMail}</div>
                <div className="text-sm text-slate-600">Total Mail</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 transition-shadow duration-200 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search mail by subject or sender..."
                  className="pl-10 h-10 border-slate-200 focus:border-primary focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200">
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

        <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Your Mail</h2>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <p className="text-slate-900 font-medium">No mail items found</p>
              <p className="text-sm text-slate-600 mt-1">Mail sent to your company will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const Icon = getIcon(item.type)

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{item.subject}</div>
                        <div className="text-sm text-slate-600 truncate">
                          {item.from || item.sender} •{" "}
                          {new Date(item.receivedDate || item.receivedAt).toLocaleDateString()} • {item.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.hasAttachment && item.attachments && item.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <FileText className="w-3 h-3" />
                          <span>{item.attachments.length} file(s)</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {item.hasAttachment && (
                          <>
                            <Button
                              variant="ghost"
                              className="h-10 w-10 p-0 cursor-pointer"
                              onClick={() => handleViewDocument(item.id)}
                              title="View document"
                            >
                              <Eye className="w-4 h-4 cursor-pointer" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-10 w-10 p-0 cursor-pointer"
                              onClick={() => handleDownloadDocument(item.id)}
                              title="Download document"
                            >
                              <Download className="w-4 h-4 cursor-pointer" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ClientShell>
  )
}
