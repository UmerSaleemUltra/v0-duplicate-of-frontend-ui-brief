"use client"

import type React from "react"

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
  Package,
  User,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  Loader2,
  MapPin,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"

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

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", icon: <Clock className="w-3 h-3" /> },
    processing: { bg: "bg-blue-50", text: "text-blue-700", icon: <Loader2 className="w-3 h-3" /> },
    completed: { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { bg: "bg-red-50", text: "text-red-700", icon: <AlertCircle className="w-3 h-3" /> },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge className={`${config.bg} ${config.text} border-0 flex items-center gap-1`}>
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
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
  const [passportUrls, setPassportUrls] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  const [editingSection, setEditingSection] = useState<string | null>(null)

  const [statusUpdating, setStatusUpdating] = useState(false)
  const [agentUpdating, setAgentUpdating] = useState(false)
  const [addressUpdating, setAddressUpdating] = useState(false)
  const [einUpdating, setEinUpdating] = useState(false)
  const [itinUpdating, setItinUpdating] = useState(false)
  const [businessIdUpdating, setBusinessIdUpdating] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [milestoneUpdating, setMilestoneUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [companyStatusDialogOpen, setCompanyStatusDialogOpen] = useState(false)
  const [registeredAgentStatusDialogOpen, setRegisteredAgentStatusDialogOpen] = useState(false)
  const [businessAddressStatusDialogOpen, setBusinessAddressStatusDialogOpen] = useState(false)
  const [serviceStatusDialogOpen, setServiceStatusDialogOpen] = useState(false)

  const [registeredAgentDialogOpen, setRegisteredAgentDialogOpen] = useState(false)
  const [mailingAddressDialogOpen, setMailingAddressDialogOpen] = useState(false)
  const [einDialogOpen, setEinDialogOpen] = useState(false)
  const [itinDialogOpen, setItinDialogOpen] = useState(false)
  const [businessIdDialogOpen, setBusinessIdDialogOpen] = useState(false)
  const [uploadDocDialogOpen, setUploadDocDialogOpen] = useState(false)
  const [milestonesDialogOpen, setMilestonesDialogOpen] = useState(false)
  const [customMilestoneDialogOpen, setCustomMilestoneDialogOpen] = useState(false)

  const [taxModalOpen, setTaxModalOpen] = useState(false)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  const [einValue, setEinValue] = useState("")
  const [itinValue, setItinValue] = useState("")
  const [businessIdValue, setBusinessIdValue] = useState("")
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("")
  const [uploadDocType, setUploadDocType] = useState("general")

  const [mailingAddress, setMailingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  })

  const [agentForm, setAgentForm] = useState({
    name: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    servicePeriod: "1 Year",
  })

  const [milestones, setMilestones] = useState({
    orderProcessed: false,
    registeredAgentAssigned: false,
    mailingAddressIssued: false,
    formationCompleted: false,
    einProcessed: false,
    boiReportFiled: false,
  })

  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)

  const [editingCustomer, setEditingCustomer] = useState(false)
  const [editingCompany, setEditingCompany] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [companyForm, setCompanyForm] = useState({
    name: "",
    state: "",
    businessCategory: "",
    businessWebsite: "",
    businessDescription: "",
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

  const handleAddCustomMilestone = async () => {
    if (!newMilestoneTitle || !company) {
      toast({
        title: "Missing Information",
        description: "Please enter a milestone title",
        variant: "destructive",
      })
      return
    }

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const newMilestone = {
        id: Date.now().toString(),
        title: newMilestoneTitle,
        description: newMilestoneDescription || "",
        completed: false,
        createdAt: new Date().toISOString(),
      }

      const updatedCustomMilestones = [...(company.customMilestones || []), newMilestone]

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customMilestones: updatedCustomMilestones,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add custom milestone")
      }

      const result = await response.json()
      setCompany(result.data)
      setCustomMilestoneDialogOpen(false)

      setNewMilestoneTitle("")
      setNewMilestoneDescription("")

      toast({
        title: "Custom Milestone Added",
        description: `Successfully added "${newMilestone.title}"`,
      })
    } catch (error) {
      console.error("Error adding custom milestone:", error)
      toast({
        title: "Add Failed",
        description: "Failed to add custom milestone. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCustomMilestoneToggle = async (milestoneId: string) => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const previousCompany = { ...company }

      const updatedCustomMilestones = (company.customMilestones || []).map((m: any) =>
        m.id === milestoneId
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
          : m,
      )

      setCompany({
        ...company,
        customMilestones: updatedCustomMilestones,
      })

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customMilestones: updatedCustomMilestones,
        }),
      })

      if (!response.ok) {
        setCompany(previousCompany)
        throw new Error("Failed to update custom milestone")
      }

      const result = await response.json()
      setCompany(result.data)

      const milestone = updatedCustomMilestones.find((m) => m.id === milestoneId)
      toast({
        title: "Milestone Updated",
        description: `${milestone?.title} has been ${milestone?.completed ? "completed" : "uncompleted"}`,
      })
    } catch (error) {
      console.error("Error updating custom milestone:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update custom milestone. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCustomMilestone = async (milestoneId: string) => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const previousCompany = { ...company }

      const updatedCustomMilestones = (company.customMilestones || []).filter((m: any) => m.id !== milestoneId)

      setCompany({
        ...company,
        customMilestones: updatedCustomMilestones,
      })

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customMilestones: updatedCustomMilestones,
        }),
      })

      if (!response.ok) {
        setCompany(previousCompany)
        throw new Error("Failed to delete custom milestone")
      }

      const result = await response.json()
      setCompany(result.data)

      toast({
        title: "Milestone Deleted",
        description: "Custom milestone has been removed successfully",
      })
    } catch (error) {
      console.error("Error deleting custom milestone:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete custom milestone. Please try again.",
        variant: "destructive",
      })
    }
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

      setCustomerForm({
        name: customerData?.name || "",
        email: customerData?.email || "",
        phone: customerData?.phone || "",
      })

      setCompanyForm({
        name: foundCompany?.name || "",
        state: foundCompany?.state || "",
        businessCategory: foundCompany?.businessCategory || "",
        businessWebsite: foundCompany?.businessWebsite || "",
        businessDescription: foundCompany?.businessDescription || "",
      })

      if (foundCompany?.milestones) {
        setMilestones({
          orderProcessed: foundCompany.milestones.orderProcessed === true,
          registeredAgentAssigned: foundCompany.milestones.registeredAgentAssigned === true,
          mailingAddressIssued: foundCompany.milestones.mailingAddressIssued === true,
          formationCompleted: foundCompany.milestones.formationCompleted === true,
          einProcessed: foundCompany.milestones.einProcessed === true,
          boiReportFiled: foundCompany.milestones.boiReportFiled === true,
        })
      } else {
        setMilestones({
          orderProcessed: false,
          registeredAgentAssigned: false,
          mailingAddressIssued: false,
          formationCompleted: false,
          einProcessed: false,
          boiReportFiled: false,
        })
      }

      if (foundCompany?.registeredAgent) {
        const agent = foundCompany.registeredAgent
        setAgentForm({
          name: agent.name || "",
          company: agent.company || "",
          address: agent.address || "",
          city: agent.city || "",
          state: agent.state || "",
          zip: agent.zip || "",
          phone: agent.phone || "",
          email: agent.email || "",
          servicePeriod: agent.servicePeriod || "1 Year",
        })
      }

      if (foundCompany?.mailingAddress) {
        const address = foundCompany.mailingAddress
        setMailingAddress({
          street: address.street || "",
          city: address.city || "",
          state: address.state || "",
          zip: address.zip || "",
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
      console.error("Error loading order data:", error)
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
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
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
      console.error("Error deleting order:", error)
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg font-semibold">{error}</p>
        <Button onClick={() => router.push("/admin/orders")} variant="outline">
          Back to Orders
        </Button>
      </div>
    )
  }

  if (!order || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Order data not available</p>
      </div>
    )
  }

  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const totalMilestones = Object.keys(milestones).length
  const progressPercentage = (completedMilestones / totalMilestones) * 100

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/orders")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-600">Order ID: {order.id}</p>
            </div>
          </div>
          <StatusBadge status={order.status || "pending"} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle>Customer Information</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-600 text-sm">Customer Name</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{customer?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm">Email Address</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{customer?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm">Phone Number</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{customer?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm">Account Status</Label>
                    <div className="mt-1">
                      <Badge
                        className={
                          customer?.accountStatus === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {customer?.accountStatus || "inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle>Company Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-600 text-sm">Company Name</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{company.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm">State of Formation</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{company.state || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm">Business Category</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {getDisplayValue(company.businessCategory)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm">Entity Type</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{company.entityType || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600 text-sm">Business Description</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {getDisplayValue(company.businessDescription, "Not provided")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Identifiers */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle>Business Identifiers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-gray-600 text-sm">EIN Number</Label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {hasEIN ? formatEIN(company.ein, true) : "Not Yet"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEinDialogOpen(true)} disabled={einUpdating}>
                      Update
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-gray-600 text-sm">Business ID</Label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {hasBusinessId ? formatBusinessId(company.businessId) : "Not Yet"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBusinessIdDialogOpen(true)}
                      disabled={businessIdUpdating}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle>Addresses</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Registered Agent */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Registered Agent</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRegisteredAgentDialogOpen(true)}
                        disabled={agentUpdating}
                      >
                        {hasRegisteredAgent ? "Update" : "Add"}
                      </Button>
                    </div>
                    {hasRegisteredAgent ? (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">{company.registeredAgent.name}</span>
                        </p>
                        <p className="text-gray-600">
                          {company.registeredAgent.address}, {company.registeredAgent.city},{" "}
                          {company.registeredAgent.state} {company.registeredAgent.zip}
                        </p>
                        <p className="text-gray-600">{company.registeredAgent.email}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not yet assigned</p>
                    )}
                  </div>

                  {/* Mailing Address */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Mailing Address</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMailingAddressDialogOpen(true)}
                        disabled={addressUpdating}
                      >
                        {hasMailingAddress ? "Update" : "Add"}
                      </Button>
                    </div>
                    {hasMailingAddress ? (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                        <p className="text-gray-600">
                          {company.mailingAddress.street}, {company.mailingAddress.city}, {company.mailingAddress.state}{" "}
                          {company.mailingAddress.zip}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not yet assigned</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Owners/Members */}
            {company.members && company.members.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle>Business Owners / Members</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {company.members.map((member: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{member.name || `Member ${idx + 1}`}</h4>
                          {member.needsItin && (
                            <Badge variant="outline" className="bg-yellow-50">
                              Needs ITIN
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            Address: {member.address}, {member.city}, {member.state} {member.zip}
                          </p>
                          {member.passportKey && (
                            <p className="text-blue-600">
                              <a href="#" className="underline">
                                View Document
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-ons */}
            {addons && addons.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-500 rounded-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle>Purchased Add-ons</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {addons.map((addon: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{getAddonName(addon.id || addon.serviceId)}</span>
                        {addon.price && <span className="text-gray-600">${addon.price}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-1 space-y-6">
            {/* Order Status */}
            <Card className="overflow-hidden border-0 shadow-md sticky top-8">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-600 text-sm mb-2 block">Current Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
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
                    {statusUpdating ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Progress */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b">
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {completedMilestones} of {totalMilestones} completed
                      </span>
                      <span className="text-sm font-bold text-primary">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    {Object.entries(milestones).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {value ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${value ? "text-green-700 font-medium" : "text-gray-600"}`}>
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                            .replace(/^./, (s) => s.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date</span>
                    <span className="font-semibold">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold">${order.totalAmount || order.total || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <Badge variant="outline" className="bg-green-50">
                      {order.paymentStatus || "pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold">{order.paymentMethod || "N/A"}</span>
                  </div>
                  {order.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="font-mono text-xs">{order.transactionId.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="overflow-hidden border-0 shadow-md border-l-4 border-red-500">
              <CardHeader className="bg-red-50 border-b">
                <CardTitle className="text-lg text-red-700">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </Button>
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
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialogs - Existing code ... */}
    </main>
  )
}
