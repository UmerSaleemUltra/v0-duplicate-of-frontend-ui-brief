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
  Mail,
  Phone,
  Globe,
  Shield,
  FileBarChart,
  Plus,
  Users,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { Textarea } from "@/components/ui/textarea"

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

  const [passportDocuments, setPassportDocuments] = useState<any[]>([])
  const [addons, setAddons] = useState<any[]>([])
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
      setOrderNotes(orderData.notes || "")
      setPassportDocuments(orderData.passportDocuments || [])

      const orderAddons = orderData.purchasedAddons || orderData.selectedAddons || []
      const companyAddons = orderData.company?.purchasedAddons || []
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

  const handleNotesUpdate = async () => {
    if (!order) return

    setNotesUpdating(true)
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
        body: JSON.stringify({ notes: orderNotes }),
      })

      if (!response.ok) {
        throw new Error("Failed to update notes")
      }

      const result = await response.json()
      setOrder(result.data)
      setEditingNotes(false)

      toast({
        title: "Success",
        description: "Order notes updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update notes",
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
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="text-base font-mono text-slate-700 truncate">{user?.email || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="text-base font-semibold text-slate-900">
                      {user?.phone || mainOrder?.paymentInfo?.whatsappPhone || "—"}
                    </p>
                  </div>
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

            {/* Company Information Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-transparent">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Company Name</p>
                  <p className="text-base font-semibold text-slate-900">{company?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Entity Type</p>
                  <Badge variant="outline" className="capitalize">
                    {company?.type || "—"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">State</p>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-slate-400" />
                    <p className="text-base font-semibold text-slate-900">{company?.state || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Package Type</p>
                  <Badge variant="outline" className="capitalize">
                    {company?.packageType || "—"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">EIN</p>
                  <p className="text-base font-mono text-slate-700">{company?.ein || "Not Yet"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Business ID</p>
                  <p className="text-base font-mono text-slate-700">{company?.businessId || "Not Yet"}</p>
                </div>
                {company?.businessWebsite && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Website</p>
                    <a
                      href={company.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      {company.businessWebsite}
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {company?.businessCategory && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
                    <p className="text-sm text-slate-700">{company.businessCategory}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mailing Address Card */}
            {company?.mailingAddress && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-transparent">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Mailing Address</h2>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-base font-semibold text-slate-900">{company.mailingAddress.street || "Not Yet"}</p>
                  <p className="text-sm text-slate-600">
                    {company.mailingAddress.city && company.mailingAddress.state
                      ? `${company.mailingAddress.city}, ${company.mailingAddress.state} ${company.mailingAddress.zip}`
                      : "Not Yet"}
                  </p>
                </div>
              </div>
            )}

            {/* Registered Agent Card */}
            {company?.registeredAgent?.name && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Registered Agent</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</p>
                    <p className="text-base font-semibold text-slate-900">{company.registeredAgent.name}</p>
                  </div>
                  {company.registeredAgent.address && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Address</p>
                      <p className="text-sm text-slate-700">
                        {company.registeredAgent.address}, {company.registeredAgent.city},{" "}
                        {company.registeredAgent.state} {company.registeredAgent.zip}
                      </p>
                    </div>
                  )}
                  {company.registeredAgent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-mono text-slate-700">{company.registeredAgent.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members Card */}
            {company?.members && company.members.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-transparent">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Business Owners / Members</h2>
                </div>
                <div className="p-6 space-y-4">
                  {company.members.map((member: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{member.name || "Member"}</p>
                        {member.address && (
                          <p className="text-sm text-slate-600 mt-1">
                            {member.address}, {member.city}, {member.state} {member.zip}
                          </p>
                        )}
                        {member.needsItin && (
                          <Badge className="mt-2 bg-blue-50 text-blue-700 border-blue-200 border" variant="outline">
                            <FileBarChart className="w-3 h-3 mr-1" />
                            ITIN Required
                          </Badge>
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

            {/* Add-ons Card */}
            {addons && addons.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-pink-50 to-transparent">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Plus className="w-5 h-5 text-pink-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Purchased Add-ons</h2>
                </div>
                <div className="p-6 space-y-2">
                  {addons.map((addon: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {typeof addon === "string" ? addon : addon.name || addon.serviceId || "Add-on"}
                      </span>
                      <Badge variant="secondary">{addon.price ? `$${addon.price}` : "Included"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-transparent">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Admin Notes</h2>
              </div>
              <div className="p-6">
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Add internal notes about this order..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNotes(false)
                          setOrderNotes(order?.notes || "")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleNotesUpdate} disabled={notesUpdating}>
                        {notesUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Notes"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {orderNotes ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{orderNotes}</p>
                        <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>
                          Edit Notes
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>
                        Add Notes
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
