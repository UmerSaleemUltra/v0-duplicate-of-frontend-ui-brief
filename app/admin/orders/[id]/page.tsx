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
  ArrowLeft,
  Package,
  User,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Hash,
  UserCheck,
  Loader2,
  MapPin,
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

  const [agentStatusModalOpen, setAgentStatusModalOpen] = useState(false)
  const [addressStatusModalOpen, setAddressStatusModalOpen] = useState(false)
  const [serviceStatusModalOpen, setServiceStatusModalOpen] = useState(false)

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
      console.log("[v0] Error adding custom milestone:", error)
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
      console.log("[v0] Error updating custom milestone:", error)
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
      console.log("[v0] Error deleting custom milestone:", error)
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

      console.log("[v0] Loading order data for ID:", orderId)

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Order not found")
        }
        throw new Error(`Failed to load order: ${response.status}`)
      }

      const result = await response.json()
      const orderData = result.data

      if (!orderData) {
        throw new Error("Order data not found")
      }

      console.log("[v0] Order data loaded successfully:", orderData)

      setOrder(orderData)
      setCompany(orderData.company)
      setCustomer(
        orderData.user || {
          name: orderData.company?.members?.[0]?.name || "Unknown User",
          email: orderData.company?.members?.[0]?.email || "N/A",
          phone: orderData.company?.members?.[0]?.phone || "N/A",
        },
      )
      setUser(orderData.user)
      setPassportDocuments(orderData.passportDocuments || [])

      setCustomerForm({
        name: orderData.user?.name || orderData.company?.members?.[0]?.name || "",
        email: orderData.user?.email || orderData.company?.members?.[0]?.email || "",
        phone: orderData.user?.phone || orderData.company?.members?.[0]?.phone || "",
      })

      setCompanyForm({
        name: orderData.company?.name || "",
        state: orderData.company?.state || "",
        businessCategory: orderData.company?.businessCategory || "",
        businessWebsite: orderData.company?.businessWebsite || "",
        businessDescription: orderData.company?.businessDescription || "",
      })

      if (orderData.company?.milestones) {
        console.log("[v0] Initializing milestones from company data:", orderData.company.milestones)
        setMilestones({
          orderProcessed: orderData.company.milestones.orderProcessed || false,
          registeredAgentAssigned: orderData.company.milestones.registeredAgentAssigned || false,
          mailingAddressIssued: orderData.company.milestones.mailingAddressIssued || false,
          formationCompleted: orderData.company.milestones.formationCompleted || false,
          einProcessed: orderData.company.milestones.einProcessed || false,
          boiReportFiled: orderData.company.milestones.boiReportFiled || false,
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

      if (orderData.company?.registeredAgent) {
        const agent = orderData.company.registeredAgent
        console.log("[v0] Pre-populating registered agent form:", agent)
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

      if (orderData.company?.mailingAddress) {
        const address = orderData.company.mailingAddress
        console.log("[v0] Pre-populating mailing address form:", address)
        setMailingAddress({
          street: address.street || "",
          city: address.city || "",
          state: address.state || "",
          zip: address.zip || "",
        })
      }

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
      setNewStatus(orderData.status || "")
      setError(null)
    } catch (error) {
      console.error("[v0] Error loading order:", error)
      setError(error instanceof Error ? error.message : "Failed to load order")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load order data",
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

      const updatedOrders = (company.orders || []).map((o: any) =>
        o.id === order.id ? { ...o, status: newStatus } : o,
      )

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orders: updatedOrders,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      const result = await response.json()
      setCompany(result.data)

      const updatedOrder = updatedOrders.find((o: any) => o.id === order.id)
      setOrder(updatedOrder)

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      console.log("[v0] Error updating status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !order || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error || "Order not found"}</p>
            <Button onClick={() => router.push("/admin/orders")} className="w-full mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/orders")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Name</Label>
                    <p className="font-medium">{getDisplayValue(customer?.name)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Email</Label>
                    <p className="font-medium">{getDisplayValue(customer?.email)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600 dark:text-gray-400">Phone</Label>
                    <p className="font-medium">{getDisplayValue(customer?.phone)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Company Name</Label>
                    <p className="font-medium">{getDisplayValue(company?.name)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">State</Label>
                    <p className="font-medium">{getDisplayValue(company?.state)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600 dark:text-gray-400">Business Category</Label>
                    <p className="font-medium">{getDisplayValue(company?.businessCategory)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600 dark:text-gray-400">Business Description</Label>
                    <p className="font-medium text-sm">{getDisplayValue(company?.businessDescription)}</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">EIN</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {hasEIN ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="font-medium">{formatEIN(company?.ein, true)}</p>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <p className="font-medium">Not Yet</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Business ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {hasBusinessId ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="font-medium">{formatBusinessId(company?.businessId)}</p>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <p className="font-medium">Not Yet</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registered Agent */}
            {hasRegisteredAgent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Registered Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">Name</Label>
                      <p className="font-medium">{getDisplayValue(company?.registeredAgent?.name)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">Company</Label>
                      <p className="font-medium">{getDisplayValue(company?.registeredAgent?.company)}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-600 dark:text-gray-400">Address</Label>
                      <p className="font-medium">{getDisplayValue(company?.registeredAgent?.address)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">City, State Zip</Label>
                      <p className="font-medium">
                        {getDisplayValue(company?.registeredAgent?.city)},{" "}
                        {getDisplayValue(company?.registeredAgent?.state)}{" "}
                        {getDisplayValue(company?.registeredAgent?.zip)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">Phone</Label>
                      <p className="font-medium">{getDisplayValue(company?.registeredAgent?.phone)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mailing Address */}
            {hasMailingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Mailing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-gray-600 dark:text-gray-400">Street</Label>
                      <p className="font-medium">{getDisplayValue(company?.mailingAddress?.street)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">City</Label>
                      <p className="font-medium">{getDisplayValue(company?.mailingAddress?.city)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">State</Label>
                      <p className="font-medium">{getDisplayValue(company?.mailingAddress?.state)}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-600 dark:text-gray-400">ZIP</Label>
                      <p className="font-medium">{getDisplayValue(company?.mailingAddress?.zip)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Owners/Members */}
            {company?.members && company.members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Business Owners / Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.members.map((member: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{getDisplayValue(member.name)}</p>
                          {member.isResponsiblePerson && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Responsible
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <Label className="text-gray-600 dark:text-gray-400">Address</Label>
                            <p className="font-medium">{getDisplayValue(member.address)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600 dark:text-gray-400">City, State</Label>
                            <p className="font-medium">
                              {getDisplayValue(member.city)}, {getDisplayValue(member.state)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-gray-600 dark:text-gray-400">ZIP</Label>
                            <p className="font-medium">{getDisplayValue(member.zip)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-ons */}
            {addons && addons.length > 0 && (
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
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <span className="font-medium">
                          {getAddonName(typeof addon === "string" ? addon : addon.serviceId || addon.id)}
                        </span>
                        <Badge variant="secondary">Added</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status & Summary */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Current Status</Label>
                  <Badge className="mt-2">{order.status}</Badge>
                </div>
                <div>
                  <Label htmlFor="status-select" className="text-gray-600 dark:text-gray-400">
                    Update Status
                  </Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="status-select" className="mt-2">
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

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order Date</span>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Package Price</span>
                  <span className="font-medium">${(order.amount || 0)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                  <span className="font-medium capitalize">{order.paymentMethod || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Status</span>
                  <Badge variant={order.paymentStatus === "completed" ? "default" : "secondary"}>
                    {order.paymentStatus || "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(milestones).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    {value ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
