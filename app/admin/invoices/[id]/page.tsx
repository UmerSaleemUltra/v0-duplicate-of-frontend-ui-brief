"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { invoiceStorage, companyStorage, userStorage, type Invoice, type Company, type User } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoiceData()
  }, [resolvedParams.id])

  const loadInvoiceData = () => {
    const inv = invoiceStorage.getById(resolvedParams.id)
    if (!inv) {
      toast({
        title: "Invoice Not Found",
        description: "The requested invoice could not be found",
        variant: "destructive",
      })
      router.push("/admin/invoices")
      return
    }

    const comp = companyStorage.getById(inv.companyId)
    const usr = userStorage.getById(inv.userId)

    setInvoice(inv)
    setCompany(comp)
    setUser(usr)
    setLoading(false)
  }

  const handleStatusChange = (newStatus: string) => {
    if (!invoice) return

    invoiceStorage.update(invoice.id, { status: newStatus as any })
    setInvoice({ ...invoice, status: newStatus as any })

    toast({
      title: "Status Updated",
      description: `Invoice status changed to ${newStatus}`,
    })
  }

  const handleDownloadPDF = () => {
    if (!invoice || !company || !user) return

    // Create invoice HTML content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .invoice-title { font-size: 32px; font-weight: bold; }
          .invoice-number { color: #666; margin-top: 8px; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: 600; }
          .status.paid { background: #dcfce7; color: #166534; }
          .status.pending { background: #fef3c7; color: #92400e; }
          .status.overdue { background: #fee2e2; color: #991b1b; }
          .info-section { display: flex; gap: 40px; margin-bottom: 40px; padding-bottom: 40px; border-bottom: 2px solid #e5e7eb; }
          .info-block h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .info-block p { margin: 4px 0; font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { text-align: left; padding: 12px; background: #f9fafb; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .totals { text-align: right; margin-top: 20px; }
          .totals .total-row { font-size: 18px; font-weight: bold; margin-top: 12px; padding-top: 12px; border-top: 2px solid #e5e7eb; }
          .footer { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${invoice.invoiceNumber}</div>
          </div>
          <div>
            <span class="status ${invoice.status}">${invoice.status.toUpperCase()}</span>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-block">
            <h3>From:</h3>
            <p><strong>BuzzFiling LLC</strong></p>
            <p>123 Business Street</p>
            <p>City, State 12345</p>
            <p>contact@buzzfiling.com</p>
          </div>
          <div class="info-block">
            <h3>Bill To:</h3>
            <p><strong>${company.name}</strong></p>
            <p>${user.name}</p>
            <p>${user.email}</p>
            ${company.address ? `<p>${company.address}</p>` : ""}
            ${company.city ? `<p>${company.city}, ${company.state} ${company.zipCode}</p>` : ""}
          </div>
          <div class="info-block">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> $${invoice.amount.toFixed(2)}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item: any) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Total: $${invoice.amount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <h3>Payment Information</h3>
          <p>Please make payment by ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p>For questions about this invoice, please contact us at billing@buzzfiling.com</p>
        </div>
      </body>
      </html>
    `

    // Create a blob and download
    const blob = new Blob([invoiceHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${invoice.invoiceNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Started",
      description: "Invoice downloaded successfully",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    toast({
      title: "Feature Not Available",
      description: "Email functionality will be available soon",
      variant: "destructive",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!invoice || !company || !user) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-brand/10 text-brand border-brand/20"
      case "pending":
        return "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20"
      case "overdue":
        return "bg-red-50 text-red-600 border-red-200"
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

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="p-8 print:shadow-none">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
            <p className="text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <Badge variant="outline" className={`${getStatusColor(invoice.status)} text-sm px-3 py-1`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(invoice.status)}
                  {invoice.status.toUpperCase()}
                </span>
              </Badge>
            </div>
            <Select value={invoice.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Company Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
          <div>
            <h3 className="font-semibold mb-2">From:</h3>
            <p className="font-bold">BuzzFiling LLC</p>
            <p className="text-sm text-muted-foreground">123 Business Street</p>
            <p className="text-sm text-muted-foreground">City, State 12345</p>
            <p className="text-sm text-muted-foreground">contact@buzzfiling.com</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p className="font-bold">{company.name}</p>
            <p className="text-sm text-muted-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {company.address && (
              <>
                <p className="text-sm text-muted-foreground">{company.address}</p>
                <p className="text-sm text-muted-foreground">
                  {company.city}, {company.state} {company.zipCode}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Date</p>
            <p className="font-semibold">{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="font-semibold text-lg">${invoice.amount.toFixed(2)}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead className="border-b-2">
              <tr>
                <th className="text-left py-3 font-semibold">Description</th>
                <th className="text-right py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{item.description}</td>
                  <td className="text-right py-3">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2">
              <tr>
                <td className="py-4 text-right font-semibold text-lg">Total:</td>
                <td className="py-4 text-right font-bold text-xl">${invoice.amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Info */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">Payment Information</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Please make payment by {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            For questions about this invoice, please contact us at billing@buzzfiling.com
          </p>
        </div>
      </Card>
    </div>
  )
}
