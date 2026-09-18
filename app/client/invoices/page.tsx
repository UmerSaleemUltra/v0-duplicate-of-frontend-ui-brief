"use client"

import { ClientShell } from "@/components/client/client-shell"
import {
  Receipt,
  Download,
  MessageCircle,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelectedCompany } from "@/lib/company-context"
import { invoiceStorage, currentUserStorage } from "@/lib/local-storage"
import type { Invoice } from "@/lib/local-storage"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { Spinner } from "@/components/ui/spinner"

export default function InvoicesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard()
  const router = useRouter()
  const { selectedCompanyId } = useSelectedCompany()
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp">("whatsapp")
  const [whatsappReference, setWhatsappReference] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success border-success/20"
      case "pending":
        return "bg-warning/10 text-warning border-warning/20"
      case "overdue":
        return "bg-error/10 text-error border-error/20"
      default:
        return "bg-gray-100 text-gray-600"
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

  const handlePayInvoice = (invoiceId: string) => {
    setSelectedInvoice(invoiceId)
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async () => {
    if (selectedInvoice) {
      console.log("[v0] WhatsApp payment verification would be submitted here")
      invoiceStorage.update(selectedInvoice, { status: "pending" })

      const currentUser = currentUserStorage.get()
      if (currentUser && selectedCompanyId) {
        const allUserInvoices = invoiceStorage.getByUserId(currentUser.id)
        const companyInvoices = allUserInvoices.filter((inv) => inv.companyId === selectedCompanyId)
        setInvoices(companyInvoices)
      }
    }
    setShowPaymentModal(false)
    setSelectedInvoice(null)
    setWhatsappReference("")
  }

  useEffect(() => {
    const currentUser = currentUserStorage.get()
    if (currentUser && selectedCompanyId) {
      const allUserInvoices = invoiceStorage.getByUserId(currentUser.id)
      const companyInvoices = allUserInvoices.filter((inv) => inv.companyId === selectedCompanyId)
      setInvoices(companyInvoices)
    }
  }, [selectedCompanyId])

  const unpaidInvoices = invoices.filter((inv) => inv.status === "pending" || inv.status === "overdue")
  const paidInvoices = invoices.filter((inv) => inv.status === "paid")
  const upcomingInvoices: Invoice[] = []

  if (authLoading) {
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
        <div className="bg-white rounded-xl p-8 border border-slate-200 transition-shadow duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Invoices</h1>
              <p className="text-slate-600 text-sm sm:text-base">Manage and view all your invoices</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 border border-slate-200 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-slate-600 font-medium">Unpaid</div>
                <div className="text-2xl font-semibold text-primary">
                  ${unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0)}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600">{unpaidInvoices.length} invoice(s) pending</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-slate-600 font-medium">Upcoming</div>
                <div className="text-2xl font-semibold text-slate-900">
                  ${upcomingInvoices.reduce((sum, inv) => sum + inv.amount, 0)}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600">{upcomingInvoices.length} invoice(s) scheduled</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-slate-600 font-medium">Paid</div>
                <div className="text-2xl font-semibold text-slate-900">
                  ${paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600">{paidInvoices.length} invoice(s) completed</p>
          </div>
        </div>

        {unpaidInvoices.length > 0 && (
          <div className="bg-white rounded-xl p-8 border border-slate-200 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              Action Required
            </h2>
            <div className="space-y-4">
              {unpaidInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-primary/50 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg text-slate-900">{invoice.invoiceNumber}</span>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-1">{invoice.items[0]?.description || "Invoice"}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>Issued: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                        <span className="text-primary font-medium">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-primary">${invoice.amount}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-10 gap-2 bg-transparent"
                          onClick={() => router.push(`/client/invoices/${invoice.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button variant="outline" className="h-10 gap-2 bg-transparent">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          className="h-10 gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#880000]/90 hover:to-[#ff0d13]/90 text-white"
                          onClick={() => handlePayInvoice(invoice.id)}
                        >
                          <DollarSign className="w-4 h-4" />
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paidInvoices.length > 0 && (
          <div className="bg-white rounded-xl p-8 border border-slate-200 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-slate-900" />
              Payment History
            </h2>
            <div className="space-y-4">
              {paidInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg text-slate-900">{invoice.invoiceNumber}</span>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-1">{invoice.items[0]?.description || "Invoice"}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>Issued: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium">Paid: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-slate-900">${invoice.amount}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-10 gap-2 bg-transparent"
                          onClick={() => router.push(`/client/invoices/${invoice.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button variant="outline" className="h-10 gap-2 bg-transparent">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {invoices.length === 0 && (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No invoices yet</h3>
            <p className="text-slate-600">Your invoices will appear here once they're created</p>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl p-8 max-w-md w-full border border-slate-200 shadow-2xl transition-transform duration-300">
              <h3 className="text-xl font-semibold mb-4">Pay Invoice</h3>
              <p className="text-slate-600 mb-6">
                Invoice: <span className="font-semibold">{selectedInvoice}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
                  <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-4 border border-primary/50">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="font-medium">Pay with WhatsApp</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-ref" className="text-sm font-medium">
                    Transaction Reference / Group Code
                  </Label>
                  <Input
                    id="whatsapp-ref"
                    placeholder="Enter your transaction ID or group code"
                    value={whatsappReference}
                    onChange={(e) => setWhatsappReference(e.target.value)}
                    className="h-10 bg-white border-slate-200"
                  />
                  <p className="text-xs text-slate-600">
                    Please enter the reference number from your WhatsApp payment confirmation
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-transparent"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#880000]/90 hover:to-[#ff0d13]/90 text-white"
                    onClick={handlePaymentSubmit}
                  >
                    Confirm Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientShell>
  )
}
