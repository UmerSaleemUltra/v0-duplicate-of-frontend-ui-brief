"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Package,
  User,
  Users,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  Loader2,
  MapPin,
  Trash2,
  Settings,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { DollarSign } from "lucide-react" // Import DollarSign

const getDisplayValue = (value: any, defaultValue = "N/A"): string => {
  if (value === null || value === undefined || value === "") return defaultValue
  if (typeof value === "string" && value.trim() === "") return defaultValue
  const placeholderPatterns = [
    /^Provide a brief overview/i,
    /minimum \d+ characters/i,
    /^[a-z]{1,5}$/i,
    /^[a-zA-Z0-9\s]*$/,
  ]

  if (typeof value === "string") {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(value.trim())) {
        return defaultValue
      }
    }
  }
  return String(value)
}

const formatEIN = (ein: string | undefined, includeHyphen = false): string => {
  if (!ein || ein === "N/A") return "N/A"
  const cleaned = ein.replace(/[^0-9]/g, "")
  if (cleaned.length === 9) {
    return includeHyphen ? `${cleaned.substring(0, 2)}-${cleaned.substring(2, 9)}` : cleaned
  }
  return ein
}

const formatBusinessId = (businessId: string | undefined): string => {
  if (!businessId || businessId === "N/A") return "N/A"
  return businessId.toUpperCase()
}

