"use client"

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
  Download,
  Hash,
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileBarChart,
  Loader2,
  MapPin,
  Trash2,
  Settings,
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

  const handleMilestoneToggle = async (milestoneKey: string) => {
    if (!company) return

    setMilestoneUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const updatedMilestones = {
        ...milestones,
        [milestoneKey]: !milestones[milestoneKey as keyof typeof milestones],
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        description: `Milestone updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMilestoneUpdating(false)
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registeredAgent: {
            name: agentForm.name.trim(),
            company: agentForm.company.trim(),
            address: agentForm.address.trim(),
            city: agentForm.city.trim(),
            state: agentForm.state.trim(),
            zip: agentForm.zip.trim(),
            phone: agentForm.phone.trim(),
            email: agentForm.email.trim(),
            servicePeriod: agentForm.servicePeriod,
          },
          milestones: {
            ...milestones,
            registeredAgentAssigned: true,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to assign registered agent")
      }

      const result = await response.json()
      const updatedCompany = result.data || result.company

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, registeredAgentAssigned: true })
      setRegisteredAgentDialogOpen(false)

      toast({
        title: "Registered Agent Assigned",
        description: "Registered agent has been successfully assigned to the company",
      })
    } catch (error) {
      console.error("[v0] Error assigning registered agent:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign registered agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAgentUpdating(false)
    }
  }

  const handleAssignMailingAddress = async () => {
    if (
      !company ||
      !mailingAddress.street.trim() ||
      !mailingAddress.city.trim() ||
      !mailingAddress.state.trim() ||
      !mailingAddress.zip.trim()
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all mailing address fields",
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mailingAddress: {
            street: mailingAddress.street.trim(),
            city: mailingAddress.city.trim(),
            state: mailingAddress.state.trim(),
            zip: mailingAddress.zip.trim(),
          },
          milestones: {
            ...milestones,
            mailingAddressIssued: true,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to assign mailing address")
      }

      const result = await response.json()
      const updatedCompany = result.data || result.company

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, mailingAddressIssued: true })
      setMailingAddressDialogOpen(false)

      toast({
        title: "Mailing Address Assigned",
        description: "Mailing address has been successfully assigned to the company",
      })
    } catch (error) {
      console.error("[v0] Error assigning mailing address:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign mailing address. Please try again.",
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
        description: "Please enter a valid EIN",
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ein: einValue.trim(),
          milestones: {
            ...milestones,
            einProcessed: true,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to assign EIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, einProcessed: true })
      setEinDialogOpen(false)
      setEinValue("")

      toast({
        title: "EIN Assigned",
        description: "EIN has been successfully assigned to the company",
      })
    } catch (error) {
      console.error("[v0] Error assigning EIN:", error)
      toast({
        title: "Error",
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
        description: "Please enter a valid ITIN",
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itin: itinValue.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to assign ITIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      setCompany(updatedCompany)
      setItinDialogOpen(false)
      setItinValue("")

      toast({
        title: "ITIN Assigned",
        description: "ITIN has been successfully assigned to the company",
      })
    } catch (error) {
      console.error("[v0] Error assigning ITIN:", error)
      toast({
        title: "Error",
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
        description: "Please enter a valid Business ID",
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId: businessIdValue.trim(),
          milestones: {
            ...milestones,
            formationCompleted: true,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to assign Business ID")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, formationCompleted: true })
      setBusinessIdDialogOpen(false)
      setBusinessIdValue("")

      toast({
        title: "Business ID Assigned",
        description: "Business ID has been successfully assigned to the company",
      })
    } catch (error) {
      console.error("[v0] Error assigning Business ID:", error)
      toast({
        title: "Error",
        description: "Failed to assign Business ID. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusinessIdUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!order?.id || !company?.id) {
      toast({
        title: "Error",
        description: "Cannot delete order - missing order or company ID",
        variant: "destructive",
      })
      return
    }

    setDeleting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`/api/companies/${company.id}/orders/${order.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete order")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: result.companyDeleted ? "Order and company deleted successfully" : "Order deleted successfully",
      })

      router.push("/admin/orders")
    } catch (error) {
      console.error("[v0] Error deleting order:", error)
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

  const generateInvoice = () => {
    if (!order) return
    const invoiceContent = `Invoice #${order.id}\nTotal: $${safeToFixed(order?.pricing?.total || 0)}`
    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${order.id}.txt`
    a.click()
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !order || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{error || "Order Not Found"}</h2>
          <p className="text-slate-600 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/orders")} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />
      case "processing":
        return <Clock className="w-4 h-4" />
      case "pending":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const completedDefaultMilestones = Object.values(milestones).filter(Boolean).length
  const totalDefaultMilestones = Object.keys(milestones).length
  const completionPercentage =
    totalDefaultMilestones > 0 ? Math.round((completedDefaultMilestones / totalDefaultMilestones) * 100) : 0

  const totalMilestonesWithCustom = totalDefaultMilestones + (company?.customMilestones?.length || 0)
  const completedMilestonesWithCustom =
    completedDefaultMilestones + (company?.customMilestones?.filter((m: any) => m.completed).length || 0)

  const handleViewCompanyDetails = () => {
    if (!company || !company.id) {
      toast({
        title: "Error",
        description: "Company information is not available for this order.",
        variant: "destructive",
      })
      return
    }

    setSelectedCompany(company)
    setCompanyModalOpen(true)
  }

  return (
    <div className="space-y-4 p-4">
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
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full transition-all duration-700"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

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
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Company Name</p>
                  <p className="text-sm font-medium text-slate-900">{company?.name || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">State of Formation</p>
                  <p className="text-sm font-medium text-slate-900">{company?.state || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Entity Type</p>
                  <p className="text-sm font-medium text-slate-900">{company?.entityType || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Business Category</p>
                  <p className="text-sm font-medium text-slate-900">{company?.businessCategory || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">EIN</p>
                  <p className="text-sm font-medium text-slate-900">{formatEIN(company?.ein, true)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Business ID</p>
                  <p className="text-sm font-medium text-slate-900">{formatBusinessId(company?.businessId)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Owners / Members */}
          {company?.members && company.members.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Business Owners / Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {company.members.map((member: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{member.name || `Member ${idx + 1}`}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {member.address && `${member.address}, ${member.city}, ${member.state} ${member.zip}`}
                          </p>
                          {member.needsItin && (
                            <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700">
                              ITIN Required
                            </Badge>
                          )}
                        </div>
                        {member.isResponsiblePerson && <Badge className="bg-blue-600 text-white">Responsible</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Admin Actions Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setRegisteredAgentDialogOpen(true)}
                  disabled={agentUpdating || !company}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  <span className="font-medium">Assign Registered Agent</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setMailingAddressDialogOpen(true)}
                  disabled={addressUpdating || !company}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="font-medium">Assign Mailing Address</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setEinDialogOpen(true)}
                  disabled={einUpdating || !company}
                >
                  <Hash className="w-4 h-4 mr-2" />
                  <span className="font-medium">{hasEIN ? "View/Edit EIN" : "Assign EIN"}</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setBusinessIdDialogOpen(true)}
                  disabled={businessIdUpdating || !company}
                >
                  <Hash className="w-4 h-4 mr-2" />
                  <span className="font-medium">{hasBusinessId ? "View/Edit Business ID" : "Assign Business ID"}</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={generateInvoice}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="font-medium">Download Invoice</span>
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start h-11 hover:bg-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Package Price</p>
                <p className="text-lg font-bold text-slate-900">${safeToFixed(order?.pricing?.packagePrice || 0)}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Add-ons</p>
                <p className="text-lg font-bold text-slate-900">${safeToFixed(order?.pricing?.addons || 0)}</p>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] border border-slate-200">
                <p className="text-xs text-white mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-white">
                  ${safeToFixed(order?.pricing?.total || order?.amount || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={registeredAgentDialogOpen} onOpenChange={setRegisteredAgentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Registered Agent</DialogTitle>
            <DialogDescription>Add registered agent information for the company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Agent Name</Label>
              <Input
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={agentForm.company}
                onChange={(e) => setAgentForm({ ...agentForm, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={agentForm.address}
                onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>City</Label>
                <Input
                  value={agentForm.city}
                  onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={agentForm.state}
                  onChange={(e) => setAgentForm({ ...agentForm, state: e.target.value })}
                  placeholder="State"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={agentForm.zip}
                onChange={(e) => setAgentForm({ ...agentForm, zip: e.target.value })}
                placeholder="ZIP code"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={agentForm.phone}
                onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={agentForm.email}
                onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                placeholder="Email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisteredAgentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignRegisteredAgent}
              disabled={agentUpdating}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              {agentUpdating ? "Assigning..." : "Assign Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mailingAddressDialogOpen} onOpenChange={setMailingAddressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Mailing Address</DialogTitle>
            <DialogDescription>Add mailing address for the company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Street Address</Label>
              <Input
                value={mailingAddress.street}
                onChange={(e) => setMailingAddress({ ...mailingAddress, street: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={mailingAddress.city}
                onChange={(e) => setMailingAddress({ ...mailingAddress, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>State</Label>
                <Input
                  value={mailingAddress.state}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, state: e.target.value })}
                  placeholder="State"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={mailingAddress.zip}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, zip: e.target.value })}
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMailingAddressDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignMailingAddress}
              disabled={addressUpdating}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              {addressUpdating ? "Assigning..." : "Assign Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={einDialogOpen} onOpenChange={setEinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign EIN</DialogTitle>
            <DialogDescription>Enter the EIN for the company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>EIN</Label>
              <Input value={einValue} onChange={(e) => setEinValue(e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEinDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignEIN}
              disabled={einUpdating}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              {einUpdating ? "Assigning..." : "Assign EIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={businessIdDialogOpen} onOpenChange={setBusinessIdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Business ID</DialogTitle>
            <DialogDescription>Enter the Business ID for the company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Business ID</Label>
              <Input
                value={businessIdValue}
                onChange={(e) => setBusinessIdValue(e.target.value)}
                placeholder="Enter Business ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBusinessIdDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignBusinessId}
              disabled={businessIdUpdating}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              {businessIdUpdating ? "Assigning..." : "Assign ID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
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
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
