"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Mail, Phone, Eye, Trash2, MoreVertical, Building2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { US_STATES, STATE_FEES } from "@/lib/constants"
import { useAuthGuard } from "@/lib/use-auth-guard"
import {
  userStorage,
  companyStorage,
  orderStorage,
  invoiceStorage,
  mailStorage,
  documentStorage,
} from "@/lib/local-storage"

export default function CustomersPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const [mounted, setMounted] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [editCompanyOpen, setEditCompanyOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [editCompanyState, setEditCompanyState] = useState("")
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated) {
      loadCustomers()
    }
  }, [mounted, isLoading, isAuthenticated])

  const loadCustomers = () => {
    if (typeof window === "undefined") return

    const allUsers = userStorage.getAll()
    const customersWithDetails = allUsers.map((user) => {
      const userCompanies = companyStorage.getByUserId(user.id)
      const userOrders = orderStorage.getByUserId(user.id)
      const totalSpent = userOrders.reduce((sum, order) => sum + order.amount, 0)

      return {
        ...user,
        company: userCompanies[0]?.name || "N/A",
        companyType: userCompanies[0]?.type || "LLC",
        state: userCompanies[0]?.state || "N/A",
        companies: userCompanies,
        orders: userOrders.length,
        totalSpent: `$${totalSpent}`,
        status: user.accountStatus || "active",
        joinDate: new Date(user.createdAt).toLocaleDateString(),
      }
    })
    setCustomers(customersWithDetails)
    setFilteredCustomers(customersWithDetails)
  }

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.company.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchQuery, customers])

  const handleEditCompany = (customer: any, company?: any) => {
    setSelectedCustomer(customer)
    if (customer.companies && customer.companies.length > 0) {
      const companyToEdit = company || customer.companies[0]
      setSelectedCompany(companyToEdit)
      setSelectedCompanyId(companyToEdit.id)
      setEditCompanyState(companyToEdit.state || "")
    }
    setEditCompanyOpen(true)
  }

  const calculateStateFeeImpact = () => {
    if (typeof window === "undefined") return null

    if (!selectedCompany || !editCompanyState || editCompanyState === selectedCompany.state) {
      return null
    }

    const oldStateFee = STATE_FEES[selectedCompany.state] || 0
    const newStateFee = STATE_FEES[editCompanyState] || 0
    const feeDifference = newStateFee - oldStateFee
    const companyOrders = orderStorage.getAll().filter((order: any) => order.companyId === selectedCompany.id)
    const totalImpact = feeDifference * companyOrders.length

    return {
      oldStateFee,
      newStateFee,
      feeDifference,
      affectedOrders: companyOrders.length,
      totalImpact,
    }
  }

  const handleSaveCompany = () => {
    if (typeof window === "undefined") return

    try {
      const einInput = (document.getElementById("ein") as HTMLInputElement)?.value
      const itinInput = (document.getElementById("itin") as HTMLInputElement)?.value
      const businessIdInput = (document.getElementById("businessId") as HTMLInputElement)?.value
      const companyNameInput = (document.getElementById("companyName") as HTMLInputElement)?.value

      if (!selectedCompany) {
        console.error("[v0] No company selected")
        alert("Error: No company selected")
        return
      }

      if (editCompanyState && !STATE_FEES[editCompanyState]) {
        console.error("[v0] Invalid state selected:", editCompanyState)
        alert(`Error: Invalid state selected: ${editCompanyState}`)
        return
      }

      const updatedCompany = {
        ...selectedCompany,
        name: companyNameInput || selectedCompany.name,
        ein: einInput || selectedCompany.ein,
        itin: itinInput || selectedCompany.itin,
        businessId: businessIdInput || selectedCompany.businessId,
        state: editCompanyState || selectedCompany.state,
        updatedAt: new Date().toISOString(),
      }

      companyStorage.update(selectedCompany.id, updatedCompany)

      if (editCompanyState && editCompanyState !== selectedCompany.state) {
        const newStateFee = STATE_FEES[editCompanyState] || 0
        const companyOrders = orderStorage.getAll().filter((order: any) => order.companyId === selectedCompany.id)

        let updatedOrderCount = 0
        companyOrders.forEach((order: any) => {
          const packagePrice = order.packagePrice || 150
          const addonsTotal = order.addonsTotal || 0
          const newTotal = packagePrice + newStateFee + addonsTotal

          orderStorage.update(order.id, {
            state: editCompanyState,
            amount: newTotal,
            total: newTotal,
            stateFilingFee: newStateFee,
            packagePrice: packagePrice,
            updatedAt: new Date().toISOString(),
          })

          updatedOrderCount++
        })

        alert(
          `Successfully updated company state to ${editCompanyState}\n\n` +
            `New State Fee: $${newStateFee}\n` +
            `Orders Updated: ${updatedOrderCount}\n` +
            `All order totals have been recalculated with the new state fee.`,
        )
      } else {
        alert("Company information updated successfully")
      }

      setEditCompanyOpen(false)
      loadCustomers()
    } catch (error) {
      console.error("[v0] Error saving company:", error)
      alert("Error updating company information. Please try again.")
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (typeof window === "undefined") return

    if (
      confirm(
        "Are you sure you want to delete this customer? This will permanently delete their account, all companies, orders, invoices, and documents.",
      )
    ) {
      try {
        const userCompanies = companyStorage.getByUserId(customerId)
        userCompanies.forEach((company) => {
          companyStorage.delete(company.id)
        })

        const userOrders = orderStorage.getByUserId(customerId)
        userOrders.forEach((order) => {
          orderStorage.delete(order.id)
        })

        const invoices = invoiceStorage.getAll().filter((inv: any) => inv.userId === customerId)
        invoices.forEach((invoice: any) => {
          invoiceStorage.delete(invoice.id)
        })

        await documentStorage.deleteByUserId(customerId)

        const mailItems = mailStorage.getAll().filter((mail: any) => mail.userId === customerId)
        mailItems.forEach((mail: any) => {
          mailStorage.delete(mail.id)
        })

        userStorage.delete(customerId)

        loadCustomers()
        alert("Customer and all related data deleted successfully")
      } catch (error) {
        console.error("[v0] Error deleting customer:", error)
        alert("Error deleting customer. Some data may not have been deleted. Please try again.")
      }
    }
  }

  const feeImpact = calculateStateFeeImpact()

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Customers</h1>
        <p className="text-slate-600 mt-1">Manage your customer base and view their activity</p>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customers by name, email, or company..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{customers.length}</div>
            <p className="text-xs text-slate-500 mt-1">Registered users</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg hover:border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {customers.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {customers.length > 0
                ? Math.round((customers.filter((c) => c.status === "active").length / customers.length) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg hover:border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{customers.reduce((sum, c) => sum + c.orders, 0)}</div>
            <p className="text-xs text-slate-500 mt-1">Across all customers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            All Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No customers found</p>
              <p className="text-sm text-slate-500 mt-2">Customers will appear here once they complete registration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-primary/20 hover:shadow-md transition-all duration-200 gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white font-semibold">
                        {customer.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {customer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{customer.company}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{customer.totalSpent}</p>
                      <p className="text-xs text-slate-500">{customer.orders} orders</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/customers/${customer.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        {customer.companies && customer.companies.length > 0 && (
                          <DropdownMenuItem onClick={() => handleEditCompany(customer, customer.companies[0])}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Edit Company Info
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Company Information</DialogTitle>
            <DialogDescription>Update company tax IDs and registration details</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedCustomer?.companies && selectedCustomer.companies.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="companySelect">Select Company</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(value) => {
                    const company = selectedCustomer.companies.find((c: any) => c.id === value)
                    if (company) {
                      setSelectedCompany(company)
                      setSelectedCompanyId(value)
                      setEditCompanyState(company.state || "")
                    }
                  }}
                >
                  <SelectTrigger id="companySelect" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCustomer.companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.state})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCompany && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Editing: {selectedCompany.name}</p>
                <p className="text-xs text-slate-600 mt-1">Company ID: {selectedCompany.id}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    defaultValue={selectedCompany?.name}
                    className="h-10"
                    key={selectedCompany?.id}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={editCompanyState} onValueChange={setEditCompanyState}>
                    <SelectTrigger id="state" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {feeImpact && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <div className="font-semibold mb-2">State Change Impact Preview</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Current State Fee ({selectedCompany.state}):</span>
                      <span className="font-mono">${feeImpact.oldStateFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New State Fee ({editCompanyState}):</span>
                      <span className="font-mono">${feeImpact.newStateFee}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-blue-200">
                      <span>Fee Difference per Order:</span>
                      <span className={`font-mono ${feeImpact.feeDifference >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {feeImpact.feeDifference >= 0 ? "+" : ""}${feeImpact.feeDifference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orders to Update:</span>
                      <span className="font-mono">{feeImpact.affectedOrders}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-blue-200">
                      <span>Total Revenue Impact:</span>
                      <span className={`font-mono ${feeImpact.totalImpact >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {feeImpact.totalImpact >= 0 ? "+" : ""}${feeImpact.totalImpact}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-blue-800">
                    Note: Only the state filing fee will be adjusted. Package prices remain unchanged.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Tax & Registration IDs</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
                  <Input
                    id="ein"
                    defaultValue={selectedCompany?.ein}
                    placeholder="12-3456789"
                    className="h-10 font-mono"
                  />
                  <p className="text-xs text-slate-500">Format: XX-XXXXXXX</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itin">ITIN (Individual Taxpayer Identification Number)</Label>
                  <Input
                    id="itin"
                    defaultValue={selectedCompany?.itin}
                    placeholder="9XX-XX-XXXX"
                    className="h-10 font-mono"
                  />
                  <p className="text-xs text-slate-500">Format: 9XX-XX-XXXX (Optional)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessId">Business ID / Registration Number</Label>
                  <Input
                    id="businessId"
                    defaultValue={selectedCompany?.businessId}
                    placeholder="Enter state registration number"
                    className="h-10 font-mono"
                  />
                  <p className="text-xs text-slate-500">State-issued business registration number</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditCompanyOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button onClick={handleSaveCompany} className="h-10 bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
