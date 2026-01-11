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
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  FileText,
  User,
  MapPin,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
    processing: "bg-blue-50 text-blue-700 border-blue-300",
    cancelled: "bg-red-50 text-red-700 border-red-300",
  }
  return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "active":
      return <CheckCircle2 className="w-4 h-4" />
    case "pending":
    case "processing":
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
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
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")

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
      setNewStatus(orderData.status || "pending")

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
    if (!order || !newStatus) return

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
        body: JSON.stringify({ status: newStatus }),
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
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
        body: JSON.stringify({ milestones: updatedMilestones }),
      })

      if (!response.ok) {
        throw new Error("Failed to update milestone")
      }

      setMilestones(updatedMilestones)

      toast({
        title: "Success",
        description: `Milestone ${updatedMilestones[milestone] ? "completed" : "uncompleted"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
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
        headers: { Authorization: `Bearer ${token}` },
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
      toast({
        title: "Error",
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
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Order Not Found</h1>
        </div>
        <p className="text-red-600">{error || "Unable to load order details"}</p>
      </div>
    )
  }

  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const totalMilestones = Object.keys(milestones).length
  const completionPercentage = Math.round((completedMilestones / totalMilestones) * 100)

  const mainOrder = order.orders?.[0] || order
  const paymentInfo = mainOrder.paymentInfo || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Order Details</h1>
              <p className="text-gray-400 text-sm mt-1">ID: {order._id || order.id}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Order
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info Card */}
            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Name</Label>
                    <p className="text-lg font-semibold mt-2">{user?.name || company?.members?.[0]?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Email</Label>
                    <p className="text-lg font-semibold mt-2">{user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Phone</Label>
                    <p className="text-lg font-semibold mt-2">{user?.phone || paymentInfo?.whatsappPhone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
                    <div className="mt-2">
                      <Badge className={`${getStatusColor(user?.status || "active")} border`}>
                        {getStatusIcon(user?.status || "active")}
                        <span className="ml-2">{user?.status || "Active"}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information Card */}
            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Company Name</Label>
                    <p className="text-lg font-semibold mt-2">{company?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Type</Label>
                    <p className="text-lg font-semibold mt-2">{company?.type || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">State</Label>
                    <p className="text-lg font-semibold mt-2">{company?.state || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Package</Label>
                    <p className="text-lg font-semibold mt-2 capitalize">{company?.packageType || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Business Category</Label>
                    <p className="text-lg font-semibold mt-2">{company?.businessCategory || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Website</Label>
                    <a
                      href={company?.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold mt-2 block"
                    >
                      {company?.businessWebsite || "N/A"}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Address Card */}
            {company?.address && (
              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Business Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="font-semibold">{company.address.street || "Not Yet"}</p>
                    <p className="text-gray-600">
                      {company.address.city && company.address.state
                        ? `${company.address.city}, ${company.address.state} ${company.address.zip}`
                        : "Not Yet"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Owners Card */}
            {company?.members && company.members.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Business Owners / Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.members.map((member: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-lg">{member.name}</p>
                            <p className="text-sm text-gray-600">
                              {member.address && (
                                <>
                                  {member.address}, {member.city}, {member.state} {member.zip}
                                </>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {member.isResponsiblePerson ? "Responsible Person" : "Member"}
                          </Badge>
                        </div>
                        {member.passportKey && (
                          <a
                            href={member.passportKey}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            View Passport Document
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Order Status Card */}
            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur sticky top-4">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Current Status</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={`${getStatusColor(newStatus)} border`}>
                      {getStatusIcon(newStatus)}
                      <span className="ml-2 capitalize">{newStatus}</span>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Change Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
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
                  className="w-full"
                >
                  {statusUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Milestones Card */}
            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>Progress Milestones</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  {completedMilestones} of {totalMilestones} ({completionPercentage}%)
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {Object.entries(milestones).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleMilestoneToggle(key as keyof typeof milestones)}
                      className={`w-full p-3 rounded-lg text-left font-medium transition-all flex items-center justify-between ${
                        value
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      {value && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information Card */}
            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Payment Method</Label>
                  <p className="text-lg font-semibold mt-1 capitalize">{paymentInfo?.method || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
                  <Badge className={`${getStatusColor(paymentInfo?.status || "pending")} border mt-2`}>
                    {getStatusIcon(paymentInfo?.status || "pending")}
                    <span className="ml-2 capitalize">{paymentInfo?.status || "Pending"}</span>
                  </Badge>
                </div>

                {paymentInfo?.transactionId && (
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Transaction ID</Label>
                    <p className="text-sm font-mono mt-1 break-all bg-gray-50 p-2 rounded">
                      {paymentInfo.transactionId}
                    </p>
                  </div>
                )}

                {paymentInfo?.receiptUrl && (
                  <a
                    href={paymentInfo.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-2 mt-3"
                  >
                    <FileText className="w-4 h-4" />
                    Download Receipt
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Pricing Card */}
            {mainOrder?.pricing && (
              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle>Order Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Price</span>
                    <span className="font-semibold">${mainOrder.pricing.packagePrice?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">State Filing Fee</span>
                    <span className="font-semibold">${mainOrder.pricing.stateFilingFee?.toFixed(2) || "0.00"}</span>
                  </div>
                  {mainOrder.pricing.addonsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Add-ons</span>
                      <span className="font-semibold">${mainOrder.pricing.addonsTotal?.toFixed(2) || "0.00"}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${mainOrder.pricing.total?.toFixed(2) || "0.00"}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