const getWeeksSinceOrder = (createdAt: string | undefined): number => {
  if (!createdAt) return 0
  const orderDate = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - orderDate.getTime())
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
  return diffWeeks
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("admin")

  const orderParams = useParams()
  const orderId = orderParams?.id as string

  const [order, setOrder] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [newStatus, setNewStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addons, setAddons] = useState<any[]>([])
  const [passportDocuments, setPassportDocuments] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  const [statusUpdating, setStatusUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [orderNotes, setOrderNotes] = useState("")
  const [notesUpdating, setNotesUpdating] = useState(false)

  const [milestones, setMilestones] = useState({
    orderProcessed: false,
    registeredAgentAssigned: false,
    mailingAddressIssued: false,
    formationCompleted: false,
    einProcessed: false,
    boiReportFiled: false,
  })

  const hasEIN =
    company?.ein &&
    company.ein.trim() !== "" &&
    company.ein !== "Pending" &&
    company.ein !== "pending" &&
    company.ein !== "N/A"

  const hasBusinessId =
    company?.businessId &&
    company.businessId.trim() !== "" &&
    !company.businessId.includes("PENDING") &&
    company.businessId !== "BIZ-PENDING" &&
    company.businessId !== "N/A"

  const hasRegisteredAgent = company?.registeredAgent?.name && company.registeredAgent?.name.trim() !== ""

  const hasMailingAddress =
    company?.mailingAddress?.street &&
    company.mailingAddress?.city &&
    company.mailingAddress?.state &&
    company.mailingAddress?.zip

  const weeksSinceOrder = getWeeksSinceOrder(order?.createdAt)
  const isOverdue = weeksSinceOrder >= 7

  const getAddonName = (addonId: string) => {
    const addon = addons.find((a) => a.id === addonId)
    if (addon) return addon.name
    if (addonId.startsWith("itin-")) return "ITIN Application"
    if (addonId === "reseller-certificate") return "Reseller Certificate"
    if (addonId === "business-website") return "Business Website"
    return addonId
  }

  const loadOrderData = useCallback(async () => {
    if (!orderId) {
      setError("Invalid order ID")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const token = authService.getToken()

      if (!token) {
        router.push("/login")
        return
      }

      const orderResponse = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      if (!orderResponse.ok) {
        if (orderResponse.status === 404) {
          setError("Order not found")
          toast({
            title: "Error",
            description: "Order not found",
            variant: "destructive",
          })
        } else {
          throw new Error(`Failed to fetch order: ${orderResponse.status}`)
        }
        setLoading(false)
        return
      }

      const orderData = await orderResponse.json()

      if (!orderData.success || !orderData.data) {
        setError("Invalid order data")
        setLoading(false)
        return
      }

      const {
        data: { company: foundCompany, user: foundUser, passportDocuments: foundPassportDocuments, ...foundOrder },
      } = orderData

      let customerData = foundUser
      if (!customerData && foundCompany?.members?.[0]) {
        customerData = {
          id: foundCompany.userId || foundOrder.userId,
          name: foundCompany.members[0].name || "User Not Found",
          email: foundCompany.members[0].email || "no-email@example.com",
          phone: foundCompany.members[0].phone || "N/A",
          role: "client",
          accountStatus: "inactive",
        }
      } else if (!customerData) {
        customerData = {
          id: foundOrder.userId,
          name: "Unknown User",
          email: "N/A",
          phone: "N/A",
          role: "client",
        }
      }

      setOrder(foundOrder)
      setCompany(foundCompany)
      setCustomer(customerData)
      setUser(foundUser)
      setPassportDocuments(foundPassportDocuments || [])
      setOrderNotes(foundOrder.notes || "")

      if (foundCompany?.milestones) {
        setMilestones({
          orderProcessed: foundCompany.milestones.orderProcessed || false,
          registeredAgentAssigned: foundCompany.milestones.registeredAgentAssigned || false,
          mailingAddressIssued: foundCompany.milestones.mailingAddressIssued || false,
          formationCompleted: foundCompany.milestones.formationCompleted || false,
          einProcessed: foundCompany.milestones.einProcessed || false,
          boiReportFiled: foundCompany.milestones.boiReportFiled || false,
        })
      }

      const orderAddons = foundOrder.purchasedAddons || foundOrder.selectedAddons || []
      const companyAddons = foundCompany?.purchasedAddons || []

      const allAddons = [...orderAddons]
      companyAddons.forEach((companyAddon: any) => {
        const addonId = typeof companyAddon === "object" ? companyAddon.serviceId : companyAddon
        const alreadyExists = allAddons.some((orderAddon: any) => {
          const orderAddonId = typeof orderAddon === "object" ? orderAddon.serviceId : orderAddon
          return orderAddonId === addonId
        })
        if (!alreadyExists) {
          allAddons.push(companyAddon)
        }
      })

      setAddons(allAddons)
      setNewStatus(foundOrder.status || "")
      setError(null)
    } catch (error) {
      console.error("[v0] Error loading order data:", error)
      setError("Failed to load order")
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [orderId, router, toast])

  useEffect(() => {
    if (isAuthenticated && orderId) {
      loadOrderData()
    } else if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [orderId, isAuthenticated, authLoading, loadOrderData, router])

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !company) return

    setStatusUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      const result = await response.json()
      setOrder(result.data)
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!order) return

    setNotesUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: orderNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update notes")
      }

      const result = await response.json()
      setOrder(result.data)
      setEditingNotes(false)
      toast({
        title: "Success",
        description: "Notes saved successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving notes:", error)
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      })
    } finally {
      setNotesUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!order) return

    setDeleting(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete order")
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
      router.push("/admin/orders")
    } catch (error) {
      console.error("[v0] Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || "Failed to load order details"}</p>
            <Button onClick={() => router.push("/admin/orders")} variant="outline" className="w-full">
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const totalMilestones = Object.values(milestones).length
  const milestonePercentage = Math.round((completedMilestones / totalMilestones) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/orders")}
              className="hover:bg-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Order Details</h1>
              <p className="text-sm text-slate-600">ID: {order.id}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Order
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <CardTitle>Customer Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Name</p>
                    <p className="text-lg font-semibold">{getDisplayValue(customer?.name)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-lg font-semibold">{getDisplayValue(customer?.email)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Phone</p>
                    <p className="text-lg font-semibold">{getDisplayValue(customer?.phone)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Account Status</p>
                    <Badge className="mt-1" variant={customer?.accountStatus === "active" ? "default" : "secondary"}>
                      {customer?.accountStatus || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <CardTitle>Company Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Company Name</p>
                    <p className="text-lg font-semibold">{getDisplayValue(company?.name)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">State of Formation</p>
                    <p className="text-lg font-semibold">{getDisplayValue(company?.state)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Entity Type</p>
                    <p className="text-lg font-semibold">{getDisplayValue(company?.entityType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Business Category</p>
                    <p className="text-lg font-semibold">{getDisplayValue(company?.businessCategory)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Business Website</p>
                    {company?.businessWebsite ? (
                      <a
                        href={company.businessWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {company.businessWebsite}
                      </a>
                    ) : (
                      <p className="text-slate-500">Not provided</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Business Description</p>
                    <p className="text-sm text-slate-700">
                      {getDisplayValue(company?.businessDescription, "Not provided")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identifiers Section */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-green-600" />
                  <CardTitle>Business Identifiers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">EIN Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{hasEIN ? formatEIN(company?.ein, true) : "Not Yet"}</p>
                      {hasEIN ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Business ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">
                        {hasBusinessId ? formatBusinessId(company?.businessId) : "Not Yet"}
                      </p>
                      {hasBusinessId ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(hasRegisteredAgent || hasMailingAddress) && (
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <CardTitle>Address Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {hasRegisteredAgent && (
                      <div>
                        <p className="font-semibold mb-3">Registered Agent</p>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-slate-600">Name:</span> {company.registeredAgent.name}
                          </p>
                          <p>
                            <span className="text-slate-600">Company:</span>{" "}
                            {getDisplayValue(company.registeredAgent.company)}
                          </p>
                          <p>
                            <span className="text-slate-600">Address:</span>{" "}
                            {getDisplayValue(company.registeredAgent.address)}
                          </p>
                          <p>
                            <span className="text-slate-600">City, State, ZIP:</span>{" "}
                            {getDisplayValue(company.registeredAgent.city)},{" "}
                            {getDisplayValue(company.registeredAgent.state)}{" "}
                            {getDisplayValue(company.registeredAgent.zip)}
                          </p>
                        </div>
                      </div>
                    )}
                    {hasMailingAddress && (
                      <div>
                        <p className="font-semibold mb-3">Mailing Address</p>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-slate-600">Street:</span> {company.mailingAddress.street}
                          </p>
                          <p>
                            <span className="text-slate-600">City, State, ZIP:</span> {company.mailingAddress.city},{" "}
                            {company.mailingAddress.state} {company.mailingAddress.zip}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Owners/Members */}
            {company?.members && company.members.length > 0 && (
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <CardTitle>Business Owners / Members</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {company.members.map((member: any, idx: number) => (
                      <div key={idx} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold">{member.name || `Member ${idx + 1}`}</p>
                          <Badge variant="outline">
                            {member.isResponsiblePerson ? "Responsible Person" : "Member"}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          {member.address && (
                            <p>
                              {member.address}, {member.city}, {member.state} {member.zip}
                            </p>
                          )}
                          {member.needsItin && (
                            <Badge variant="secondary" className="mt-2">
                              Needs ITIN
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100 border-b">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-rose-600" />
                    <CardTitle>Purchased Add-ons</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {addons.map((addon: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">
                          {getAddonName(typeof addon === "string" ? addon : addon.serviceId)}
                        </span>
                        {addon.price && <span className="text-sm text-slate-600">${addon.price}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card className="border-0 shadow-sm sticky top-6">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-700 text-white border-b-0 rounded-t-lg">
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Current Status</p>
                    <Badge className="text-lg px-3 py-1" variant={order.status === "pending" ? "secondary" : "default"}>
                      {order.status || "Unknown"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={statusUpdating || newStatus === order.status}
                    className="w-full gap-2"
                  >
                    {statusUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Order Date</p>
                    <p className="font-semibold">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Payment Status</p>
                    <Badge variant={order.paymentStatus === "completed" ? "default" : "secondary"}>
                      {order.paymentStatus || "Unknown"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Payment Method</p>
                    <p className="font-semibold">{getDisplayValue(order.paymentMethod)}</p>
                  </div>
                  {order.transactionId && (
                    <div>
                      <p className="text-slate-600 mb-1">Transaction ID</p>
                      <p className="font-semibold text-xs break-all">{order.transactionId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Package Price</span>
                    <span className="font-semibold">${order.packagePrice || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">State Filing Fee</span>
                    <span className="font-semibold">${order.stateFilingFee || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Add-ons Total</span>
                    <span className="font-semibold">${order.addonsTotal || "0.00"}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-bold">
                    <span>Total Amount</span>
                    <span className="text-emerald-600">${order.totalAmount || "0.00"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Progress */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                  Formation Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">
                      {completedMilestones} of {totalMilestones} milestones completed
                    </p>
                    <span className="text-sm font-bold text-cyan-600">{milestonePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${milestonePercentage}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(milestones).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {value ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      <span className={value ? "text-slate-700" : "text-slate-600"}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-600" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Add admin notes here..."
                      className="min-h-[120px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNotes} disabled={notesUpdating} size="sm" className="flex-1">
                        {notesUpdating ? "Saving..." : "Save"}
                      </Button>
                      <Button onClick={() => setEditingNotes(false)} variant="outline" size="sm" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-3">{orderNotes || "No notes added"}</p>
                    <Button onClick={() => setEditingNotes(true)} variant="outline" size="sm" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Edit Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting} className="gap-2">
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
