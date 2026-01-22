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
import { Search, MoreVertical, Upload, X, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mailToEdit, setMailToEdit] = useState<MailItem | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editFrom, setEditFrom] = useState("")
  const [editType, setEditType] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

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

      let uploadedFileUrl = null

      if (editFile) {
        const formData = new FormData()
        formData.append("file", editFile)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const uploadData = await uploadResponse.json()
        if (!uploadData.url) throw new Error("File upload failed")
        uploadedFileUrl = uploadData.url
      }

      if (uploadedFileUrl) {
        const response = await ApiClient.mail.update(
          mailToEdit.id,
          {
            subject: editSubject,
            from: editFrom,
            type: editType,
            notes: editNotes,
            attachments: [
              {
                name: editFile!.name,
                fileUrl: uploadedFileUrl,
                size: editFile!.size,
              },
            ],
            hasAttachment: true,
          },
          token,
        )

        const updatedMail = response.data

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
      } else {
        const response = await ApiClient.mail.update(
          mailToEdit.id,
          {
            subject: editSubject,
            from: editFrom,
            type: editType,
            notes: editNotes,
          },
          token,
        )

        const updatedMail = response.data

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
      }

      setEditDialogOpen(false)
      setMailToEdit(null)

      toast({
        title: "Mail Updated",
        description: editFile ? "Mail and document have been updated" : "Mail details have been updated",
      })

      console.log("[v0] Mail item updated successfully")
    } catch (error) {
      console.error("[v0] Error updating mail:", error)
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
      company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mailroom...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Mailroom</h1>
          <p className="mt-2 text-sm text-slate-600">Manage incoming mail and documents for all companies</p>
        </div>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Upload className="mr-2 h-4 w-4" />
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
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger id="company" className="h-10">
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <option value="BuzzFiling" />
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

      <Card className="bg-white border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by company, recipient, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full lg:w-[200px] h-10 bg-white border-slate-200">
              <SelectValue placeholder="Mail Type" />
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

        {selectedItems.length > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm text-slate-600">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
            </span>
          </div>
        )}
      </Card>

      <Card className="bg-white border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-slate-900 font-semibold">Company</TableHead>
                <TableHead className="text-slate-900 font-semibold">From</TableHead>
                <TableHead className="text-slate-900 font-semibold">Subject</TableHead>
                <TableHead className="text-slate-900 font-semibold">Type</TableHead>
                <TableHead className="text-slate-900 font-semibold">Notes</TableHead>
                <TableHead className="text-slate-900 font-semibold">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No mail items found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const company = companies.find((c) => c.id === item.companyId)
                  return (
                    <TableRow
                      key={item.id}
                      className="border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => {
                            if (selectedItems.includes(item.id)) {
                              setSelectedItems(selectedItems.filter((id) => id !== item.id))
                            } else {
                              setSelectedItems([...selectedItems, item.id])
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{company?.name || "Unknown"}</TableCell>
                      <TableCell className="text-slate-600">{item.from || item.sender}</TableCell>
                      <TableCell className="text-slate-900">{item.subject}</TableCell>
                      <TableCell className="text-slate-600 text-sm capitalize">{item.type}</TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {item.notes ? (
                          <span className="line-clamp-2" title={item.notes}>
                            {item.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No notes</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(item.receivedDate || item.receivedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadDocument(item.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditMail(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteMail(item.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} mail items
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

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
