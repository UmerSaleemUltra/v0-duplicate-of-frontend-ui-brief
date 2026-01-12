"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Users, Building2, CheckCircle2, Clock, Loader2 } from "lucide-react"
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
      console.error("Error loading order:", error)
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
        description: `Order status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {loading && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && order && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="text-sm text-gray-500">Order ID: {order.id}</p>
            </div>
            <Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <p className="mt-1">{customer?.name || "N/A"}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="mt-1">{customer?.email || "N/A"}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="mt-1">{customer?.phone || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <p className="mt-1">{company?.name || "N/A"}</p>
                </div>
                <div>
                  <Label>State</Label>
                  <p className="mt-1">{company?.state || "N/A"}</p>
                </div>
                <div>
                  <Label>EIN</Label>
                  <p className="mt-1">{hasEIN ? formatEIN(company?.ein, true) : "Not Yet"}</p>
                </div>
                <div>
                  <Label>Business ID</Label>
                  <p className="mt-1">{hasBusinessId ? formatBusinessId(company?.businessId) : "Not Yet"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(milestones).map(([key, completed]) => (
                <div key={key} className="flex items-center gap-2">
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-300" />
                  )}
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
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
              <Button onClick={handleStatusUpdate} disabled={statusUpdating}>
                {statusUpdating ? "Updating..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>

          {company?.members && company.members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Business Owners/Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.members.map((member: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{member.name || "Unknown Member"}</p>
                        {member.isResponsiblePerson && (
                          <Badge className="mt-1 bg-blue-100 text-blue-800">Responsible Person</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
