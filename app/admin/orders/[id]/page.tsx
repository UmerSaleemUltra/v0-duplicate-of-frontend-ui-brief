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
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  UserCheck,
  Home,
  FileCheck,
  FileBarChart,
  Loader2,
  Trash2,
  Plus,
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
    if (!order || !newStatus) return

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
    if (!company || !agentForm) return

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
          registeredAgentStatus: "assigned",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign registered agent")
      }

      const result = await response.json()
      setCompany(result.data)
      setRegisteredAgentDialogOpen(false)

      toast({
        title: "Registered Agent Assigned",
        description: `Registered agent for ${company.name} has been assigned successfully.`,
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

  const handleCloseEinDialog = () => {
    setEinDialogOpen(false)
    setEinValue("")
  }

  const handleAssignEIN = async () => {
    if (!company || !einValue) return

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
          einProcessed: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign EIN")
      }

      const result = await response.json()
      setCompany(result.data)
      setEinDialogOpen(false)

      toast({
        title: "EIN Assigned",
        description: `EIN for ${company.name} has been assigned successfully.`,
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

  const handleCloseItinDialog = () => {
    setItinDialogOpen(false)
    setItinValue("")
  }

  const handleAssignITIN = async () => {
    if (!company || !itinValue) return

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

      toast({
        title: "ITIN Assigned",
        description: `ITIN for ${company.name} has been assigned successfully.`,
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

  const handleCloseBusinessIdDialog = () => {
    setBusinessIdDialogOpen(false)
    setBusinessIdValue("")
  }

  const handleAssignBusinessId = async () => {
    if (!company || !businessIdValue) return

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
          formationCompleted: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign Business ID")
      }

      const result = await response.json()
      setCompany(result.data)
      setBusinessIdDialogOpen(false)

      toast({
        title: "Business ID Assigned",
        description: `Business ID for ${company.name} has been assigned successfully.`,
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

  const handleCloseMailingAddressDialog = () => {
    setMailingAddressDialogOpen(false)
    setMailingAddress({ street: "", city: "", state: "", zip: "" })
  }

  const handleAssignMailingAddress = async () => {
    if (!company || !mailingAddress) return

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
          mailingAddressIssued: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign mailing address")
      }

      const result = await response.json()
      setCompany(result.data)
      setMailingAddressDialogOpen(false)

      toast({
        title: "Mailing Address Assigned",
        description: `Mailing address for ${company.name} has been assigned successfully.`,
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

  const handleUpdateCompanyStatus = async (newStatus: string) => {
    if (!company) return

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
        body: JSON.stringify({ companyStatus: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update company status")
      }

      const result = await response.json()
      setCompany(result.data)
      setCompanyStatusDialogOpen(false)

      toast({
        title: "Company Status Updated",
        description: `Company status for ${company.name} updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update company status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRegisteredAgentStatus = async (newStatus: string) => {
    if (!company) return

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
        body: JSON.stringify({ registeredAgentStatus: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update registered agent status")
      }

      const result = await response.json()
      setCompany(result.data)
      setRegisteredAgentStatusDialogOpen(false)

      toast({
        title: "Registered Agent Status Updated",
        description: `Registered agent status for ${company.name} updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update registered agent status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBusinessAddressStatus = async (newStatus: string) => {
    if (!company) return

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
        body: JSON.stringify({ businessAddressStatus: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update business address status")
      }

      const result = await response.json()
      setCompany(result.data)
      setBusinessAddressStatusDialogOpen(false)

      toast({
        title: "Business Address Status Updated",
        description: `Business address status for ${company.name} updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update business address status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateServiceStatus = async (newStatus: string) => {
    if (!company) return

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
        body: JSON.stringify({ serviceStatus: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update service status")
      }

      const result = await response.json()
      setCompany(result.data)
      setServiceStatusDialogOpen(false)

      toast({
        title: "Service Status Updated",
        description: `Service status for ${company.name} updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update service status. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (error || !order || !company) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
        <p className="text-slate-600 mb-6">{error || "Could not load order details"}</p>
        <Button onClick={() => router.push("/admin/orders")} className="bg-slate-900 hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/orders")}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Order Details</h1>
                <p className="text-slate-600 mt-1">Order ID: {order.id}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(order.status)} text-sm py-2 px-3`}>
              {getStatusIcon(order.status)}
              <span className="ml-2">{order.status}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Name</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(customer?.name)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Email</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(customer?.email)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Phone</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(customer?.phone)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Order Date</Label>
                    <p className="text-slate-900 font-semibold mt-1">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Company Name</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(company?.name)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">State of Formation</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(company?.state)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Business Category</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(company?.businessCategory)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Package Type</Label>
                    <p className="text-slate-900 font-semibold mt-1">
                      {getDisplayValue(order.packageType || "Standard")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-600 text-sm font-medium">Business Website</Label>
                    <p className="text-slate-900 font-semibold mt-1">{getDisplayValue(company?.businessWebsite)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-600 text-sm font-medium">Business Description</Label>
                    <p className="text-slate-900 font-semibold mt-1 line-clamp-2">
                      {getDisplayValue(company?.businessDescription)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Identifiers */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b">
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <Hash className="w-5 h-5" />
                  Business Identifiers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">EIN Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-slate-900 font-semibold">
                        {hasEIN ? formatEIN(company?.ein, true) : <Badge variant="outline">Not Yet</Badge>}
                      </p>
                      {!hasEIN && (
                        <Button
                          size="sm"
                          onClick={() => setEinDialogOpen(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Assign EIN
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm font-medium">Business ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-slate-900 font-semibold">
                        {hasBusinessId ? (
                          formatBusinessId(company?.businessId)
                        ) : (
                          <Badge variant="outline">Not Yet</Badge>
                        )}
                      </p>
                      {!hasBusinessId && (
                        <Button
                          size="sm"
                          onClick={() => setBusinessIdDialogOpen(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Assign Business ID
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registered Agent */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <UserCheck className="w-5 h-5" />
                  Registered Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!hasRegisteredAgent ? (
                  <Button onClick={() => setRegisteredAgentDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
                    Assign Registered Agent
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">Name</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.name}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">Company</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.company}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">Address</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.address}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">City</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.city}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">State</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.state}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">Zip Code</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.zip}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">Phone</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.phone}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">Email</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.registeredAgent?.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mailing Address */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b">
                <CardTitle className="flex items-center gap-2 text-pink-900">
                  <Home className="w-5 h-5" />
                  Mailing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!hasMailingAddress ? (
                  <Button onClick={() => setMailingAddressDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
                    Assign Mailing Address
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <Label className="text-slate-600 text-sm font-medium">Street Address</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.mailingAddress?.street}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">City</Label>
                      <p className="text-slate-900 font-semibold mt-1">{company.mailingAddress?.city}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm font-medium">State, Zip</Label>
                      <p className="text-slate-900 font-semibold mt-1">
                        {company.mailingAddress?.state} {company.mailingAddress?.zip}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Owners / Members */}
            {company?.members && company.members.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Users className="w-5 h-5" />
                    Business Owners / Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {company.members.map((member: any, index: number) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-600">{member.address}</p>
                          </div>
                          {member.isResponsiblePerson && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Responsible Person</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {member.city && (
                            <div>
                              <span className="text-slate-600">City:</span>
                              <p className="font-medium text-slate-900">{member.city}</p>
                            </div>
                          )}
                          {member.state && (
                            <div>
                              <span className="text-slate-600">State:</span>
                              <p className="font-medium text-slate-900">{member.state}</p>
                            </div>
                          )}
                          {member.zip && (
                            <div>
                              <span className="text-slate-600">Zip:</span>
                              <p className="font-medium text-slate-900">{member.zip}</p>
                            </div>
                          )}
                          {member.ssn && (
                            <div>
                              <span className="text-slate-600">SSN:</span>
                              <p className="font-medium text-slate-900">{member.ssn}</p>
                            </div>
                          )}
                          {member.needsItin && (
                            <div className="col-span-2">
                              <Badge variant={member.needsItin ? "default" : "outline"}>
                                {member.needsItin ? "ITIN Required" : "No ITIN Required"}
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

            {/* Purchased Add-ons */}
            {addons.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b">
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Package className="w-5 h-5" />
                    Purchased Add-ons
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {addons.map((addon: any, index: number) => {
                      const addonName = getAddonName(typeof addon === "object" ? addon.serviceId : addon)
                      const addonPrice = typeof addon === "object" ? addon.price : 0
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200"
                        >
                          <span className="font-medium text-slate-900">{addonName}</span>
                          {addonPrice > 0 && <span className="text-slate-600">${safeToFixed(addonPrice)}</span>}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Milestone Progress */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <FileCheck className="w-5 h-5" />
                  Formation Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      {completedMilestonesWithCustom} of {totalMilestonesWithCustom} milestones
                    </span>
                    <span className="text-sm font-bold text-green-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(milestones).map(([key, completed]) => {
                    const labels: { [key: string]: string } = {
                      orderProcessed: "Order Successfully Processed",
                      registeredAgentAssigned: "Registered Agent Assigned",
                      mailingAddressIssued: "Business Mailing Address Issued",
                      formationCompleted: "Company Formation Completed",
                      einProcessed: "EIN Successfully Processed",
                      boiReportFiled: "BOI Report Filed",
                    }
                    return (
                      <div key={key} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${completed ? "text-slate-900 font-medium" : "text-slate-600"}`}>
                          {labels[key]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Custom Milestones */}
                {company?.customMilestones && company.customMilestones.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-slate-900 mb-3">Custom Milestones</h4>
                    <div className="space-y-3">
                      {company.customMilestones.map((milestone: any) => (
                        <div key={milestone.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                          <div className="flex items-center gap-3 flex-1">
                            {milestone.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                            )}
                            <div>
                              <p
                                className={`text-sm font-medium ${milestone.completed ? "text-slate-900" : "text-slate-600"}`}
                              >
                                {milestone.title}
                              </p>
                              {milestone.description && (
                                <p className="text-xs text-slate-500 mt-1">{milestone.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomMilestone(milestone.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Order Status */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                  <CardTitle className="text-slate-900">Order Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <Badge className={`${getStatusColor(order.status)} w-full justify-center py-2 text-sm`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-2">{order.status}</span>
                    </Badge>
                  </div>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Change status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={statusUpdating || newStatus === order.status}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
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
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                  <CardTitle className="text-slate-900">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Package Price</span>
                    <span className="font-semibold text-slate-900">${safeToFixed(order.packagePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Filing Fee</span>
                    <span className="font-semibold text-slate-900">${safeToFixed(order.filingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Add-ons Total</span>
                    <span className="font-semibold text-slate-900">
                      $
                      {safeToFixed(
                        addons.reduce((sum: number, addon: any) => {
                          return sum + (typeof addon === "object" && addon.price ? addon.price : 0)
                        }, 0),
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="text-slate-900 font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-green-600">
                      $
                      {safeToFixed(
                        (Number.parseFloat(String(order.packagePrice)) || 0) +
                          (Number.parseFloat(String(order.filingFee)) || 0) +
                          addons.reduce((sum: number, addon: any) => {
                            return sum + (typeof addon === "object" && addon.price ? addon.price : 0)
                          }, 0),
                      )}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Payment Status</span>
                      <Badge variant="outline">{order.paymentStatus || "Pending"}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Payment Method</span>
                      <span className="font-medium text-slate-900">{order.paymentMethod || "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                  <CardTitle className="text-slate-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-slate-700 hover:text-slate-900 bg-transparent"
                    onClick={() => setMilestonesDialogOpen(true)}
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Edit Milestones
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-slate-700 hover:text-slate-900 bg-transparent"
                    onClick={() => setCustomMilestoneDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Milestone
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-0 shadow-sm border-red-200">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                  <CardTitle className="text-red-900">Danger Zone</CardTitle>
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
      </div>

      {/* Dialogs */}
      <Dialog open={customMilestoneDialogOpen} onOpenChange={setCustomMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Milestone</DialogTitle>
            <DialogDescription>Create a new custom milestone to track additional progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="milestone-title">Title</Label>
              <Input
                id="milestone-title"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Enter milestone title"
              />
            </div>
            <div>
              <Label htmlFor="milestone-description">Description (Optional)</Label>
              <Textarea
                id="milestone-description"
                value={newMilestoneDescription}
                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                placeholder="Enter milestone description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomMilestoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomMilestone} disabled={!newMilestoneTitle}>
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setDeleting(true)
                try {
                  const token = authService.getToken()
                  if (!token) {
                    router.push("/login")
                    return
                  }
                  const response = await fetch(`/api/orders/${order.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  if (!response.ok) throw new Error("Failed to delete order")
                  router.push("/admin/orders")
                  toast({ title: "Order Deleted", description: "The order has been successfully deleted." })
                } catch (error) {
                  toast({
                    title: "Delete Failed",
                    description: "Failed to delete the order. Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setDeleting(false)
                }
              }}
              disabled={deleting}
            >
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
