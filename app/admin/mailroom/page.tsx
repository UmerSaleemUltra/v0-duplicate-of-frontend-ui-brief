"use client"

import type React from "react"
import { Download } from "lucide-react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Search, Eye, CheckCircle2, Filter, MoreVertical, Upload, X, Trash2 } from "lucide-react"
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
import { mailStorage, companyStorage, userStorage, type MailItem } from "@/lib/local-storage"
import { documentStorage } from "@/lib/document-storage"
import { useToast } from "@/hooks/use-toast"

export default function AdminMailroomPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [mailFrom, setMailFrom] = useState("")
  const [mailSubject, setMailSubject] = useState("")
  const [mailType, setMailType] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mailToDelete, setMailToDelete] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [mailItems, setMailItems] = useState<MailItem[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  const { toast } = useToast()

  useEffect(() => {
    setMailItems(mailStorage.getAll())
    setCompanies(companyStorage.getAll())
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const allDocs = await documentStorage.getAllDocuments()
      setDocuments(allDocs)
    } catch (error) {
      console.error("[v0] Error loading documents:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedCompany || !mailFrom || !mailSubject || !mailType || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select a file",
        variant: "destructive",
      })
      return
    }

    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) return

    setIsUploading(true)

    try {
      const documentId = await documentStorage.store(selectedFile, {
        companyId: company.id,
        userId: company.userId,
        title: mailSubject,
        description: `Mail from ${mailFrom}`,
        uploadedBy: "admin",
        uploadedAt: new Date().toISOString(),
        isMailDocument: true, // Mark this as a mail document
      })

      const newMail = mailStorage.create({
        companyId: company.id,
        userId: company.userId,
        subject: mailSubject,
        sender: mailFrom,
        type: mailType as any,
        status: "unread",
        uploadedBy: "admin",
        documentId,
      })

      setMailItems([...mailItems, newMail])
      setSelectedCompany("")
      setMailFrom("")
      setMailSubject("")
      setMailType("")
      setSelectedFile(null)
      setUploadModalOpen(false)

      toast({
        title: "Mail Uploaded Successfully",
        description: "Mail item and document have been added to the company's mailroom",
      })
    } catch (error) {
      console.error("[v0] Error uploading mail:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload mail document. Please try again.",
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
      const mail = mailItems.find((m) => m.id === mailToDelete)

      if (mail?.documentId) {
        await documentStorage.delete(mail.documentId)
      }

      mailStorage.delete(mailToDelete)
      setMailItems(mailItems.filter((item) => item.id !== mailToDelete))

      toast({
        title: "Mail Deleted",
        description: "Mail item and associated document have been permanently deleted",
      })
    } catch (error) {
      console.error("[v0] Error deleting mail:", error)
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

  const handleMarkAsRead = (mailId: string) => {
    try {
      const mail = mailItems.find((m) => m.id === mailId)
      if (mail) {
        const updatedMail = { ...mail, status: "read" as const }
        mailStorage.update(mailId, updatedMail)
        setMailItems(mailItems.map((m) => (m.id === mailId ? updatedMail : m)))

        toast({
          title: "Status Updated",
          description: "Mail marked as read",
        })
      }
    } catch (error) {
      console.error("[v0] Error updating mail status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update mail status",
        variant: "destructive",
      })
    }
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

      if (mail.documentId) {
        const doc = documents.find((d) => d.id === mail.documentId)
        if (!doc) {
          throw new Error("Document not found")
        }

        const blob = await documentStorage.download(mail.documentId)
        if (!blob) {
          throw new Error("Document blob not found in storage")
        }

        const typedBlob = new Blob([blob], { type: doc.fileType || "application/octet-stream" })
        const url = URL.createObjectURL(typedBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = doc.fileName || `${mail.subject.replace(/\s+/g, "-")}.${doc.fileType?.split("/")[1] || "pdf"}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => URL.revokeObjectURL(url), 100)

        toast({
          title: "Download Started",
          description: "Mail document is being downloaded",
        })
      } else {
        const company = companies.find((c) => c.id === mail.companyId)
        const content = `Mail Item Details
        
Subject: ${mail.subject}
From: ${mail.sender}
Type: ${mail.type}
Received: ${new Date(mail.receivedAt).toLocaleString()}
Status: ${mail.status}

Company: ${company?.name || "Unknown"}
Recipient: ${userStorage.getById(mail.userId)?.name || "Unknown"}
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
      console.error("[v0] Error downloading mail:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download mail document",
        variant: "destructive",
      })
    }
  }

  const filteredItems = mailItems.filter((item) => {
    const company = companies.find((c) => c.id === item.companyId)
    const user = userStorage.getById(item.userId)

    const matchesSearch =
      company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Unread</Badge>
      case "read":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Read</Badge>
      case "archived":
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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

              <div className="space-y-2">
                <Label htmlFor="from">From (Sender)</Label>
                <Input
                  id="from"
                  placeholder="e.g., Delaware Secretary of State"
                  value={mailFrom}
                  onChange={(e) => setMailFrom(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Certificate of Formation"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailType">Mail Type</Label>
                <Select value={mailType} onValueChange={setMailType}>
                  <SelectTrigger id="mailType" className="h-10">
                    <SelectValue placeholder="Select mail type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[180px] h-10 bg-white border-slate-200">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

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
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" className="h-8 bg-transparent">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Read
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-white border-slate-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-slate-900 font-semibold">Company</TableHead>
                <TableHead className="text-slate-900 font-semibold">Recipient</TableHead>
                <TableHead className="text-slate-900 font-semibold">From</TableHead>
                <TableHead className="text-slate-900 font-semibold">Subject</TableHead>
                <TableHead className="text-slate-900 font-semibold">Type</TableHead>
                <TableHead className="text-slate-900 font-semibold">Status</TableHead>
                <TableHead className="text-slate-900 font-semibold">Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center mb-4 shadow-sm">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-slate-900 font-medium">No mail items found</p>
                      <p className="text-sm text-slate-600 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const company = companies.find((c) => c.id === item.companyId)
                  const user = userStorage.getById(item.userId)
                  return (
                    <TableRow
                      key={item.id}
                      className="border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{company?.name || "Unknown"}</TableCell>
                      <TableCell className="text-slate-600">{user?.name || "Unknown"}</TableCell>
                      <TableCell className="text-slate-600">{item.sender}</TableCell>
                      <TableCell className="text-slate-900">{item.subject}</TableCell>
                      <TableCell className="text-slate-600 text-sm capitalize">{item.type}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-slate-600">{new Date(item.receivedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(item.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsRead(item.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Read
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
    </div>
  )
}
