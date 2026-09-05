"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, DollarSign, CheckCircle2, XCircle, Clock, Upload } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"

// Optional: if you have exported types, import them. Otherwise fall back to local interfaces.
import type {
  Invoice as StorageInvoice,
  Company as StorageCompany,
  Service as StorageService,
  User as StorageUser,
} from "@/lib/local-storage"

interface InvoiceLineItem {
  id: string
  type: "service" | "state_fee" | "custom"
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice extends StorageInvoice {
  paymentMethod?: "whatsapp" | "bank_transfer" | string
  invoiceFile?: string
  invoiceTitle?: string
}
type Company = StorageCompany
type Service = StorageService
type User = StorageUser

const STATE_FEES: Record<string, number> = {
  Alabama: 200,
  Alaska: 250,
  Arizona: 50,
  Arkansas: 45,
  California: 70,
  Colorado: 50,
  Connecticut: 120,
  Delaware: 90,
  Florida: 125,
  Georgia: 100,
  Hawaii: 50,
  Idaho: 100,
  Illinois: 150,
  Indiana: 95,
  Iowa: 50,
  Kansas: 165,
  Kentucky: 40,
  Louisiana: 100,
  Maine: 175,
  Maryland: 100,
  Massachusetts: 500,
  Michigan: 50,
  Minnesota: 135,
  Mississippi: 50,
  Missouri: 50,
  Montana: 35,
  Nebraska: 100,
  Nevada: 425,
  "New Hampshire": 100,
  "New Jersey": 125,
  "New Mexico": 50,
  "New York": 200,
  "North Carolina": 125,
  "North Dakota": 135,
  Ohio: 99,
  Oklahoma: 100,
  Oregon: 100,
  Pennsylvania: 125,
  "Rhode Island": 150,
  "South Carolina": 110,
  "South Dakota": 150,
  Tennessee: 300,
  Texas: 300,
  Utah: 70,
  Vermont: 125,
  Virginia: 100,
  Washington: 200,
  "West Virginia": 100,
  Wisconsin: 130,
  Wyoming: 100,
}

export default function InvoicesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "whatsapp" | "bank_transfer">("all")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const [selectedCompany, setSelectedCompany] = useState("")
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
  const [invoiceNotes, setInvoiceNotes] = useState("")
  const [invoiceDueDate, setInvoiceDueDate] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [invoiceTitle, setInvoiceTitle] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [uploadProgress, setUploadProgress] = useState(false)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Dynamically import storages to avoid SSR/prerender issues (window/localStorage at module scope)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import("@/lib/local-storage")
      // Read once and cache in memory
      const inv = mod.invoiceStorage.getAll() as Invoice[]
      const comps = mod.companyStorage.getAll() as Company[]
      const srvs = mod.serviceStorage.getActive() as Service[]
      const usrs = mod.userStorage.getAll() as User[]
      if (mounted) {
        setInvoices(inv)
        setCompanies(comps)
        setServices(srvs)
        setUsers(usrs)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleAddService = () => {
    if (!selectedService) return
    const service = services.find((s) => s.id === selectedService)
    if (!service) return
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type: "service",
      description: service.name,
      quantity: 1,
      unitPrice: service.price,
      total: service.price,
    }
    setLineItems((prev) => [...prev, newItem])
    setSelectedService("")
  }

