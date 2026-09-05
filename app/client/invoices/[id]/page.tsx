"use client"

import { use, useState, useEffect } from "react"
import { ClientShell } from "@/components/client/client-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Receipt, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { invoiceStorage, currentUserStorage, companyStorage } from "@/lib/local-storage"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    const currentUser = currentUserStorage.get()
    if (currentUser) {
      const invoiceData = invoiceStorage.getById(resolvedParams.id)
      if (invoiceData && invoiceData.userId === currentUser.id) {
        setInvoice(invoiceData)
        if (invoiceData.companyId) {
          const companyData = companyStorage.getById(invoiceData.companyId)
          setCompany(companyData)
        }
      }
    }
  }, [resolvedParams.id])

  if (!invoice) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Invoice Not Found</h2>
            <p className="text-slate-600 mb-4">The invoice you're looking for doesn't exist.</p>
            <Button
              onClick={() => router.push("/client/invoices")}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </ClientShell>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "overdue":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + item.amount, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleDownloadPDF = async () => {
    if (!invoice || !company) return

    const doc = new jsPDF()
    const element = document.getElementById("invoice-content")
    if (element) {
      const canvas = await html2canvas(element)
      const imgData = canvas.toDataURL("image/png")
      doc.addImage(imgData, "PNG", 0, 0)
      doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
    }
  }

  return (
    <ClientShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/client/invoices")}
              className="h-10 w-10 p-0 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Invoice Details</h1>
              <p className="text-slate-600 text-sm sm:text-base">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 gap-2 bg-transparent" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            {invoice.status !== "paid" && (
              <Button className="h-10 gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90">
                <DollarSign className="w-4 h-4" />
                Pay Now
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2" id="invoice-content">
            <Card className="bg-white border-slate-200">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{invoice.invoiceNumber}</h2>
                      <p className="text-sm text-slate-600">Business Formation Services</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(invoice.status)}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-1 capitalize">{invoice.status}</span>
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Invoice Date</p>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Due Date</p>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Amount Due</p>
                    <p className="text-lg font-semibold text-slate-900">${invoice.amount}</p>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                {/* Bill To */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Bill To</h3>
                  {company ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">{company.name}</p>
                      {company.address && <p className="text-sm text-slate-600">{company.address}</p>}
                      <p className="text-sm text-slate-600">{company.state}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Company information not available</p>
                  )}
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Invoice Items</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Description</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700">Quantity</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700">Price</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item: any, index: number) => (
                          <tr key={index} className="border-t border-slate-200">
                            <td className="py-3 px-4 text-sm text-slate-900">{item.description}</td>
                            <td className="py-3 px-4 text-sm text-slate-900 text-right">{item.quantity || 1}</td>
                            <td className="py-3 px-4 text-sm text-slate-900 text-right">${item.amount}</td>
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">
                              ${item.amount * (item.quantity || 1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Tax (10%)</span>
                        <span className="font-medium text-slate-900">${tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-slate-900">Total</span>
                        <span className="text-xl font-semibold text-slate-900">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {invoice.status === "paid" && (
                  <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900">Payment Received</p>
                        <p className="text-xs text-emerald-700 mt-1">
                          This invoice was paid on {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Current Status</p>
                  <Badge className={`${getStatusColor(invoice.status)} text-sm`}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-1 capitalize">{invoice.status}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Amount Due</p>
                  <p className="text-2xl font-semibold text-slate-900">${invoice.amount}</p>
                </div>
                {invoice.status !== "paid" && (
                  <Button className="w-full h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
