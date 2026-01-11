"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, CheckCircle2, Clock, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { StatusUpdateModal } from "@/components/status-update-modal"

const getDisplayValue = (value: any, defaultValue = "Not Yet"): string => {
  if (value === null || value === undefined || value === "") return defaultValue
  if (typeof value === "string" && value.trim() === "") return defaultValue

  const placeholderPatterns = [/^Provide a brief overview/i, /minimum \d+ characters/i, /^[a-z]{1,5}$/i]

  if (typeof value === "string") {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(value.trim())) return defaultValue
    }
    return value.trim()
  }
  return String(value)
}

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-800",
    completed: "bg-blue-100 text-blue-800",
    processing: "bg-blue-50 text-blue-700",
    cancelled: "bg-red-50 text-red-700",
  }
  return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("admin")
  const orderParams = useParams()
  const orderId = orderParams?.id as string

  const [order, setOrder] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [companyStatusDialogOpen, setCompanyStatusDialogOpen] = useState(false)
  const [registeredAgentStatusDialogOpen, setRegisteredAgentStatusDialogOpen] = useState(false)
  const [businessAddressStatusDialogOpen, setBusinessAddressStatusDialogOpen] = useState(false)
  const [serviceStatusDialogOpen, setServiceStatusDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [statusUpdating, setStatusUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newStatus, setNewStatus] = useState("")

  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" })
  const [companyForm, setCompanyForm] = useState({
    name: "",
    state: "",
    businessCategory: "",
    businessWebsite: "",
    businessDescription: "",
  })

  const [milestones, setMilestones] = useState({
    orderProcessed: false,
    registeredAgentAssigned: false,
    mailingAddressIssued: false,
    formationCompleted: false,
    einProcessed: false,
    boiReportFiled: false,
  })

  const loadOrderData = useCallback(async () => {
    if (!orderId || !isAuthenticated) return

    try {
      setLoading(true)
      const token = authService.getToken()

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      if (!response.ok) {
        throw new Error(response.status === 404 ? "Order not found" : `Failed to load order: ${response.status}`)
      }

      const result = await response.json()
      const orderData = result.data

      if (!orderData) {
        throw new Error("Order data not found")
      }

      setOrder(orderData)
      setCompany(orderData.company)
      setUser(orderData.user)
      setNewStatus(orderData.status || "")

      if (orderData.company?.milestones) {
        setMilestones({
          orderProcessed: Boolean(orderData.company.milestones.orderProcessed),
          registeredAgentAssigned: Boolean(orderData.company.milestones.registeredAgentAssigned),
          mailingAddressIssued: Boolean(orderData.company.milestones.mailingAddressIssued),
          formationCompleted: Boolean(orderData.company.milestones.formationCompleted),
          einProcessed: Boolean(orderData.company.milestones.einProcessed),
          boiReportFiled: Boolean(orderData.company.milestones.boiReportFiled),
        })
      }

      setCustomerForm({
        name: orderData.user?.name || orderData.company?.members?.[0]?.name || "",
        email: orderData.user?.email || "",
        phone: orderData.user?.phone || "",
      })

      setCompanyForm({
        name: getDisplayValue(orderData.company?.name, ""),
        state: getDisplayValue(orderData.company?.state, ""),
        businessCategory: getDisplayValue(orderData.company?.businessCategory, ""),
        businessWebsite: getDisplayValue(orderData.company?.businessWebsite, ""),
        businessDescription: getDisplayValue(orderData.company?.businessDescription, ""),
      })

      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load order"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [orderId, isAuthenticated, router, toast])

  useEffect(() => {
    loadOrderData()
  }, [loadOrderData])

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !company) return

    setStatusUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/orders/${order._id || order.id}`, {
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
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleMilestoneToggle = async (milestone: keyof typeof milestones) => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const updatedMilestones = {
        ...milestones,
        [milestone]: !milestones[milestone],
      }

      const response = await fetch(`/api/companies/${company._id || company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.JSON.stringify({
          milestones: updatedMilestones,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update milestone")
      }

      const result = await response.json()
      setCompany(result.data)
      setMilestones(updatedMilestones)

      toast({
        title: "Milestone Updated",
        description: `${milestone} has been ${updatedMilestones[milestone] ? "completed" : "uncompleted"}`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update milestone",
        variant: "destructive",
      })
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

      const response = await fetch(`/api/orders/${order._id || order.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete order")
      }

      toast({
        title: "Order Deleted",
        description: "Order has been successfully deleted",
      })

      router.push("/admin/orders")
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete order",
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !order || !company) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Order Not Found</h1>
        </div>
        <p className="text-red-600 mt-4">{error || "Unable to load order details"}</p>
      </div>
    )
  }

  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const totalMilestones = Object.keys(milestones).length
  const completionPercentage = Math.round((completedMilestones / totalMilestones) * 100)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-gray-600">Order ID: {order._id || order.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <p className="text-lg font-semibold">{customerForm.name || "N/A"}</p>
                </div>
                <div>
                  <Label>Email Address</Label>
                  <p className="text-lg font-semibold">{customerForm.email || "N/A"}</p>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <p className="text-lg font-semibold">{customerForm.phone || "N/A"}</p>
                </div>
                <div>
                  <Label>Account Status</Label>
                  <Badge className={getStatusColor(user?.status || "active")}>{user?.status || "Active"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={getStatusColor(newStatus)}>{newStatus || "Pending"}</Badge>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleStatusUpdate} disabled={statusUpdating || newStatus === order.status}>
                    {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formation Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Formation Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">
                    {completedMilestones} of {totalMilestones} milestones completed ({completionPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {Object.entries(milestones).map(([key, completed]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMilestoneToggle(key as keyof typeof milestones)}
                    >
                      {completed ? "Unmark" : "Mark Complete"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <p>{companyForm.name || "Not Yet"}</p>
                </div>
                <div>
                  <Label>State of Formation</Label>
                  <p>{companyForm.state || "Not Yet"}</p>
                </div>
                <div>
                  <Label>Entity Type</Label>
                  <p>{company?.entityType || "Not Yet"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Category</Label>
                  <p>{companyForm.businessCategory || "Not Yet"}</p>
                </div>
                <div>
                  <Label>Business Website</Label>
                  <p>
                    {companyForm.businessWebsite ? (
                      <a
                        href={companyForm.businessWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        {companyForm.businessWebsite}
                      </a>
                    ) : (
                      "Not Yet"
                    )}
                  </p>
                </div>
              </div>
              <div>
                <Label>Business Description</Label>
                <p className="text-sm mt-2">{companyForm.businessDescription || "Not Yet"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Business Mailing Address */}
          {company?.mailingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Business Mailing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>{company.mailingAddress.street || "Not Yet"}</p>
                  <p>
                    {company.mailingAddress.city}, {company.mailingAddress.state} {company.mailingAddress.zip}
                  </p>
                  {company.mailingAddress.expiryDate && (
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(company.mailingAddress.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                  <Badge className={getStatusColor(company.mailingAddress.status || "pending")}>
                    {company.mailingAddress.status || "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registered Agent */}
          {company?.registeredAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Registered Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Name:</strong> {company.registeredAgent.name || "Not Yet"}
                </p>
                <p>
                  <strong>Company:</strong> {company.registeredAgent.company || "Not Yet"}
                </p>
                <p>
                  <strong>Address:</strong> {company.registeredAgent.address || "Not Yet"}
                </p>
                <p>
                  {company.registeredAgent.city}, {company.registeredAgent.state} {company.registeredAgent.zip}
                </p>
                <Badge className={getStatusColor(company.registeredAgent.status || "pending")}>
                  {company.registeredAgent.status || "Pending"}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Order & Pricing Details */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle>Order & Pricing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Order Date</Label>
                    <p>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <Label>Package Price</Label>
                    <p>${order.packagePrice || "0.00"}</p>
                  </div>
                  <div>
                    <Label>Filing Fee</Label>
                    <p>${order.filingFee || "0.00"}</p>
                  </div>
                  <div>
                    <Label>Add-ons Total</Label>
                    <p>${order.addonsTotal || "0.00"}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-lg text-green-600">${order.totalAmount || "0.00"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Payment Method</Label>
                    <p className="capitalize">{order.paymentMethod || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Payment Status</Label>
                    <Badge className={getStatusColor(order.paymentStatus || "pending")}>
                      {order.paymentStatus || "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Status Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Status */}
              <div className="space-y-2">
                <Label className="font-semibold">Company Status</Label>
                <Badge className={getStatusColor(company?.status || "pending")}>{company?.status || "Pending"}</Badge>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => setCompanyStatusDialogOpen(true)}
                >
                  Update
                </Button>
              </div>

              {/* Registered Agent Status */}
              <div className="space-y-2 border-t pt-4">
                <Label className="font-semibold">Registered Agent Status</Label>
                <Badge className={getStatusColor(company?.registeredAgent?.status || "pending")}>
                  {company?.registeredAgent?.status || "Pending"}
                </Badge>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => setRegisteredAgentStatusDialogOpen(true)}
                >
                  Update
                </Button>
              </div>

              {/* Business Address Status */}
              <div className="space-y-2 border-t pt-4">
                <Label className="font-semibold">Business Address Status</Label>
                <Badge className={getStatusColor(company?.mailingAddress?.status || "pending")}>
                  {company?.mailingAddress?.status || "Pending"}
                </Badge>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => setBusinessAddressStatusDialogOpen(true)}
                >
                  Update
                </Button>
              </div>

              {/* Service Status */}
              <div className="space-y-2 border-t pt-4">
                <Label className="font-semibold">Service Status</Label>
                <Badge className={getStatusColor(company?.serviceStatus || "pending")}>
                  {company?.serviceStatus || "Pending"}
                </Badge>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => setServiceStatusDialogOpen(true)}
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
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
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Modals */}
      <StatusUpdateModal
        open={companyStatusDialogOpen}
        onOpenChange={setCompanyStatusDialogOpen}
        title="Update Company Status"
        currentStatus={company?.status}
        onUpdate={(status) => {
          // Update company status
          setCompanyStatusDialogOpen(false)
        }}
      />

      <StatusUpdateModal
        open={registeredAgentStatusDialogOpen}
        onOpenChange={setRegisteredAgentStatusDialogOpen}
        title="Update Registered Agent Status"
        currentStatus={company?.registeredAgent?.status}
        onUpdate={(status) => {
          // Update agent status
          setRegisteredAgentStatusDialogOpen(false)
        }}
      />

      <StatusUpdateModal
        open={businessAddressStatusDialogOpen}
        onOpenChange={setBusinessAddressStatusDialogOpen}
        title="Update Business Address Status"
        currentStatus={company?.mailingAddress?.status}
        onUpdate={(status) => {
          // Update address status
          setBusinessAddressStatusDialogOpen(false)
        }}
      />

      <StatusUpdateModal
        open={serviceStatusDialogOpen}
        onOpenChange={setServiceStatusDialogOpen}
        title="Update Service Status"
        currentStatus={company?.serviceStatus}
        onUpdate={(status) => {
          // Update service status
          setServiceStatusDialogOpen(false)
        }}
      />
    </div>
  )
}
