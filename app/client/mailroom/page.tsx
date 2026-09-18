"use client"

import { ClientShell } from "@/components/client/client-shell"
import { Mail, Eye, Search, Calendar, FileText, Building2, User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { mailStorage, type MailItem } from "@/lib/local-storage"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { Spinner } from "@/components/ui/spinner"
import { documentStorage } from "@/lib/document-storage"

export default function MailroomPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const { selectedCompanyId } = useSelectedCompany()
  const { toast } = useToast()
  const [mailItems, setMailItems] = useState<MailItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MailItem[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all-types")
  const [searchQuery, setSearchQuery] = useState("")
  const [mailDocuments, setMailDocuments] = useState<Record<string, any>>({})

  useEffect(() => {
    if (selectedCompanyId) {
      loadMailroomData()
    }
  }, [selectedCompanyId])

  useEffect(() => {
    if (selectedCompanyId && mailItems.length > 0) {
      loadMailDocuments()
    }
  }, [selectedCompanyId, mailItems])

  const loadMailroomData = async () => {
    if (!selectedCompanyId) return

    const items = mailStorage.getByCompanyId(selectedCompanyId)
    setMailItems(items)
    setFilteredItems(items)
  }

  const loadMailDocuments = async () => {
    if (!selectedCompanyId) return

    const docs: Record<string, any> = {}
    for (const mail of mailItems) {
      if (mail.documentId) {
        try {
          const doc = await documentStorage.getById(mail.documentId)
          if (doc && (doc.isMailDocument || doc.category === "mail")) {
            docs[mail.documentId] = doc
          }
        } catch (error) {
          console.error("[v0] Error loading mail document:", error)
        }
      }
    }
    setMailDocuments(docs)
  }

  useEffect(() => {
    let filtered = mailItems

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (typeFilter !== "all-types") {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sender.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredItems(filtered)
  }, [statusFilter, typeFilter, searchQuery, mailItems])

  const handleMarkAsRead = (mailId: string) => {
    const mail = mailStorage.getById(mailId)
    if (mail) {
      mailStorage.update(mailId, { ...mail, status: "read" })
      if (selectedCompanyId) {
        const items = mailStorage.getByCompanyId(selectedCompanyId)
        setMailItems(items)
        setFilteredItems(items)
      }
      toast({
        title: "Marked as Read",
        description: "Mail item marked as read",
      })
    }
  }

  const handleDownloadDocument = async (mailId: string) => {
    const mail = mailItems.find((m) => m.id === mailId)
    if (!mail || !mail.documentId) {
      toast({
        title: "No Document",
        description: "This mail item doesn't have an attached document",
        variant: "destructive",
      })
      return
    }

    try {
      const doc = await documentStorage.getById(mail.documentId)
      if (!doc) {
        throw new Error("Document not found")
      }

      const blob = new Blob([doc.fileData], { type: doc.fileType || "application/octet-stream" })
      const fileName = doc.fileName || mail.subject.replace(/\s+/g, "-") || "document"

      console.log("[v0] Downloading mail document:", {
        fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        blobSize: blob.size,
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => URL.revokeObjectURL(url), 1000)

      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
      })
    } catch (error) {
      console.error("[v0] Download error:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewDocument = async (mailId: string) => {
    const mail = mailItems.find((m) => m.id === mailId)
    if (!mail || !mail.documentId) {
      toast({
        title: "No Document",
        description: "This mail item doesn't have an attached document",
        variant: "destructive",
      })
      return
    }

    try {
      const doc = await documentStorage.getById(mail.documentId)
      if (!doc) {
        throw new Error("Document not found")
      }

      const blob = new Blob([doc.fileData], { type: doc.fileType || "application/octet-stream" })

      console.log("[v0] Viewing mail document:", {
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        blobSize: blob.size,
      })

      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")

      setTimeout(() => URL.revokeObjectURL(url), 5000)
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
  const unreadMail = mailItems.filter((item) => item.status === "unread").length
  const readMail = mailItems.filter((item) => item.status === "read").length

  const getIcon = (type: string) => {
    switch (type) {
      case "legal":
        return FileText
      case "tax":
        return Building2
      case "letter":
        return Mail
      default:
        return User
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
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

        <div className="grid md:grid-cols-3 gap-6">
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

          <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{unreadMail}</div>
                <div className="text-sm text-slate-600">Unread</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{readMail}</div>
                <div className="text-sm text-slate-600">Read</div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mail</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
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
                          {item.sender} • {new Date(item.receivedAt).toLocaleDateString()} • {item.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.status === "unread" ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">Unread</Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Read</Badge>
                      )}
                      {item.documentId && mailDocuments[item.documentId] && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {mailDocuments[item.documentId].fileName || "Document"}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {item.documentId && (
                          <>
                            <Button
                              variant="ghost"
                              className="h-10 w-10 p-0"
                              onClick={() => handleViewDocument(item.id)}
                              title="View document"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-10 w-10 p-0"
                              onClick={() => handleDownloadDocument(item.id)}
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          className="h-10 w-10 p-0"
                          onClick={() => handleMarkAsRead(item.id)}
                          disabled={item.status === "read"}
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
