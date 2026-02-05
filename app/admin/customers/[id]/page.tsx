"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Mail, Phone, DollarSign, Loader2, Trash2, Pencil } from "lucide-react"
import { authService } from "@/lib/auth"
import { US_STATES } from "@/lib/constants"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import ApiClient from "@/lib/api-client"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string

  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editCompanyDialogOpen, setEditCompanyDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [companyNameInput, setCompanyNameInput] = useState("")
  const [einInput, setEinInput] = useState("")
  const [itinInput, setItinInput] = useState("")
  const [businessIdInput, setBusinessIdInput] = useState("")
  const [editCompanyState, setEditCompanyState] = useState("")
  const [companyEdits, setCompanyEdits] = useState<{ [key: string]: boolean }>({})
  const [loadingCompany, setLoadingCompany] = useState<string>("")
  const [taxDetailsModalOpen, setTaxDetailsModalOpen] = useState(false)
  const [taxClassificationInput, setTaxClassificationInput] = useState("")
  const [annualReportDateInput, setAnnualReportDateInput] = useState("")
  const [taxFilingDateInput, setTaxFilingDateInput] = useState("")

  useEffect(() => {
    if (!isLoading && isAuthenticated && customerId) {
      loadCustomerData()
    }
  }, [customerId, isLoading, isAuthenticated])

  useEffect(() => {
    if (customer) {
      console.log("[v0] Customer loaded:", customer.name)
      console.log("[v0] Companies:", companies)
      companies.forEach((company, index) => {
        console.log(`[v0] Company ${index + 1}:`, {
          name: company.name,
          ein: company.ein,
          itin: company.itin,
          businessId: company.businessId,
          hasItin: !!company.itin,
        })
      })
    }
  }, [customer, companies])

  const loadCustomerData = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Loading customer data for ID:", customerId)

      const userResponse = await fetch(`/api/users/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!userResponse.ok) {
        console.error("[v0] Failed to fetch customer:", userResponse.status)
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const userResult = await userResponse.json()
      const user = userResult.data || userResult

      if (!user) {
        console.error("[v0] User not found in response")
        toast({
          title: "Error",
          description: "Customer not found",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setCustomer(user)
      console.log("[v0] Customer loaded:", user.email)

      const timestamp = Date.now()
      const compResponse = await fetch(`/api/companies?_t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      if (compResponse.ok) {
        const compResult = await compResponse.json()
        const allCompanies = Array.isArray(compResult.data)
          ? compResult.data
          : Array.isArray(compResult.companies)
            ? compResult.companies
            : []

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = c.userId?.toString ? c.userId.toString() : String(c.userId || "")
          const userId = customerId?.toString ? customerId.toString() : String(customerId || "")
          return companyUserId === userId
        })

        setCompanies(userCompanies)
        console.log("[v0] Companies loaded:", userCompanies.length)

        const userOrders = userCompanies.flatMap((company: any) => {
          const companyOrders = company.orders || []
          return companyOrders.map((order: any) => ({
            ...order,
            companyId: company.id,
            companyName: company.name,
          }))
        })

        setOrders(userOrders)
        console.log("[v0] Orders extracted from companies:", userOrders.length)
      }
    } catch (error) {
      console.error("[v0] Error loading customer:", error)
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    if (typeof window === "undefined") return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Saving company:", companyNameInput)

      setLoadingCompany(selectedCompany.id)

      const updatedCompany = {
        ...selectedCompany,
        name: companyNameInput,
        ein: einInput || selectedCompany.ein || null,
        itin: itinInput || selectedCompany.itin || null,
        businessId: businessIdInput || selectedCompany.businessId || null,
        state: editCompanyState || selectedCompany.state,
        updatedAt: new Date().toISOString(),
      }

      const previousEIN = selectedCompany.ein
      const previousITIN = selectedCompany.itin
      const previousBusinessId = selectedCompany.businessId

      const response = await ApiClient.companies.update(selectedCompany.id, updatedCompany, token)

      if (response.success) {
        if (einInput && einInput !== previousEIN) {
          await sendIdNotification(customer.id, updatedCompany.name, "EIN", "assigned", einInput, token)
        }
        if (itinInput && itinInput !== previousITIN) {
          await sendIdNotification(customer.id, updatedCompany.name, "ITIN", "assigned", itinInput, token)
        }
        if (businessIdInput && businessIdInput !== previousBusinessId) {
          await sendIdNotification(customer.id, updatedCompany.name, "Business ID", "assigned", businessIdInput, token)
        }

        toast({
          title: "Success",
          description: "Company information updated successfully",
        })
        setEditCompanyDialogOpen(false)
        loadCustomerData()
      } else {
        throw new Error(response.error || "Failed to update company")
      }
    } catch (error: any) {
      console.error("[v0] Error saving company:", error)
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      })
    } finally {
      setLoadingCompany("")
    }
  }

  const handleSaveTaxDetails = async () => {
    if (typeof window === "undefined") return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Saving tax details for company:", selectedCompany.id)

      setLoadingCompany(selectedCompany.id)

      const updatedCompany = {
        ...selectedCompany,
        taxClassification: taxClassificationInput || selectedCompany.taxClassification,
        annualReportDate: annualReportDateInput || selectedCompany.annualReportDate,
        taxFilingDate: taxFilingDateInput || selectedCompany.taxFilingDate,
        updatedAt: new Date().toISOString(),
      }

      const response = await ApiClient.companies.update(selectedCompany.id, updatedCompany, token)

      if (response.success) {
        toast({
          title: "Success",
          description: "Tax information updated successfully",
        })
        setTaxDetailsModalOpen(false)
        loadCustomerData()
      } else {
        throw new Error(response.error || "Failed to update tax details")
      }
    } catch (error: any) {
      console.error("[v0] Error saving tax details:", error)
      toast({
        title: "Error",
        description: "Failed to update tax information",
        variant: "destructive",
      })
    } finally {
      setLoadingCompany("")
    }
  }

  const handleDeleteCustomer = async () => {
    if (typeof window === "undefined") return

    if (
      !confirm(
        "Are you sure you want to delete this customer? This will permanently delete their account, all companies, orders, and documents.",
      )
    ) {
      return
    }

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Deleting customer:", customerId)

      const userResponse = await fetch(`/api/users/${customerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || "Failed to delete customer")
      }

      console.log("[v0] Customer deleted successfully")

      toast({
        title: "Success",
        description: "Customer and all related data deleted successfully",
      })

      router.push("/admin/customers")
    } catch (error: any) {
      console.error("[v0] Error deleting customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  const handleRemoveEIN = async (company: any) => {
    if (!window.confirm("Are you sure you want to remove this EIN?")) return

    try {
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }
      console.log("[v0] Removing EIN for company:", company.id)
      const response = await ApiClient.companies.update(company.id, { ein: null }, token)
      if (response.success) {
        console.log("[v0] EIN removed successfully, sending notification")
        await sendIdNotification(customer.id, company.name, "EIN", "removed", undefined, token)

        toast({
          title: "EIN Removed",
          description: "EIN has been removed successfully",
        })
        loadCustomerData()
      } else {
        throw new Error(response.error || "Failed to remove EIN")
      }
    } catch (error) {
      console.error("[v0] Error removing EIN:", error)
      toast({
        title: "Error",
        description: "Failed to remove EIN",
        variant: "destructive",
      })
    }
  }

  const sendIdNotification = async (
    userId: string,
    companyName: string,
    idType: string,
    action: "assigned" | "removed",
    value?: string,
    token?: string,
  ) => {
    if (!token) {
      console.error("[v0] Cannot send notification: No token provided")
      return
    }

    console.log(`[v0] Attempting to send ${idType} ${action} notification to user ${userId}`)

    try {
      const notificationData = {
        userId,
        type: "company_update",
        title: `${idType} ${action === "assigned" ? "Assigned" : "Removed"}`,
        message:
          action === "assigned"
            ? `Your ${idType} (${value}) has been assigned to ${companyName}`
            : `Your ${idType} has been removed from ${companyName}`,
        actionUrl: `/client/company`,
        metadata: {
          companyName,
          idType,
          action,
          value: value || null,
        },
      }

      console.log("[v0] Notification data:", notificationData)

      const response = await ApiClient.notifications.create(notificationData, token)

      console.log("[v0] Notification API response:", response)

      if (response.success) {
        console.log(`[v0] ✓ ${idType} ${action} notification sent successfully to user ${userId}`)
      } else {
        console.error(`[v0] ✗ Failed to send ${idType} notification:`, response)
      }
    } catch (error) {
      console.error(`[v0] ✗ Error sending ${idType} notification:`, error)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Customer not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-900">Customer Profile</h1>
        <Button variant="ghost" onClick={() => router.push("/admin/customers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
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
                  Active
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{companies[0]?.name || "N/A"}</p>
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
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete Customer
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{orders.length}</div>
            <p className="text-xs text-slate-500 mt-1">Across all companies</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg hover:border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${orders.reduce((sum, order) => sum + (order.amount || order.pricing?.total || 0), 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {companies.map((company) => (
          <Card key={company.id} className="relative">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <p className="text-sm text-muted-foreground">{company.state}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {company.id}</p>
                </div>

              </div>

              <div className="space-y-2">
                {/* EIN Display */}
                {company.ein && company.ein.trim() !== "" && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono bg-green-100 px-2 py-1 rounded">
                      <DollarSign className="h-3 w-3" />
                      EIN: {company.ein}
                    </span>
                    <button
                      onClick={() => handleRemoveEIN(company)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Remove EIN"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {company.itin && company.itin.trim() !== "" && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono bg-blue-100 px-2 py-1 rounded">
                      <DollarSign className="h-3 w-3" />
                      ITIN: {company.itin}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!window.confirm("Are you sure you want to remove this ITIN?")) return
                        try {
                          const token = authService.getToken()
                          if (!token) {
                            toast({
                              title: "Error",
                              description: "Authentication required",
                              variant: "destructive",
                            })
                            return
                          }
                          console.log("[v0] Removing ITIN for company:", company.id)
                          const response = await ApiClient.companies.update(company.id, { itin: null }, token)
                          if (response.success) {
                            console.log("[v0] ITIN removed successfully, sending notification")
                            await sendIdNotification(customer.id, company.name, "ITIN", "removed", undefined, token)

                            toast({
                              title: "ITIN Removed",
                              description: "ITIN has been removed successfully",
                            })
                            loadCustomerData()
                          } else {
                            throw new Error(response.error || "Failed to remove ITIN")
                          }
                        } catch (error) {
                          console.error("[v0] Error removing ITIN:", error)
                          toast({
                            title: "Error",
                            description: "Failed to remove ITIN",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}

                {/* Business ID Display */}
                {company.businessId && company.businessId.trim() !== "" && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 py-1 rounded">
                      <DollarSign className="h-3 w-3" />
                      Business ID: {company.businessId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!window.confirm("Are you sure you want to remove this Business ID?")) return
                        try {
                          const token = authService.getToken()
                          if (!token) {
                            toast({
                              title: "Error",
                              description: "Authentication required",
                              variant: "destructive",
                            })
                            return
                          }
                          console.log("[v0] Removing Business ID for company:", company.id)
                          const response = await ApiClient.companies.update(company.id, { businessId: null }, token)
                          if (response.success) {
                            console.log("[v0] Business ID removed successfully, sending notification")
                            await sendIdNotification(
                              customer.id,
                              company.name,
                              "Business ID",
                              "removed",
                              undefined,
                              token,
                            )

                            toast({
                              title: "Business ID Removed",
                              description: "Business ID has been removed successfully",
                            })
                            loadCustomerData()
                          } else {
                            throw new Error(response.error || "Failed to remove Business ID")
                          }
                        } catch (error) {
                          console.error("[v0] Error removing Business ID:", error)
                          toast({
                            title: "Error",
                            description: "Failed to remove Business ID",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}

                {/* Package Type */}
                {company.packageType && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Package Type</p>
                        <p className="text-sm font-medium text-slate-900 capitalize">{company.packageType}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Category */}
                {company.businessCategory && (
                  <div className={!company.packageType ? "mt-4 pt-4 border-t border-slate-200" : ""}>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Business Category</p>
                      <p className="text-sm text-slate-900">{company.businessCategory}</p>
                    </div>
                  </div>
                )}

                {/* Business Website */}
                {company.businessWebsite && (
                  <div
                    className={
                      !company.packageType && !company.businessCategory ? "mt-4 pt-4 border-t border-slate-200" : "mt-3"
                    }
                  >
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Business Website</p>
                      <a
                        href={company.businessWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {company.businessWebsite}
                      </a>
                    </div>
                  </div>
                )}

                {/* Business Description */}
                {company.businessDescription && (
                  <div
                    className={
                      !company.packageType && !company.businessCategory && !company.businessWebsite
                        ? "mt-4 pt-4 border-t border-slate-200"
                        : "mt-3"
                    }
                  >
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Business Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {company.businessDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Section */}
      {orders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Orders ({orders.length})</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{order.companyName || 'Unknown Company'}</h3>
                        <Badge 
                          variant={
                            order.status === 'completed' ? 'default' : 
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'failed' ? 'destructive' :
                            'outline'
                          }
                          className="capitalize"
                        >
                          {order.status || 'unknown'}
                        </Badge>
                      </div>
                      {order.pricing?.total && (
                        <p className="text-sm text-slate-600">
                          Amount: ${order.pricing.total.toFixed(2)}
                        </p>
                      )}
                      {order.createdAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Created: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      variant="outline"
                    >
                      View Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      <Dialog open={taxDetailsModalOpen} onOpenChange={setTaxDetailsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tax Details</DialogTitle>
            <DialogDescription>Update tax information for {selectedCompany?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tax-classification">Tax Classification</Label>
              <input
                id="tax-classification"
                type="text"
                value={taxClassificationInput}
                onChange={(e) => setTaxClassificationInput(e.target.value)}
                placeholder="e.g., S-Corporation, Partnership"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-report-date">Annual Report Date</Label>
              <input
                id="annual-report-date"
                type="date"
                value={annualReportDateInput}
                onChange={(e) => setAnnualReportDateInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-filing-date">Tax Filing Date</Label>
              <input
                id="tax-filing-date"
                type="date"
                value={taxFilingDateInput}
                onChange={(e) => setTaxFilingDateInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setTaxDetailsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTaxDetails} disabled={loadingCompany === selectedCompany?.id}>
              {loadingCompany === selectedCompany?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Tax Details"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
