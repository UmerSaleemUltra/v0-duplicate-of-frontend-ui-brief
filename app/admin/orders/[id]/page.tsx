"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
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
  ChevronRight,
  Building2,
  Flag,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-slate-50 text-slate-600 border-slate-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-cyan-50 text-cyan-700 border-cyan-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  }
  return statusMap[status?.toLowerCase()] || "bg-slate-50 text-slate-600 border-slate-200"
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Order Not Found</h1>
          </div>
          <p className="text-red-600">{error || "Unable to load order details"}</p>
        </div>
      </div>
    )
  }

  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const totalMilestones = Object.keys(milestones).length
  const completionPercentage = Math.round((completedMilestones / totalMilestones) * 100)

  const mainOrder = order.orders?.[0] || order
  const paymentInfo = mainOrder.paymentInfo || {}

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
                <p className="text-xs text-slate-500 mt-0.5">Order ID: {order._id || order.id}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Customer</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</p>
                  <p className="text-base font-semibold text-slate-900">
                    {user?.name || company?.members?.[0]?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</p>
                  <p className="text-base font-mono text-slate-700">{user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</p>
                  <p className="text-base font-semibold text-slate-900">
                    {user?.phone || paymentInfo?.whatsappPhone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Status</p>
                  <Badge className={`${getStatusColor(user?.status || "active")} border`}>
                    {getStatusIcon(user?.status || "active")}
                    <span className="ml-2">{user?.status || "Active"}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Company Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-transparent">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Company</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</p>
                  <p className="text-base font-semibold text-slate-900">{company?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Entity Type</p>
                  <p className="text-base font-semibold text-slate-900">{company?.type || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">State</p>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-slate-400" />
                    <p className="text-base font-semibold text-slate-900">{company?.state || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Package</p>
                  <Badge variant="outline" className="capitalize">
                    {company?.packageType || "—"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
                  <p className="text-sm text-slate-700">{company?.businessCategory || "—"}</p>
                </div>
                {company?.businessWebsite && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Website</p>
                    <a
                      href={company.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {company.businessWebsite}
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Address Card */}
            {company?.address && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-transparent">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Business Address</h2>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-base font-semibold text-slate-900">{company.address.street || "Not assigned"}</p>
                  <p className="text-sm text-slate-600">
                    {company.address.city && company.address.state
                      ? `${company.address.city}, ${company.address.state} ${company.address.zip}`
                      : "Not assigned"}
                  </p>
                </div>
              </div>
            )}

            {/* Members Card */}
            {company?.members && company.members.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-transparent">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Members</h2>
                </div>
                <div className="p-6 space-y-4">
                  {company.members.map((member: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        {member.address && (
                          <p className="text-sm text-slate-600 mt-1">
                            {member.address}, {member.city}, {member.state} {member.zip}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={
                          member.isResponsiblePerson
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }
                        variant="outline"
                      >
                        {member.isResponsiblePerson ? "Principal" : "Member"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden sticky top-20">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-transparent">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Clock className="w-5 h-5 text-cyan-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Status</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current</p>
                  <Badge className={`${getStatusColor(newStatus)} border text-sm py-1.5 px-3`}>
                    {getStatusIcon(newStatus)}
                    <span className="ml-2 capitalize">{newStatus}</span>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="border-slate-200">
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
              </div>
            </div>

            {/* Milestones Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-transparent">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">Milestones</p>
                    <Badge variant="outline">
                      {completedMilestones}/{totalMilestones}
                    </Badge>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{completionPercentage}% complete</p>
                </div>

                <div className="space-y-2">
                  {Object.entries(milestones).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleMilestoneToggle(key as keyof typeof milestones)}
                      className={`w-full p-3 rounded-lg text-left text-sm font-medium transition-all flex items-center justify-between ${
                        value
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      {value && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-transparent">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Method</p>
                  <p className="text-base font-semibold text-slate-900 capitalize">{paymentInfo?.method || "—"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
                  <Badge className={`${getStatusColor(paymentInfo?.status || "pending")} border`}>
                    {getStatusIcon(paymentInfo?.status || "pending")}
                    <span className="ml-2 capitalize">{paymentInfo?.status || "Pending"}</span>
                  </Badge>
                </div>

                {paymentInfo?.transactionId && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transaction ID</p>
                    <p className="text-xs font-mono bg-slate-50 border border-slate-200 rounded p-2 text-slate-700 break-all">
                      {paymentInfo.transactionId}
                    </p>
                  </div>
                )}

                {paymentInfo?.receiptUrl && (
                  <a
                    href={paymentInfo.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm mt-3"
                  >
                    <FileText className="w-4 h-4" />
                    Download Receipt
                  </a>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            {mainOrder?.pricing && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-transparent">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-rose-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Package</span>
                    <span className="font-semibold text-slate-900">
                      ${mainOrder.pricing.packagePrice?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Filing Fee</span>
                    <span className="font-semibold text-slate-900">
                      ${mainOrder.pricing.stateFilingFee?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {mainOrder.pricing.addonsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Add-ons</span>
                      <span className="font-semibold text-slate-900">
                        ${mainOrder.pricing.addonsTotal?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${mainOrder.pricing.total?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the order and all associated data.
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
                "Delete Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
