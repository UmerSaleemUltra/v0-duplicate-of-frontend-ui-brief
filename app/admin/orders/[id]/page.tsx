"use client"
import { StatusUpdateModal } from "@/components/status-update-modal"
import { AdminManualDataModal } from "@/components/admin-manual-data-modal"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileBarChart,
  Loader2,
  MapPin,
  Trash2,
  Receipt,
  Calendar,
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
    return includeHyphen ? `${cleaned.substring(0, 2)}-${cleaned.substring(2, 7)}` : cleaned
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

const safeToFixed = (value: any, decimals = 2): string => {
  if (value === null || value === undefined || value === "") return "0.00"
  const num = Number.parseFloat(String(value))
  if (isNaN(num)) return "0.00"
  return num.toFixed(decimals)
}

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "processing":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return <Clock className="w-4 h-4" />
    case "processing":
      return <Loader2 className="w-4 h-4 animate-spin" />
    case "completed":
      return <CheckCircle2 className="w-4 h-4" />
    case "cancelled":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
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

  const completedDefaultMilestones = Object.values(milestones).filter(Boolean).length
  const totalDefaultMilestones = Object.keys(milestones).length
  const completedMilestonesWithCustom =
    completedDefaultMilestones + ((company?.customMilestones || []).filter((m: any) => m.completed).length || 0)
  const totalMilestonesWithCustom = totalDefaultMilestones + ((company?.customMilestones || []).length || 0)
  const completionPercentage =
    totalMilestonesWithCustom > 0 ? Math.round((completedMilestonesWithCustom / totalMilestonesWithCustom) * 100) : 0

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
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAssignRegisteredAgent = async () => {
    if (!company || !agentForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter registered agent name",
        variant: "destructive",
      })
      return
    }

    setAgentUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registeredAgent: agentForm,
          milestones: {
            ...milestones,
            registeredAgentAssigned: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign registered agent")
      }

      const result = await response.json()
      setCompany(result.data)
      setMilestones({ ...milestones, registeredAgentAssigned: true })
      setRegisteredAgentDialogOpen(false)

      toast({
        title: "Registered Agent Assigned",
        description: "Successfully assigned registered agent",
      })
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign registered agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAgentUpdating(false)
    }
  }

  const handleAssignMailingAddress = async () => {
    if (!company || !mailingAddress.street || !mailingAddress.city || !mailingAddress.state || !mailingAddress.zip) {
      toast({
        title: "Missing Information",
        description: "Please fill in all address fields",
        variant: "destructive",
      })
      return
    }

    setAddressUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mailingAddress,
          milestones: {
            ...milestones,
            mailingAddressIssued: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign mailing address")
      }

      const result = await response.json()
      setCompany(result.data)
      setMilestones({ ...milestones, mailingAddressIssued: true })
      setMailingAddressDialogOpen(false)

      toast({
        title: "Mailing Address Assigned",
        description: "Successfully assigned business mailing address",
      })
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign mailing address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddressUpdating(false)
    }
  }

  const handleAssignEIN = async () => {
    if (!company || !einValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter EIN",
        variant: "destructive",
      })
      return
    }

    setEinUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ein: einValue,
          milestones: {
            ...milestones,
            einProcessed: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign EIN")
      }

      const result = await response.json()
      setCompany(result.data)
      setMilestones({ ...milestones, einProcessed: true })
      setEinDialogOpen(false)
      setEinValue("")

      toast({
        title: "EIN Assigned",
        description: "Successfully assigned EIN",
      })
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign EIN. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEinUpdating(false)
    }
  }

  const handleAssignITIN = async () => {
    if (!company || !itinValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter ITIN",
        variant: "destructive",
      })
      return
    }

    setItinUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itin: itinValue,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign ITIN")
      }

      const result = await response.json()
      setCompany(result.data)
      setItinDialogOpen(false)
      setItinValue("")

      toast({
        title: "ITIN Assigned",
        description: "Successfully assigned ITIN",
      })
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign ITIN. Please try again.",
        variant: "destructive",
      })
    } finally {
      setItinUpdating(false)
    }
  }

  const handleAssignBusinessId = async () => {
    if (!company || !businessIdValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter Business ID",
        variant: "destructive",
      })
      return
    }

    setBusinessIdUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: businessIdValue,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign Business ID")
      }

      const result = await response.json()
      setCompany(result.data)
      setBusinessIdDialogOpen(false)
      setBusinessIdValue("")

      toast({
        title: "Business ID Assigned",
        description: "Successfully assigned Business ID",
      })
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign Business ID. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusinessIdUpdating(false)
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
        title: "Order Deleted",
        description: "Order has been successfully deleted",
      })

      router.push("/admin/orders")
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleCloseEinDialog = () => {
    setEinDialogOpen(false)
    setEinValue("")
  }

  const handleCloseItinDialog = () => {
    setItinDialogOpen(false)
    setItinValue("")
  }

  const handleCloseBusinessIdDialog = () => {
    setBusinessIdDialogOpen(false)
    setBusinessIdValue("")
  }

  const handleCloseMailingAddressDialog = () => {
    setMailingAddressDialogOpen(false)
  }

  const handleUpdateCompanyStatus = async (newStatus: string) => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setStatusUpdating(true)
      const token = authService.getToken()

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType: "companyStatus",
          statusValue: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update company status")
      }

      const result = await response.json()

      setCompany(result.data)
      setCompanyStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: "Company status has been updated successfully",
      })

      await loadOrderData()
    } catch (error) {
      console.error("Error updating company status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update company status",
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleUpdateRegisteredAgentStatus = async (newStatus: string) => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setAgentUpdating(true)
      const token = authService.getToken()

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType: "registeredAgentStatus",
          statusValue: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update registered agent status")
      }

      const result = await response.json()
      setCompany(result.data)
      setRegisteredAgentStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: "Registered agent status has been updated successfully",
      })

      await loadOrderData()
    } catch (error) {
      console.error("Error updating registered agent status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update registered agent status",
        variant: "destructive",
      })
    } finally {
      setAgentUpdating(false)
    }
  }

  const handleUpdateBusinessAddressStatus = async (newStatus: string) => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setAddressUpdating(true)
      const token = authService.getToken()

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType: "businessAddressStatus",
          statusValue: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update business address status")
      }

      const result = await response.json()
      setCompany(result.data)
      setBusinessAddressStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: "Business address status has been updated successfully",
      })

      await loadOrderData()
    } catch (error) {
      console.error("Error updating business address status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update business address status",
        variant: "destructive",
      })
    } finally {
      setAddressUpdating(false)
    }
  }

  const handleUpdateServiceStatus = async (newStatus: string) => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company ID not found",
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

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType: "serviceStatus",
          statusValue: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update service status")
      }

      const result = await response.json()
      setCompany(result.data)
      setServiceStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: "Service status has been updated successfully",
      })

      await loadOrderData()
    } catch (error) {
      console.error("Error updating service status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update service status",
        variant: "destructive",
      })
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
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/admin/orders")} className="h-10 w-10 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Error</h1>
            <p className="text-slate-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order || !company) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/orders")}
            className="h-10 w-10 p-0 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Order Details</h1>
            <p className="text-slate-600 mt-1">Order ID: {order.id}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Information Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Customer Name</p>
                  <p className="text-sm font-medium text-slate-900">{customer?.name || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-slate-900">{customer?.email || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-slate-900">{customer?.phone || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Account Status</p>
                  <Badge variant={user?.accountStatus === "active" ? "default" : "secondary"}>
                    {user?.accountStatus || "Incomplete"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Current Status</Label>
                <div className="mt-2">
                  <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm flex items-center gap-2 w-fit`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={statusUpdating || !newStatus || newStatus === order.status}
                  className="bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                >
                  {statusUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formation Progress */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Formation Progress
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                {completedDefaultMilestones} of {totalDefaultMilestones} core milestones completed (
                {completionPercentage}%)
                {company?.customMilestones && company.customMilestones.length > 0 && (
                  <span className="text-slate-500">
                    {" "}
                    • {completedMilestonesWithCustom} of {totalMilestonesWithCustom} total
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full transition-all duration-700"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {/* Milestone List */}
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.orderProcessed ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${milestones.orderProcessed ? "text-green-600" : "text-slate-400"}`} />
                    <span
                      className={`text-sm font-medium ${milestones.orderProcessed ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Order Successfully Processed
                    </span>
                  </div>
                  {milestones.orderProcessed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.registeredAgentAssigned ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck
                      className={`w-5 h-5 ${milestones.registeredAgentAssigned ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${milestones.registeredAgentAssigned ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Registered Agent Assigned
                    </span>
                  </div>
                  {milestones.registeredAgentAssigned ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.mailingAddressIssued ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <Home
                      className={`w-5 h-5 ${milestones.mailingAddressIssued ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${milestones.mailingAddressIssued ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Business Mailing Address Issued
                    </span>
                  </div>
                  {milestones.mailingAddressIssued ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.formationCompleted ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck
                      className={`w-5 h-5 ${milestones.formationCompleted ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${milestones.formationCompleted ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Company Formation Completed
                    </span>
                  </div>
                  {milestones.formationCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.einProcessed ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <HashIcon className={`w-5 h-5 ${milestones.einProcessed ? "text-green-600" : "text-slate-400"}`} />
                    <span
                      className={`text-sm font-medium ${milestones.einProcessed ? "text-slate-900" : "text-slate-600"}`}
                    >
                      EIN Successfully Processed
                    </span>
                  </div>
                  {milestones.einProcessed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.boiReportFiled ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <FileBarChart
                      className={`w-5 h-5 ${milestones.boiReportFiled ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${milestones.boiReportFiled ? "text-slate-900" : "text-slate-600"}`}
                    >
                      BOI Report Filed
                    </span>
                  </div>
                  {milestones.boiReportFiled ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {company?.customMilestones && company.customMilestones.length > 0 && (
                  <>
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Custom Milestones
                      </p>
                    </div>
                    {company.customMilestones.map((milestone: any) => (
                      <div
                        key={milestone.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${milestone.completed ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileCheck
                            className={`w-5 h-5 ${milestone.completed ? "text-green-600" : "text-slate-400"}`}
                          />
                          <div>
                            <span
                              className={`text-sm font-medium ${milestone.completed ? "text-slate-900" : "text-slate-600"}`}
                            >
                              {milestone.title}
                            </span>
                            {milestone.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCustomMilestoneToggle(milestone.id)}
                            className="h-8 w-8 p-0"
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-slate-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomMilestone(milestone.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Company Name</p>
                    <p className="text-sm font-medium text-slate-900">{company.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">State of Formation</p>
                    <p className="text-sm font-medium text-slate-900">{company.state}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Entity Type</p>
                    <p className="text-sm font-medium text-slate-900">{company.type || company.entityType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Business Category</p>
                    <p className="text-sm font-medium text-slate-900">{company.businessCategory || "Not provided"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Package Type</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {company.packageType || "Starter"}
                    </Badge>
                  </div>
                  {company.businessWebsite && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">Business Website</p>
                      <a
                        href={
                          company.businessWebsite.startsWith("http")
                            ? company.businessWebsite
                            : `https://${company.businessWebsite}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {company.businessWebsite}
                      </a>
                    </div>
                  )}
                </div>

                {company.businessDescription && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">Business Description</p>
                    <p className="text-sm text-slate-900 leading-relaxed">{company.businessDescription}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {company?.members && company.members.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Business Owners / Members
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {company.members.length} member{company.members.length !== 1 ? "s" : ""} registered
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.members.map((member: any, index: number) => (
                    <div
                      key={member.id || index}
                      className={`p-4 rounded-lg border border-slate-200 ${member.responsiblePerson ? "bg-blue-50 border-blue-300" : "bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{member.name || "N/A"}</h3>
                            {member.responsiblePerson && (
                              <Badge variant="secondary" className="mt-1 text-xs bg-blue-200 text-blue-800">
                                Responsible Person
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Member {index + 1}
                        </Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mt-3">
                        {member.ssn && (
                          <div>
                            <p className="text-xs text-slate-600">SSN/ITIN</p>
                            <p className="text-sm font-medium text-slate-900">
                              {member.ssn.length > 4 ? `***-**-${member.ssn.slice(-4)}` : "Provided"}
                            </p>
                          </div>
                        )}
                        {member.address && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-slate-600">Address</p>
                            <p className="text-sm font-medium text-slate-900">
                              {member.address}
                              {member.city && `, ${member.city}`}
                              {member.state && `, ${member.state}`}
                              {member.zip && ` ${member.zip}`}
                              {member.country && `, ${member.country}`}
                            </p>
                          </div>
                        )}
                        {member.itinAdded && (
                          <div className="sm:col-span-2">
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                              ITIN Application Requested
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Order & Pricing Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Package Price</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${safeToFixed(order?.pricing?.packagePrice || order?.packagePrice || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">State Filing Fee</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${safeToFixed(order?.pricing?.stateFilingFee || order?.stateFilingFee || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Add-ons Total</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${safeToFixed(order?.pricing?.addonsTotal || order?.addonsTotal || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] border border-slate-200">
                    <p className="text-xs text-white mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-white">
                      ${safeToFixed(order?.pricing?.total || order?.pricing?.totalAmount || order?.amount || 0)}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Method</p>
                      <p className="text-sm font-medium text-slate-900 capitalize">
                        {order?.paymentInfo?.method || order?.paymentMethod || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Status</p>
                      <Badge variant={order?.paymentInfo?.status === "paid" ? "default" : "secondary"}>
                        {order?.paymentInfo?.status || "Pending"}
                      </Badge>
                    </div>
                    {order?.paymentInfo?.transactionReference && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-600 mb-1">Transaction Reference</p>
                        <p className="text-sm font-medium text-slate-900 font-mono">
                          {order.paymentInfo.transactionReference}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <div>
                      <p className="text-xs text-slate-600">Order Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {order?.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Business Identifiers Card */}
          <Card className="bg-white border-slate-200 shadow-sm sticky top-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Business Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600">EIN</p>
                  <Button variant="ghost" size="sm" onClick={() => setEinDialogOpen(true)} className="h-7 px-2 text-xs">
                    {hasEIN ? "Update" : "Assign"}
                  </Button>
                </div>
                {hasEIN ? (
                  <p className="text-sm font-bold text-slate-900">{formatEIN(company.ein, true)}</p>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800 text-xs">
                    Not Yet
                  </Badge>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600">Business ID</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBusinessIdDialogOpen(true)}
                    className="h-7 px-2 text-xs"
                  >
                    {hasBusinessId ? "Update" : "Assign"}
                  </Button>
                </div>
                {hasBusinessId ? (
                  <p className="text-sm font-bold text-slate-900">{formatBusinessId(company.businessId)}</p>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800 text-xs">
                    Not Yet
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Registered Agent Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Registered Agent
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRegisteredAgentDialogOpen(true)}
                  className="h-7 px-2 text-xs"
                >
                  {hasRegisteredAgent ? "Update" : "Assign"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hasRegisteredAgent ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-600">Name</p>
                    <p className="font-medium text-slate-900">{company.registeredAgent.name}</p>
                  </div>
                  {company.registeredAgent.company && (
                    <div>
                      <p className="text-xs text-slate-600">Company</p>
                      <p className="font-medium text-slate-900">{company.registeredAgent.company}</p>
                    </div>
                  )}
                  {company.registeredAgent.email && (
                    <div>
                      <p className="text-xs text-slate-600">Email</p>
                      <p className="font-medium text-slate-900">{company.registeredAgent.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800 text-xs">
                  Not Yet Assigned
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Mailing Address Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Mailing Address
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMailingAddressDialogOpen(true)}
                  className="h-7 px-2 text-xs"
                >
                  {hasMailingAddress ? "Update" : "Assign"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hasMailingAddress ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-slate-900">{company.mailingAddress.street}</p>
                  <p className="text-slate-600">
                    {company.mailingAddress.city}, {company.mailingAddress.state} {company.mailingAddress.zip}
                  </p>
                </div>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800 text-xs">
                  Not Yet Assigned
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Add-ons Card */}
          {addons.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Purchased Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {addons.map((addon: any, index: number) => (
                    <div key={index} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs font-medium text-slate-600">{getAddonName(addon.id || addon)}</p>
                      {addon.price && <p className="text-sm font-bold text-slate-900">${safeToFixed(addon.price)}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Order Card */}
          <Card className="bg-white border-red-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-red-900">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={registeredAgentDialogOpen} onOpenChange={setRegisteredAgentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#dc2626]" />
              Assign Registered Agent
            </DialogTitle>
            <DialogDescription>
              Assign a registered agent to {company?.name}. This will be displayed on company documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agentName">Name *</Label>
              <Input
                id="agentName"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                placeholder="John Doe"
                disabled={agentUpdating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agentCompany">Company Name</Label>
              <Input
                id="agentCompany"
                value={agentForm.company}
                onChange={(e) => setAgentForm({ ...agentForm, company: e.target.value })}
                placeholder="Registered Agent Inc."
                disabled={agentUpdating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agentAddress">Street Address *</Label>
              <Input
                id="agentAddress"
                value={agentForm.address}
                onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
                placeholder="123 Main Street"
                disabled={agentUpdating}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="agentCity">City *</Label>
                <Input
                  id="agentCity"
                  value={agentForm.city}
                  onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
                  placeholder="New York"
                  disabled={agentUpdating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agentState">State *</Label>
                <Input
                  id="agentState"
                  value={agentForm.state}
                  onChange={(e) => setAgentForm({ ...agentForm, state: e.target.value })}
                  placeholder="NY"
                  maxLength={2}
                  disabled={agentUpdating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agentZip">ZIP *</Label>
                <Input
                  id="agentZip"
                  value={agentForm.zip}
                  onChange={(e) => setAgentForm({ ...agentForm, zip: e.target.value })}
                  placeholder="10001"
                  maxLength={10}
                  disabled={agentUpdating}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agentEmail">Email</Label>
              <Input
                id="agentEmail"
                type="email"
                value={agentForm.email}
                onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                placeholder="agent@example.com"
                disabled={agentUpdating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agentPhone">Phone</Label>
              <Input
                id="agentPhone"
                value={agentForm.phone}
                onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                disabled={agentUpdating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="servicePeriod">Service Period</Label>
              <Select
                value={agentForm.servicePeriod}
                onValueChange={(value) => setAgentForm({ ...agentForm, servicePeriod: value })}
              >
                <SelectTrigger id="servicePeriod">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Year">1 Year</SelectItem>
                  <SelectItem value="2 Years">2 Years</SelectItem>
                  <SelectItem value="3 Years">3 Years</SelectItem>
                  <SelectItem value="Perpetual">Perpetual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisteredAgentDialogOpen(false)} disabled={agentUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignRegisteredAgent}
              disabled={agentUpdating}
              className="bg-[#dc2626] hover:bg-[#b91c1c]"
            >
              {agentUpdating ? "Assigning..." : "Assign Registered Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={einDialogOpen} onOpenChange={handleCloseEinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign EIN</DialogTitle>
            <DialogDescription>Enter the EIN (Employer Identification Number) for this company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="einInput">EIN Number *</Label>
              <Input
                id="einInput"
                placeholder="XX-XXXXXXX"
                value={einValue}
                onChange={(e) => setEinValue(e.target.value)}
                className="h-10 font-mono"
              />
              <p className="text-xs text-slate-500">Format: XX-XXXXXXX (9 digits with hyphen)</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The EIN will be entered as provided. Standard format is XX-XXXXXXX.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setEinDialogOpen(false)} disabled={einUpdating}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignEIN}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!einValue.trim() || einUpdating}
              >
                {einUpdating ? (
                  "Assigning..."
                ) : (
                  <>
                    <Hash className="w-4 h-4 mr-2" />
                    Assign EIN
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={itinDialogOpen} onOpenChange={handleCloseItinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign ITIN</DialogTitle>
            <DialogDescription>
              Enter the ITIN (Individual Taxpayer Identification Number) for this company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itinInput">ITIN Number *</Label>
              <Input
                id="itinInput"
                placeholder="9XX-XX-XXXX"
                value={itinValue}
                onChange={(e) => setItinValue(e.target.value)}
                className="h-10 font-mono"
              />
              <p className="text-xs text-slate-500">
                Format: 9XX-XX-XXXX (starts with 9, followed by two digits from 50-65, 70-88, 90-92, 94-99)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The ITIN will be entered as provided.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setItinDialogOpen(false)} disabled={itinUpdating}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignITIN}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!itinValue.trim() || itinUpdating}
              >
                {itinUpdating ? (
                  "Assigning..."
                ) : (
                  <>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    Assign ITIN
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={businessIdDialogOpen} onOpenChange={handleCloseBusinessIdDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign Business ID</DialogTitle>
            <DialogDescription>
              Assign a Business ID (State Filing Number) for {company?.name}. This identifier is issued by the state
              after formation is complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessIdInput">Business ID / State Filing Number *</Label>
              <Input
                id="businessIdInput"
                placeholder="L21000123456"
                value={businessIdValue}
                onChange={(e) => setBusinessIdValue(e.target.value)}
                className="h-10 font-mono"
              />
              <p className="text-xs text-slate-500">
                Enter the business ID or filing number issued by the state (format varies by state)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is the official state-issued identifier for the business entity, different
                from the EIN.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setBusinessIdDialogOpen(false)} disabled={businessIdUpdating}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignBusinessId}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!businessIdValue.trim() || businessIdUpdating}
              >
                {businessIdUpdating ? (
                  "Assigning..."
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Assign Business ID
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mailingAddressDialogOpen} onOpenChange={handleCloseMailingAddressDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-[#dc2626]" />
              Assign Mailing Address
            </DialogTitle>
            <DialogDescription>
              Assign a mailing address to {company?.name}. This will be displayed on the user dashboard and company
              page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={mailingAddress.street}
                onChange={(e) => setMailingAddress({ ...mailingAddress, street: e.target.value })}
                placeholder="123 Main Street"
                disabled={addressUpdating}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={mailingAddress.city}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, city: e.target.value })}
                  placeholder="New York"
                  disabled={addressUpdating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={mailingAddress.state}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, state: e.target.value })}
                  placeholder="NY"
                  maxLength={2}
                  disabled={addressUpdating}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input
                id="zip"
                value={mailingAddress.zip}
                onChange={(e) => setMailingAddress({ ...mailingAddress, zip: e.target.value })}
                placeholder="10001"
                maxLength={10}
                disabled={addressUpdating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMailingAddressDialogOpen(false)} disabled={addressUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignMailingAddress}
              disabled={addressUpdating}
              className="bg-[#dc2626] hover:bg-[#b91c1c]"
            >
              {addressUpdating ? "Assigning..." : "Assign Mailing Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StatusUpdateModal
        open={companyStatusDialogOpen}
        onOpenChange={setCompanyStatusDialogOpen}
        title="Update Company Status"
        description="Change the overall operational status of this company"
        currentStatus={company?.companyStatus || "pending"}
        onUpdate={handleUpdateCompanyStatus}
      />

      <StatusUpdateModal
        open={registeredAgentStatusDialogOpen}
        onOpenChange={setRegisteredAgentStatusDialogOpen}
        title="Update Registered Agent Status"
        description="Change the status of the registered agent assignment"
        currentStatus={company?.registeredAgentStatus || "pending"}
        onUpdate={handleUpdateRegisteredAgentStatus}
      />

      <StatusUpdateModal
        open={businessAddressStatusDialogOpen}
        onOpenChange={setBusinessAddressStatusDialogOpen}
        title="Update Business Address Status"
        description="Change the status of the business mailing address"
        currentStatus={company?.businessAddressStatus || "pending"}
        onUpdate={handleUpdateBusinessAddressStatus}
      />

      <StatusUpdateModal
        open={serviceStatusDialogOpen}
        onOpenChange={setServiceStatusDialogOpen}
        title="Update Service Status"
        description="Change the overall service delivery status"
        currentStatus={company?.serviceStatus || "pending"}
        onUpdate={handleUpdateServiceStatus}
      />

      <AdminManualDataModal
        open={taxModalOpen}
        onOpenChange={setTaxModalOpen}
        companyId={company?._id}
        dataType="tax"
        currentData={{
          formationDate: company?.formationDate,
          ein: company?.ein,
          businessId: company?.businessId,
          taxClassification: company?.taxClassification,
          annualReportFilingDate: company?.annualReportFilingDate,
          irsFilingDate: company?.irsFilingDate,
        }}
        onUpdate={loadOrderData}
      />
      <AdminManualDataModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        companyId={company?._id}
        dataType="registered-agent"
        currentData={company?.registeredAgent}
        onUpdate={loadOrderData}
      />
      <AdminManualDataModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        companyId={company?._id}
        dataType="business-address"
        currentData={company?.businessAddress}
        onUpdate={loadOrderData}
      />
    </div>
  )
}
