"use client"

import type React from "react"
import { Download } from "lucide-react"
import { Edit } from "lucide-react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MoreVertical, Upload, X, Trash2, Copy, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import type { MailItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { ApiClient } from "@/lib/api-client"

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

export default function AdminMailroomPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [mailFrom, setMailFrom] = useState("")
  const [mailSubject, setMailSubject] = useState("")
  const [mailType, setMailType] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [mailNotes, setMailNotes] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mailToDelete, setMailToDelete] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [mailItems, setMailItems] = useState<MailItem[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companySearch, setCompanySearch] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mailToEdit, setMailToEdit] = useState<MailItem | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editFrom, setEditFrom] = useState("")
  const [editType, setEditType] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  const { toast } = useToast()

  useEffect(() => {
    loadData()

    const intervalId = setInterval(() => {
      loadData()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const token = authService.getToken()

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the mailroom",
          variant: "destructive",
        })
        return
      }

      const [mailRes, companiesRes] = await Promise.all([
        ApiClient.mail.getAll(token),
        ApiClient.companies.getAll(token),
      ])

      const mailData = mailRes.data || []
      const companiesData = companiesRes.data || []

      const normalizedMail = mailData.map((mail: any) => ({
        ...mail,
        id: mail.id || mail._id?.toString() || mail._id,
        sender: mail.from || mail.sender,
        receivedAt: mail.receivedDate || mail.receivedAt,
      }))
      setMailItems(normalizedMail)

      const normalizedCompanies = companiesData.map((company: any) => ({
        ...company,
        id: company.id || company._id?.toString() || company._id,
      }))
      setCompanies(normalizedCompanies)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
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
    if (!selectedCompany || !mailFrom || !mailSubject || !mailType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) {
      toast({
        title: "Error",
        description: "Selected company not found",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const token = authService.getToken()
      if (!token) throw new Error("No auth token")

      const formData = new FormData()
      formData.append("userId", company.userId)
      formData.append("companyId", company.id)
      formData.append("companyName", company.name)
      formData.append("from", mailFrom)
      formData.append("subject", mailSubject)
      formData.append("type", mailType)
      if (mailNotes) formData.append("notes", mailNotes)

      // Append all files
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await ApiClient.mail.create(formData, token)
      const newMail = response.data

      // Normalize the new mail item
      const normalizedMail = {
        ...newMail,
        id: newMail.id || newMail._id?.toString(),
        sender: newMail.from,
        receivedAt: newMail.receivedDate,
      }

      setMailItems([normalizedMail, ...mailItems])

      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: company.userId,
            type: "mail_received",
            title: "New Mail Received",
            message: `You have received new mail: "${mailSubject}" from ${mailFrom}`,
            link: "/client/mailroom",
            metadata: {
              mailId: normalizedMail.id,
              companyId: company.id,
              companyName: company.name,
              mailType: mailType,
              hasAttachment: selectedFiles.length > 0,
              attachmentCount: selectedFiles.length,
            },
          }),
        })
      } catch (notifError) {}

      // Reset form
      setSelectedCompany("")
      setMailFrom("")
      setMailSubject("")
      setMailType("")
      setSelectedFiles([])
      setMailNotes("")
      setUploadModalOpen(false)

      toast({
        title: "Mail Uploaded Successfully",
        description: "Mail item has been added to the company's mailroom",
      })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload mail. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteMail = (mailId: string) => {
    setMailToDelete(mailId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteMail = async () => {
    if (!mailToDelete) return

    try {
      const token = authService.getToken()
      if (!token) throw new Error("No auth token")

      await ApiClient.mail.delete(mailToDelete, token)

      setMailItems(mailItems.filter((item) => item.id !== mailToDelete))

      toast({
        title: "Mail Deleted",
        description: "Mail item and attachments have been permanently deleted",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete mail item",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMailToDelete(null)
    }
  }

  const handleMarkAsRead = async (mailId: string) => {
    toast({
      title: "Feature Removed",
      description: "Mail status tracking has been removed",
      variant: "destructive",
    })
  }

  const handleDownloadDocument = async (mailId: string) => {
    try {
      const mail = mailItems.find((m) => m.id === mailId)
      if (!mail) {
        toast({
          title: "Error",
          description: "Mail item not found",
          variant: "destructive",
        })
        return
      }

      if (mail.attachments && mail.attachments.length > 0) {
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
      } else {
        // Generate text file with mail details
        const company = companies.find((c) => c.id === mail.companyId)
        const content = `Mail Item Details
        
Subject: ${mail.subject}
From: ${mail.from || mail.sender}
Type: ${mail.type}
Received: ${new Date(mail.receivedDate || mail.receivedAt).toLocaleString()}
Status: ${mail.status}

Company: ${company?.name || "Unknown"}
Notes: ${mail.notes || "None"}
`

        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `mail-${mail.id}-${mail.subject.replace(/\s+/g, "-")}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: "Download Started",
          description: "Mail details are being downloaded",
        })
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download mail document",
        variant: "destructive",
      })
    }
  }

  const handleEditMail = (mail: MailItem) => {
    setMailToEdit(mail)
    setEditSubject(mail.subject)
    setEditFrom(mail.from || mail.sender || "")
    setEditType(mail.type)
    setEditNotes(mail.notes || "")
    setEditFile(null)
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!mailToEdit) return

    if (!editSubject || !editFrom || !editType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)

    try {
      const token = authService.getToken()
      if (!token) throw new Error("No auth token")

      console.log(" Updating mail item:", mailToEdit.id)
      console.log(" Has file:", !!editFile)

      let response

      if (editFile) {
        // Update with file using FormData
        console.log(" Updating with file using FormData")
        const formData = new FormData()
        formData.append("file", editFile)
        formData.append("subject", editSubject)
        formData.append("from", editFrom)
        formData.append("type", editType)
        formData.append("notes", editNotes)

        response = await fetch(`/api/mail/${mailToEdit.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
      } else {
        // Update without file using JSON
        console.log(" Updating without file using JSON")
        const updateData = {
          subject: editSubject,
          from: editFrom,
          type: editType,
          notes: editNotes,
        }

        response = await fetch(`/api/mail/${mailToEdit.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })
      }

      console.log(" Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(" Mail update failed:", response.status, errorText)
        throw new Error(`Mail update failed with status ${response.status}`)
      }

      const updatedMail = await response.json()
      console.log(" Mail updated successfully:", updatedMail)

      setMailItems(
        mailItems.map((item) =>
          item.id === mailToEdit.id
            ? {
                ...updatedMail,
                id: updatedMail.id || updatedMail._id?.toString(),
                sender: updatedMail.from || updatedMail.sender,
                receivedAt: updatedMail.receivedDate || updatedMail.receivedAt,
              }
            : item,
        ),
      )

      setEditDialogOpen(false)
      setMailToEdit(null)

      toast({
        title: "Mail Updated",
        description: editFile ? "Mail and document have been updated" : "Mail details have been updated",
      })

      console.log(" Mail item updated successfully")
    } catch (error) {
      console.error(" Error updating mail:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update mail item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const filteredItems = mailItems.filter((item) => {
    const company = companies.find((c) => c.id === item.companyId)

    const matchesSearch =
      (company?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.from || item.sender || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter])

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map((item) => item.id))
    }
  }

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

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
        </div>

        {/* Table Skeleton */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-b p-4">
            <div className="grid grid-cols-7 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border-b p-4">
              <div className="grid grid-cols-7 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-slate-200 rounded"></div>
                  <div className="h-10 w-10 bg-slate-200 rounded"></div>
                </div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mailroom</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage incoming mail and documents for all companies</p>
        </div>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Mail
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Mail to Company</DialogTitle>
              <DialogDescription>Add a mail item to a company's mailroom</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company">Select Company *</Label>
                <div className="border rounded-md">
                  <div className="flex items-center border-b px-2">
                    <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search company..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="flex-1 py-2 px-2 text-sm outline-none bg-transparent placeholder:text-slate-400"
                    />
                    {companySearch && (
                      <button onClick={() => setCompanySearch("")} className="text-slate-400 hover:text-slate-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-44 overflow-y-auto py-1">
                    {companies
                      .filter((c) => c.name?.toLowerCase().includes(companySearch.toLowerCase()))
                      .map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => { setSelectedCompany(company.id); setCompanySearch("") }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${selectedCompany === company.id ? "bg-slate-100 font-medium" : ""}`}
                        >
                          {company.name}
                        </button>
                      ))}
                    {companies.filter((c) => c.name?.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-3">No companies found</p>
                    )}
                  </div>
                  {selectedCompany && (
                    <div className="border-t px-3 py-1.5 flex items-center justify-between bg-slate-50">
                      <span className="text-xs text-slate-600 font-medium">
                        {companies.find((c) => c.id === selectedCompany)?.name}
                      </span>
                      <button onClick={() => setSelectedCompany("")} className="text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from">From (Sender) *</Label>
                <Input
                  id="from"
                  placeholder="e.g., IRS, Delaware Secretary of State, Local Government"
                  value={mailFrom}
                  onChange={(e) => setMailFrom(e.target.value)}
                  className="h-10"
                  list="senderSuggestions"
                />
                <datalist id="senderSuggestions">
                  <option value="IRS" />
                  <option value="Secretary of State" />
                  <option value="State Tax Authority" />
                  <option value="Buzz Filing" />
                  <option value="Local Government" />
                  <option value="Federal Agency" />
                </datalist>
                <p className="text-xs text-slate-500 mt-1">
                  Added context: This is WHO SENT the mail, not the mail type. Examples: IRS, Delaware Secretary of
                  State, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Certificate of Formation"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailType">Mail Type *</Label>
                <Select value={mailType} onValueChange={setMailType}>
                  <SelectTrigger id="mailType" className="h-10">
                    <SelectValue placeholder="Select mail type" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes about this mail"
                  value={mailNotes}
                  onChange={(e) => setMailNotes(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload Files (Optional)</Label>
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
              <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUploadSubmit} className="bg-primary hover:bg-primary/90" disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Mail"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by company, sender, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 bg-white border-slate-200 rounded-xl text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="letter">Letter</SelectItem>
            <SelectItem value="package">Package</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="tax">Tax</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TooltipProvider delayDuration={300}>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">Mail Items</span>
          <span className="text-xs text-slate-400">{filteredItems.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="w-10 px-6">
                  <Checkbox checked={selectedItems.length === filteredItems.length && filteredItems.length > 0} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Company</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">From</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Subject</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</TableHead>
                <TableHead className="w-12 px-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">
                    No mail items found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const company = companies.find((c) => c.id === item.companyId)
                  return (
                    <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6">
                        <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => toggleSelectItem(item.id)} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium text-slate-900">
                        <TruncatedCell text={company?.name || "—"} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-600">
                        <TruncatedCell text={item.from || item.sender || "—"} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-900">
                        <TruncatedCell text={item.subject || "—"} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-slate-500 capitalize">{item.type}</TableCell>
                      <TableCell className="px-6 py-4 text-xs text-slate-400 max-w-[160px]">
                        <TruncatedCell text={item.notes || "—"} maxLen={24} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-slate-400">
                        {new Date(item.receivedDate || item.receivedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => handleDownloadDocument(item.id)}><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditMail(item)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteMail(item.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

{totalPages > 1 && (
  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 gap-4">
    <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">{startIndex + 1}–{Math.min(endIndex, filteredItems.length)} of {filteredItems.length}</p>
    <div className="overflow-x-auto flex-1">
      <div className="flex items-center gap-1 min-w-max">
        <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-3 text-xs shrink-0">Previous</Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button key={page} variant="ghost" size="sm" onClick={() => setCurrentPage(page)}
            className={`h-8 w-8 p-0 text-xs shrink-0 ${currentPage === page ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600"}`}>
            {page}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-3 text-xs shrink-0">Next</Button>
      </div>
    </div>
  </div>
)}
      </div>
      </TooltipProvider>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mail Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mail item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMail} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Mail Item</DialogTitle>
            <DialogDescription>Update mail details or replace the document file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-from">From (Sender) *</Label>
              <Input
                id="edit-from"
                placeholder="e.g., IRS, Delaware Secretary of State, Local Government"
                value={editFrom}
                onChange={(e) => setEditFrom(e.target.value)}
                className="h-10"
                list="senderSuggestions"
              />
              <datalist id="senderSuggestions">
                <option value="IRS" />
                <option value="Secretary of State" />
                <option value="State Tax Authority" />
                <option value="BuzzFiling" />
                <option value="Local Government" />
                <option value="Federal Agency" />
              </datalist>
              <p className="text-xs text-slate-500 mt-1">
                Added context: This is WHO SENT the mail, not the mail type. Examples: IRS, Delaware Secretary of State,
                etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject/Title *</Label>
              <Input
                id="edit-subject"
                placeholder="e.g., Certificate of Formation"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Mail Type *</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger id="edit-type" className="h-10">
                  <SelectValue placeholder="Select mail type" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                placeholder="Additional notes about this mail"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-file">Replace Document (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-file"
                  type="file"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="h-10"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {editFile && (
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setEditFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {editFile ? (
                <p className="text-sm text-muted-foreground">New file: {editFile.name}</p>
              ) : (
                mailToEdit?.attachments &&
                mailToEdit.attachments.length > 0 && (
                  <p className="text-sm text-muted-foreground">Current file: {mailToEdit.attachments[0].name}</p>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} className="bg-primary hover:bg-primary/90" disabled={isEditing}>
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "Updating..." : editFile ? "Update & Replace" : "Update Mail"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