  const handleAddStateFee = () => {
    if (!selectedCompany) {
      alert("Please select a company first")
      return
    }
    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) return
    const stateFee = STATE_FEES[company.state] ?? 100
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type: "state_fee",
      description: `${company.state} State Filing Fee`,
      quantity: 1,
      unitPrice: stateFee,
      total: stateFee,
    }
    setLineItems((prev) => [...prev, newItem])
  }

  const handleAddCustomItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type: "custom",
      description: "Custom Item",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setLineItems((prev) => [...prev, newItem])
  }

  const handleUpdateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "quantity" || field === "unitPrice") {
          const qty = Number.isFinite(updated.quantity) ? Math.max(1, Number(updated.quantity)) : 1
          const price = Number.isFinite(updated.unitPrice) ? Math.max(0, Number(updated.unitPrice)) : 0
          updated.quantity = qty
          updated.unitPrice = price
          updated.total = qty * price
        }
        return updated
      }),
    )
  }

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id))
  }

  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + item.total, 0)
  const calculateTotal = () => calculateSubtotal() // add taxes/discounts here if needed

  const handleCreateInvoice = async () => {
    if (!selectedCompany || lineItems.length === 0 || !invoiceDueDate) {
      alert("Please select a company, add at least one item, and set a due date")
      return
    }
    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) return

    const total = calculateTotal()

    // Dynamically import and write to storage to keep SSR-safe
    const mod = await import("@/lib/local-storage")
    const newInvoice = mod.invoiceStorage.create({
      companyId: company.id,
      userId: company.userId,
      invoiceNumber: `INV-${Date.now()}`,
      amount: total,
      status: "pending",
      dueDate: invoiceDueDate,
      items: lineItems.map((item) => ({
        description: item.description,
        amount: item.total,
      })),
      // Optional: set a paymentMethod if you track one
      // paymentMethod: "stripe",
      notes: invoiceNotes || undefined,
    }) as Invoice

    setInvoices((prev) => [...prev, newInvoice])

    // Reset form
    setSelectedCompany("")
    setLineItems([])
    setInvoiceNotes("")
    setInvoiceDueDate("")
    setCreateModalOpen(false)
  }

  const handleUploadInvoice = async () => {
    const fileInput = document.getElementById("invoiceFile") as HTMLInputElement

    if (!selectedCompany || !invoiceTitle || !invoiceAmount || !invoiceDueDate || !fileInput?.files?.[0]) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select an invoice file",
        variant: "destructive",
      })
      return
    }

    const company = companies.find((c) => c.id === selectedCompany)
    if (!company) return

    setUploadProgress(true)

    try {
      const file = fileInput.files[0]
      const fileData = await file.arrayBuffer()
      const base64File = btoa(String.fromCharCode(...new Uint8Array(fileData)))

      const mod = await import("@/lib/local-storage")
      const newInvoice = mod.invoiceStorage.create({
        companyId: company.id,
        userId: company.userId,
        invoiceNumber: `INV-${Date.now()}`,
        amount: Number.parseFloat(invoiceAmount),
        status: "pending",
        dueDate: invoiceDueDate,
        items: [
          {
            description: invoiceTitle,
            amount: Number.parseFloat(invoiceAmount),
          },
        ],
        invoiceFile: base64File,
        invoiceTitle: invoiceTitle,
      }) as Invoice

      setInvoices((prev) => [...prev, newInvoice])

      toast({
        title: "Invoice Uploaded",
        description: `Invoice uploaded successfully for ${company.name}`,
      })

      // Reset form
      setSelectedCompany("")
      setInvoiceTitle("")
      setInvoiceAmount("")
      setInvoiceDueDate("")
      fileInput.value = ""
      setUploadModalOpen(false)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadProgress(false)
    }
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidRevenue = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0)
  const pendingRevenue = invoices.filter((inv) => inv.status === "pending").reduce((sum, inv) => sum + inv.amount, 0)
  const overdueRevenue = invoices.filter((inv) => inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-brand/10 text-brand border-brand/20"
      case "pending":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      case "overdue":
        return "bg-red-500/10 text-red-700 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "overdue":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const findCompanyById = (id: string) => companies.find((c) => c.id === id)
  const findUserById = (id: string) => users.find((u) => u.id === id)

  const filteredInvoices = invoices.filter((invoice) => {
    const company = findCompanyById(invoice.companyId)
    const user = findUserById(invoice.userId)

    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user?.name || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesPayment = paymentFilter === "all" || (invoice.paymentMethod || "") === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices & Payments</h1>
          <p className="text-muted-foreground mt-1">Manage transactions and verify payments</p>
        </div>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Upload Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Invoice</DialogTitle>
              <DialogDescription>Upload an invoice file with title and amount</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="company">Select Company *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger id="company" className="h-10">
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => {
                      const user = findUserById(company.userId)
                      return (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} - {company.state} ({user?.name || "Unknown"})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Title */}
              <div className="space-y-2">
                <Label htmlFor="invoiceTitle">Invoice Title *</Label>
                <Input
                  id="invoiceTitle"
                  placeholder="e.g., Formation Services, Annual Report"
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Invoice Amount */}
              <div className="space-y-2">
                <Label htmlFor="invoiceAmount">Amount *</Label>
                <Input
                  id="invoiceAmount"
                  type="number"
                  placeholder="0.00"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="h-10"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="invoiceFile">Invoice File *</Label>
                <Input id="invoiceFile" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="h-10" />
                <p className="text-xs text-muted-foreground">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploadProgress}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadInvoice}
                className="bg-primary hover:bg-primary/90"
                disabled={uploadProgress || !selectedCompany || !invoiceTitle || !invoiceAmount || !invoiceDueDate}
              >
                {uploadProgress ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Invoice
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold mt-1">${paidRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1">${pendingRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold mt-1">${overdueRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by invoice ID, customer, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-full md:w-[150px] bg-background/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as typeof paymentFilter)}>
              <SelectTrigger className="w-full md:w-[150px] bg-background/50">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Invoice ID</th>
                <th className="text-left p-4 font-medium text-sm">Customer</th>
                <th className="text-left p-4 font-medium text-sm">Company</th>
                <th className="text-left p-4 font-medium text-sm">Amount</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Due Date</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const company = findCompanyById(invoice.companyId)
                  const user = findUserById(invoice.userId)
                  return (
                    <tr key={invoice.id} className="border-b border-white/5 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{user?.name || "Unknown"}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{company?.name || "Unknown"}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">${invoice.amount}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getStatusColor(invoice.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                          >
                            View
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
    </div>
  )
}
