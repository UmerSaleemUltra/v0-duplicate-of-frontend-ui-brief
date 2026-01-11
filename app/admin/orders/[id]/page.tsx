"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  UserCheck,
  Loader2,
  MapPin,
  Trash2,
  Receipt,
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
  const [orderNotes, setOrderNotes] = useState("")
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesUpdating, setNotesUpdating] = useState(false)

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
      console.error("[v0] Error adding custom milestone:", error)
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
      console.error("[v0] Error updating custom milestone:", error)
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
      console.error("[v0] Error deleting custom milestone:", error)
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
          orderProcessed: foundCompany.milestones.orderProcessed || false,
          registeredAgentAssigned: foundCompany.milestones.registeredAgentAssigned || false,
          mailingAddressIssued: foundCompany.milestones.mailingAddressIssued || false,
          formationCompleted: foundCompany.milestones.formationCompleted || false,
          einProcessed: foundCompany.milestones.einProcessed || false,
          boiReportFiled: foundCompany.milestones.boiReportFiled || false,
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
      setOrderNotes(foundOrder.notes || "")
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order || !company) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Order details not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const totalMilestones = Object.values(milestones).length
  const milestonePercentage = Math.round((completedMilestones / totalMilestones) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/orders")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order Details</h1>
              <p className="text-sm text-gray-600">Order ID: {order.id}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Order
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(!editingCustomer)}>
                  {editingCustomer ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingCustomer ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={async () => {
                        // Add customer update logic here
                        setEditingCustomer(false)
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{getDisplayValue(customer?.name)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{getDisplayValue(customer?.email)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{getDisplayValue(customer?.phone)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <Badge variant={customer?.accountStatus === "active" ? "default" : "secondary"}>
                        {customer?.accountStatus || "N/A"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-semibold">{getDisplayValue(company.name)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State of Formation</p>
                    <p className="font-semibold">{getDisplayValue(company.state)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entity Type</p>
                    <p className="font-semibold">{getDisplayValue(company.entityType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Package Type</p>
                    <Badge variant="outline">{getDisplayValue(company.packageType)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Business Description</p>
                  <p className="text-sm">{getDisplayValue(company.businessDescription)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Business Category</p>
                    <p className="font-semibold">{getDisplayValue(company.businessCategory)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Business Website</p>
                    <a
                      href={company.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {getDisplayValue(company.businessWebsite)}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Identifiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Business Identifiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">EIN Number</p>
                    <p className="font-semibold">{hasEIN ? formatEIN(company.ein, true) : "Not Yet"}</p>
                  </div>
                  <Button size="sm" onClick={() => setEinDialogOpen(true)}>
                    Update
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Business ID</p>
                    <p className="font-semibold">{hasBusinessId ? formatBusinessId(company.businessId) : "Not Yet"}</p>
                  </div>
                  <Button size="sm" onClick={() => setBusinessIdDialogOpen(true)}>
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            {hasRegisteredAgent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Registered Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <span className="text-gray-600">Name:</span> {company.registeredAgent?.name}
                  </p>
                  <p>
                    <span className="text-gray-600">Company:</span> {company.registeredAgent?.company || "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-600">Address:</span> {company.registeredAgent?.address},{" "}
                    {company.registeredAgent?.city}, {company.registeredAgent?.state} {company.registeredAgent?.zip}
                  </p>
                </CardContent>
              </Card>
            )}

            {hasMailingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Mailing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{company.mailingAddress?.street}</p>
                  <p>
                    {company.mailingAddress?.city}, {company.mailingAddress?.state} {company.mailingAddress?.zip}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Business Owners */}
            {company.members && company.members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Business Owners / Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.members.map((member: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{member.name || "N/A"}</p>
                          <p className="text-sm text-gray-600">{member.address || "N/A"}</p>
                          {member.needsItin && (
                            <Badge className="mt-2" variant="secondary">
                              ITIN Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Purchased Add-ons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {addons.map((addon: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span>{getAddonName(typeof addon === "string" ? addon : addon.serviceId || addon.id)}</span>
                        <Badge variant="outline">Added</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditingNotes(!editingNotes)}>
                  {editingNotes ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingNotes ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Enter notes here"
                        className="resize-none"
                      />
                    </div>
                    <Button className="w-full" onClick={handleSaveNotes} disabled={notesUpdating}>
                      {notesUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="text-sm">{getDisplayValue(orderNotes)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  <Badge className="text-base py-1">{order.status || "Pending"}</Badge>
                </div>
                <div>
                  <Label>Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => handleStatusUpdate()}>
                  Update Status
                </Button>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold">{getDisplayValue(order.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge variant={order.paymentStatus === "completed" ? "default" : "secondary"}>
                    {order.paymentStatus || "Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order & Pricing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Price</span>
                  <span className="font-semibold">${order.packagePrice || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Add-ons Total</span>
                  <span className="font-semibold">${order.addonsTotal || "0.00"}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-bold text-blue-600">${order.totalAmount || "0.00"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {Object.entries(milestones).map(([key, completed]: [string, any]) => (
                    <div key={key} className="flex items-center gap-3">
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={completed ? "text-green-600" : "text-gray-600"}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
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

      {/* EIN Modal */}
      <Dialog open={einDialogOpen} onOpenChange={setEinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update EIN Number</DialogTitle>
            <DialogDescription>Enter the EIN number for the company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="ein">EIN Number</Label>
            <Input
              id="ein"
              value={einValue}
              onChange={(e) => setEinValue(e.target.value)}
              placeholder="e.g., 12-3456789"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEinDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!einValue || !company) return
                setEinUpdating(true)
                try {
                  const token = authService.getToken()
                  if (!token) router.push("/login")

                  const response = await fetch(`/api/companies/${company.id}`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ ein: einValue }),
                  })
                  if (!response.ok) throw new Error("Failed to update EIN")

                  const result = await response.json()
                  setCompany(result.data)
                  setEinDialogOpen(false)
                  toast({ title: "Success", description: "EIN updated successfully" })
                } catch (error) {
                  console.error(error)
                  toast({ title: "Error", description: "Failed to update EIN", variant: "destructive" })
                } finally {
                  setEinUpdating(false)
                }
              }}
              disabled={einUpdating}
            >
              {einUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business ID Modal */}
      <Dialog open={businessIdDialogOpen} onOpenChange={setBusinessIdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Business ID</DialogTitle>
            <DialogDescription>Enter the Business ID for the company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="businessId">Business ID</Label>
            <Input
              id="businessId"
              value={businessIdValue}
              onChange={(e) => setBusinessIdValue(e.target.value)}
              placeholder="e.g., BIZ-12345"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBusinessIdDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!businessIdValue || !company) return
                setBusinessIdUpdating(true)
                try {
                  const token = authService.getToken()
                  if (!token) router.push("/login")

                  const response = await fetch(`/api/companies/${company.id}`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ businessId: businessIdValue }),
                  })
                  if (!response.ok) throw new Error("Failed to update Business ID")

                  const result = await response.json()
                  setCompany(result.data)
                  setBusinessIdDialogOpen(false)
                  toast({ title: "Success", description: "Business ID updated successfully" })
                } catch (error) {
                  console.error(error)
                  toast({ title: "Error", description: "Failed to update Business ID", variant: "destructive" })
                } finally {
                  setBusinessIdUpdating(false)
                }
              }}
              disabled={businessIdUpdating}
            >
              {businessIdUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
