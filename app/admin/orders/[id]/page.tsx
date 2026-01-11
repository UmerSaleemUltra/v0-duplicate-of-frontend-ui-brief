"use client"

import type React from "react"

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
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Download, Loader2, Trash2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { CompanyDetailsModal } from "@/components/modals/company-details-modal"
import { StatusUpdateModal } from "@/components/status-update-modal"
import { Switch } from "@/components/ui/switch"

const getDisplayValue = (value: any, defaultValue = "N/A"): string => {
  if (value === null || value === undefined || value === "") return defaultValue
  if (typeof value === "string" && value.trim() === "") return defaultValue
  const placeholderPatterns = [
    /^Provide a brief overview/i,
    /minimum \d+ characters/i,
    /^[a-z]{1,5}$/i, // Very short random strings like "hdhfu"
    /^[a-zA-Z0-9\s]*$/, // Only special characters - this one might be too broad, adjust if needed
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

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-800",
    completed: "bg-blue-100 text-blue-800",
    processing: "bg-blue-50 text-blue-700 border-blue-200", // Added for order status
    cancelled: "bg-red-50 text-red-700 border-red-200", // Added for order status
  }
  return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
}

const getMilestoneStatus = (value: boolean) => {
  return value ? (
    <div className="flex items-center gap-2 text-green-600">
      <Check className="w-5 h-5" />
      <span>Completed</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-amber-600">
      <Clock className="w-5 h-5" />
      <span>Pending</span>
    </div>
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

  // Renamed milestoneData to milestones for consistency with the original state
  const [milestoneData, setMilestoneData] = useState<any>(null)

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

      // Store previous state for rollback
      const previousCompany = { ...company }

      // Optimistic update
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
        // Revert on failure
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

      // Store previous state for rollback
      const previousCompany = { ...company }

      // Remove milestone from array
      const updatedCustomMilestones = (company.customMilestones || []).filter((m: any) => m.id !== milestoneId)

      // Optimistic update
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
        // Revert on failure
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

      if (orderData?.company?.members?.[0]) {
        const firstMember = orderData.company.members[0]
        setCustomer({
          name: firstMember.name || "N/A",
          email: orderData.user?.email || "N/A",
          phone: orderData.user?.phone || "N/A",
        })
      } else {
        setCustomer({
          name: "Unknown User",
          email: "N/A",
          phone: "N/A",
        })
      }

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
        const milestonesData = orderData.company.milestones
        setMilestones({
          orderProcessed: milestonesData.orderProcessed === true,
          registeredAgentAssigned: milestonesData.registeredAgentAssigned === true,
          mailingAddressIssued: milestonesData.mailingAddressIssued === true,
          formationCompleted: milestonesData.formationCompleted === true,
          einProcessed: milestonesData.einProcessed === true,
          boiReportFiled: milestonesData.boiReportFiled === true,
        })
        console.log("[v0] Milestones initialized:", milestonesData)
      } else {
        // Initialize with default false values if no milestones exist
        setMilestones({
          orderProcessed: false,
          registeredAgentAssigned: false,
          mailingAddressIssued: false,
          formationCompleted: false,
          einProcessed: false,
          boiReportFiled: false,
        })
        console.log("[v0] Milestones initialized to defaults (no data found)")
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

      if (orderData.company?.businessDescription) {
        const desc = getDisplayValue(orderData.company.businessDescription)
        setCompanyForm((prev) => ({
          ...prev,
          businessDescription: desc === "N/A" ? "" : desc,
        }))
      }
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

  // useEffect hook for loading data (conditionally)
  useEffect(() => {
    if (!isAuthenticated) return

    const loadOrder = async () => {
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
          if (response.status === 404) throw new Error("Order not found")
          throw new Error(`Failed to load order: ${response.status}`)
        }

        const data = await response.json()
        console.log("[v0] Order loaded:", data)
        setOrder(data)

        // Extract company, customer, and user data
        setCompany(data.company)
        if (data?.company?.members?.[0]) {
          const firstMember = data.company.members[0]
          setCustomer({
            name: firstMember.name || "N/A",
            email: data.user?.email || "N/A",
            phone: data.user?.phone || "N/A",
          })
        } else {
          setCustomer({
            name: "Unknown User",
            email: "N/A",
            phone: "N/A",
          })
        }
        setUser(data.user)
        setPassportDocuments(data.passportDocuments || [])

        // Initialize forms with existing data
        setCustomerForm({
          name: data.user?.name || data.company?.members?.[0]?.name || "",
          email: data.user?.email || data.company?.members?.[0]?.email || "",
          phone: data.user?.phone || data.company?.members?.[0]?.phone || "",
        })
        setCompanyForm({
          name: data.company?.name || "",
          state: data.company?.state || "",
          businessCategory: data.company?.businessCategory || "",
          businessWebsite: data.company?.businessWebsite || "",
          businessDescription: data.company?.businessDescription || "",
        })

        // Initialize milestones from company data
        if (data.company?.milestones) {
          console.log("[v0] Initializing milestones from company data:", data.company.milestones)
          const milestonesData = data.company.milestones
          setMilestones({
            orderProcessed: milestonesData.orderProcessed === true,
            registeredAgentAssigned: milestonesData.registeredAgentAssigned === true,
            mailingAddressIssued: milestonesData.mailingAddressIssued === true,
            formationCompleted: milestonesData.formationCompleted === true,
            einProcessed: milestonesData.einProcessed === true,
            boiReportFiled: milestonesData.boiReportFiled === true,
          })
          console.log("[v0] Milestones initialized:", milestonesData)
        } else {
          setMilestones({
            orderProcessed: false,
            registeredAgentAssigned: false,
            mailingAddressIssued: false,
            formationCompleted: false,
            einProcessed: false,
            boiReportFiled: false,
          })
          console.log("[v0] Milestones initialized to defaults (no data found)")
        }

        // Pre-populate registered agent form
        if (data.company?.registeredAgent) {
          const agent = data.company.registeredAgent
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

        // Pre-populate mailing address form
        if (data.company?.mailingAddress) {
          const address = data.company.mailingAddress
          console.log("[v0] Pre-populating mailing address form:", address)
          setMailingAddress({
            street: address.street || "",
            city: address.city || "",
            state: address.state || "",
            zip: address.zip || "",
          })
        }

        // Process addons
        const orderAddons = data.purchasedAddons || data.selectedAddons || []
        const companyAddons = data.company?.purchasedAddons || []
        const allAddons = [...orderAddons]
        companyAddons.forEach((companyAddon: any) => {
          const addonId = typeof companyAddon === "object" ? companyAddon.serviceId : companyAddon
          const alreadyExists = allAddons.some((orderAddon: any) => {
            const orderAddonId = typeof orderAddon === "object" ? orderAddon.serviceId : orderAddon
            return orderAddonId === addonId
          })
          if (!alreadyExists) allAddons.push(companyAddon)
        })
        setAddons(allAddons)

        // Set order status
        setNewStatus(data.status || "")
        setError(null)

        // Handle business description
        if (data.company?.businessDescription) {
          const desc = getDisplayValue(data.company.businessDescription)
          setCompanyForm((prev) => ({ ...prev, businessDescription: desc === "N/A" ? "" : desc }))
        }
      } catch (err) {
        console.error("[v0] Error loading order:", err)
        setError(err instanceof Error ? err.message : "Error loading order")
        toast({ title: "Error", description: error, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, isAuthenticated, router, toast, authLoading])

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !company) return

    setStatusUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      // Update the order within the company
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

      // Update local order state
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

  const handleMilestoneToggle = async (milestone: keyof typeof milestones) => {
    if (!company || milestoneUpdating) return

    // Store previous state before any updates
    const previousMilestones = { ...milestones }
    const isTogglingOn = !milestones[milestone]

    if (!isTogglingOn && company.id) {
      const celebrationKey = `celebration_shown_${company.id}`
      localStorage.removeItem(celebrationKey)
      console.log("[v0] Cleared celebration flag - milestone toggled off")
    }

    // Optimistic update - immediately update UI
    const optimisticMilestones = {
      ...previousMilestones,
      [milestone]: isTogglingOn,
    }

    setMilestones(optimisticMilestones)
    setMilestoneUpdating(true)

    try {
      const token = authService.getToken()
      if (!token) {
        // Revert on auth failure
        setMilestones(previousMilestones)
        setMilestoneUpdating(false)
        router.push("/login")
        return
      }

      console.log("[v0] Updating milestone:", milestone, "to:", isTogglingOn)

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          milestones: optimisticMilestones,
        }),
      })

      if (!response.ok) {
        // Revert on API failure
        setMilestones(previousMilestones)
        setMilestoneUpdating(false)
        throw new Error("Failed to update milestone")
      }

      const result = await response.json()

      console.log("[v0] Milestone update successful:", result.data)

      if (result.data?.milestones) {
        setMilestones(result.data.milestones)
        setCompany(result.data)
      } else {
        // If API doesn't return milestones, keep optimistic state
        console.log("[v0] API didn't return milestones, keeping optimistic state")
      }

      toast({
        title: "Milestone Updated",
        description: `${milestone} has been ${isTogglingOn ? "completed" : "uncompleted"}`,
      })
    } catch (error) {
      console.error("[v0] Error updating milestone:", error)
      // Revert to previous state on error
      setMilestones(previousMilestones)
      toast({
        title: "Update Failed",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMilestoneUpdating(false)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return

    setDocUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", uploadDocType)
      formData.append("companyId", company.id)
      formData.append("userId", customer?.id || "")
      formData.append("orderId", order?.id || "")

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload document")
      }

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully`,
      })

      setUploadDocDialogOpen(false)

      await loadOrderData()

      const titleLower = file.name.toLowerCase()
      const updatedMilestones = { ...milestones }

      if (titleLower.includes("articles") || titleLower.includes("organization")) {
        updatedMilestones.orderProcessed = true
      }
      if (titleLower.includes("registered agent") || titleLower.includes("agent appointed")) {
        updatedMilestones.registeredAgentAssigned = true
      }
      if (titleLower.includes("address") || titleLower.includes("mailing")) {
        updatedMilestones.mailingAddressIssued = true
      }
      if (titleLower.includes("formation") || titleLower.includes("certificate")) {
        updatedMilestones.formationCompleted = true
      }
      if (titleLower.includes("ein") || titleLower.includes("tax id")) {
        updatedMilestones.einProcessed = true
      }
      if (titleLower.includes("boi") || titleLower.includes("beneficial ownership")) {
        updatedMilestones.boiReportFiled = true
      }

      const milestonesChanged = Object.keys(updatedMilestones).some(
        (key) =>
          updatedMilestones[key as keyof typeof updatedMilestones] !== milestones[key as keyof typeof milestones],
      )

      if (milestonesChanged) {
        const milestoneUpdateResponse = await fetch(`/api/companies/${company.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ milestones: updatedMilestones }),
        })

        if (milestoneUpdateResponse.ok) {
          const milestoneResult = await milestoneUpdateResponse.json()
          setMilestones(updatedMilestones)
          setCompany(milestoneResult.data)

          toast({
            title: "Milestones Auto-Updated",
            description: "Formation progress updated based on document type",
          })
        }
      }
    } catch (error) {
      console.log("[v0] Error uploading document:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDocUploading(false)
      const fileInput = document.getElementById("documentFile") as HTMLInputElement | null
      if (fileInput) fileInput.value = ""
    }
  }

  const handleAssignRegisteredAgent = async () => {
    if (!company) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive",
      })
      return
    }

    if (!agentForm.name || !agentForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Agent name is required",
        variant: "destructive",
      })
      return
    }

    if (!agentForm.address || !agentForm.address.trim()) {
      toast({
        title: "Missing Information",
        description: "Agent address is required",
        variant: "destructive",
      })
      return
    }

    setAgentUpdating(true)
    try {
      console.log("[v0] Assigning registered agent:", agentForm)

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
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
            status: "Active",
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

      console.log("[v0] Registered agent assigned successfully:", updatedCompany.registeredAgent)

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
    if (!company) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive",
      })
      return
    }

    if (!mailingAddress.street || !mailingAddress.street.trim()) {
      toast({
        title: "Missing Information",
        description: "Street address is required",
        variant: "destructive",
      })
      return
    }

    if (!mailingAddress.city || !mailingAddress.city.trim()) {
      toast({
        title: "Missing Information",
        description: "City is required",
        variant: "destructive",
      })
      return
    }

    if (!mailingAddress.state || !mailingAddress.state.trim()) {
      toast({
        title: "Missing Information",
        description: "State is required",
        variant: "destructive",
      })
      return
    }

    if (!mailingAddress.zip || !mailingAddress.zip.trim()) {
      toast({
        title: "Missing Information",
        description: "ZIP code is required",
        variant: "destructive",
      })
      return
    }

    setAddressUpdating(true)
    try {
      console.log("[v0] Assigning mailing address:", mailingAddress)

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
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

      console.log("[v0] Mailing address assigned successfully:", updatedCompany.mailingAddress)

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
      console.log("[v0] Assigning EIN:", einValue)

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
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

      console.log("[v0] EIN assigned successfully")

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
      console.log("[v0] Assigning ITIN:", itinValue)

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          itin: itinValue.trim(),
          // ITIN assignment doesn't directly correspond to a core milestone,
          // but could be tied to a custom one if needed.
        }),
      })

      if (!response.ok) throw new Error("Failed to assign ITIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] ITIN assigned successfully")

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
      console.log("[v0] Assigning Business ID:", businessIdValue)

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
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

      console.log("[v0] Business ID assigned successfully")

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

  const handleCompanyInfoUpdate = async (field: string) => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const input = document.getElementById(field) as HTMLInputElement | HTMLTextAreaElement
      if (!input) return

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: input.value,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update company info")
      }

      const result = await response.json()
      setCompany(result.data)

      toast({
        title: "Company Updated",
        description: `${field} has been updated`,
      })
    } catch (error) {
      console.log("[v0] Error updating company info:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update company info. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOrder = async () => {
    console.log("[v0] Delete order initiated", { orderId: order?.id, companyId: company?.id })

    if (!order?.id || !company?.id) {
      console.log("[v0] Delete failed - missing IDs", { orderId: order?.id, companyId: company?.id })
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

      console.log("[v0] Sending delete request to API", {
        url: `/api/companies/${company.id}/orders/${order.id}`,
      })

      const response = await fetch(`/api/companies/${company.id}/orders/${order.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Delete response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.log("[v0] Delete error response:", error)
        throw new Error(error.error || "Failed to delete order")
      }

      const result = await response.json()
      console.log("[v0] Delete successful:", result)

      toast({
        title: "Success",
        description: result.companyDeleted ? "Order and company deleted successfully" : "Order deleted successfully",
      })

      if (result.companyDeleted) {
        router.push("/admin/orders")
      } else {
        router.push("/admin/orders")
      }
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

  const handleCloseRegisteredAgentDialog = () => {
    setRegisteredAgentDialogOpen(false)
    // Don't reset form - keep it populated for easy re-editing
  }

  const handleCloseMailingAddressDialog = () => {
    setMailingAddressDialogOpen(false)
    // Don't reset form - keep it populated for easy re-editing
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

  const handleCloseCustomMilestoneDialog = () => {
    setCustomMilestoneDialogOpen(false)
    setNewMilestoneTitle("")
    setNewMilestoneDescription("")
  }

  const handleCompanyStatusUpdate = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

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
        description: `Company status updated to ${newStatus}`,
      })
    } catch (error) {
      console.log("[v0] Error updating company status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update company status",
        variant: "destructive",
      })
    }
  }

  const handleRegisteredAgentStatusUpdate = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

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
        description: `Registered agent status updated to ${newStatus}`,
      })
    } catch (error) {
      console.log("[v0] Error updating registered agent status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update registered agent status",
        variant: "destructive",
      })
    }
  }

  const handleBusinessAddressStatusUpdate = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

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
        description: `Business address status updated to ${newStatus}`,
      })
    } catch (error) {
      console.log("[v0] Error updating business address status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update business address status",
        variant: "destructive",
      })
    }
  }

  const handleServiceStatusUpdate = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

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
        description: `Service status updated to ${newStatus}`,
      })
    } catch (error) {
      console.log("[v0] Error updating service status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update service status",
        variant: "destructive",
      })
    }
  }

  // Initial loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">You are not authorized to view this page.</p>
          <Button onClick={() => router.push("/login")} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Loading state for order data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  // Error or order not found state
  if (error || !order) {
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

  // Helper function to get status color
  const getStatusColorOrder = (status: string) => {
    // Renamed to avoid conflict
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  // Helper function to get status icon
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

  // Milestone progress calculation
  const completedDefaultMilestones = milestoneData ? Object.values(milestoneData).filter(Boolean).length : 0
  const totalDefaultMilestones = 6 // Assuming 6 default milestones
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

  const handleRemoveEIN = async () => {
    if (!company) return

    setEinUpdating(true)
    try {
      console.log("[v0] Removing EIN")

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          ein: null,
          milestones: {
            ...milestones,
            einProcessed: false,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to remove EIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] EIN removed successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, einProcessed: false })

      toast({
        title: "EIN Removed",
        description: "EIN has been successfully removed from the company",
      })

      await loadOrderData()
    } catch (error) {
      console.error("[v0] Error removing EIN:", error)
      toast({
        title: "Error",
        description: "Failed to remove EIN. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEinUpdating(false)
    }
  }

  const handleRemoveITIN = async () => {
    if (!company) return

    setItinUpdating(true)
    try {
      console.log("[v0] Removing ITIN")

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          itin: null,
        }),
      })

      if (!response.ok) throw new Error("Failed to remove ITIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] ITIN removed successfully")

      setCompany(updatedCompany)

      toast({
        title: "ITIN Removed",
        description: "ITIN has been successfully removed from the company",
      })

      await loadOrderData()
    } catch (error) {
      console.error("[v0] Error removing ITIN:", error)
      toast({
        title: "Error",
        description: "Failed to remove ITIN. Please try again.",
        variant: "destructive",
      })
    } finally {
      setItinUpdating(false)
    }
  }

  const handleRemoveBusinessId = async () => {
    if (!company) return

    setBusinessIdUpdating(true)
    try {
      console.log("[v0] Removing Business ID")

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          businessId: null,
          milestones: {
            ...milestones,
            formationCompleted: false,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to remove Business ID")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] Business ID removed successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, formationCompleted: false })

      toast({
        title: "Business ID Removed",
        description: "Business ID has been successfully removed from the company",
      })

      await loadOrderData()
    } catch (error) {
      console.error("[v0] Error removing Business ID:", error)
      toast({
        title: "Error",
        description: "Failed to remove Business ID. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusinessIdUpdating(false)
    }
  }

  const generateInvoice = () => {
    if (!order) return

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.orderId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #880000; margin: 0; }
    .info-section { margin-bottom: 30px; }
    .info-section h2 { color: #333; border-bottom: 2px solid #880000; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
    .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .info-label { font-weight: bold; color: #666; font-size: 12px; }
    .info-value { color: #333; margin-top: 5px; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p style="color: #666;">Order ID: ${order.id}</p>
    <p style="color: #666;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
  </div>

  <div class="info-section">
    <h2>Customer Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${customer?.name || order.email || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${customer?.email || order.email || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${customer?.phone || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Payment Status</div>
        <div class="info-value">
          <span class="status ${order?.paymentInfo?.status === "paid" ? "status-paid" : "status-pending"}">
            ${order?.paymentInfo?.status?.toUpperCase() || "PENDING"}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h2>Business Details</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Business Name</div>
        <div class="info-value">${company?.name || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">State</div>
        <div class="info-value">${company?.state || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Business Category</div>
        <div class="info-value">${company?.businessCategory || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Package Type</div>
        <div class="info-value">${
          company?.packageType
            ? company.packageType
                .split("-")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : "N/A"
        }</div>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h2>Payment Details</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Base Price</div>
        <div class="info-value">$${(order?.pricing?.packagePrice || order?.packagePrice || 0).toFixed(2)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Add-ons</div>
        <div class="info-value">$${(order?.pricing?.addonsTotal || (order?.selectedAddons || []).reduce((sum: number, addon: any) => sum + (addon.price || 0), 0) || 0).toFixed(2)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">State Fee</div>
        <div class="info-value">$${(order?.pricing?.stateFilingFee || order?.stateFilingFee || 0).toFixed(2)}</div>
      </div>
      <div class="info-item" style="background: #880000; color: white;">
        <div class="info-label" style="color: #fff;">Total Amount</div>
        <div class="info-value" style="color: #fff; font-size: 20px; font-weight: bold;">$${(order?.pricing?.total || order?.pricing?.totalAmount || order?.amount || 0).toFixed(2)}</div>
      </div>
    </div>
  </div>

  ${
    addons && addons.length > 0
      ? `
  <div class="info-section">
    <h2>Selected Add-ons</h2>
    <ul style="list-style: none; padding: 0;">
      ${addons
        .map((addon: any) => {
          const isObject = typeof addon === "object" && addon !== null
          const addonName = isObject ? addon.name : getAddonName(addon)
          const addonPrice = isObject ? addon.price : 0
          return `
        <li style="padding: 10px; background: #f5f5f5; margin-bottom: 10px; border-radius: 5px;">
          <strong>${addonName}</strong>
          ${addonPrice ? ` - $${addonPrice.toFixed(2)}` : ""}
        </li>
      `
        })
        .join("")}
    </ul>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>For questions, please contact support.</p>
  </div>
</body>
</html>
    `

    const blob = new Blob([invoiceHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Invoice-${order.id}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Invoice Downloaded",
      description: "Invoice has been downloaded as an HTML file.",
    })
  }

  const handleSaveCustomer = async () => {
    if (!customer?.id) {
      toast({
        title: "Error",
        description: "Customer ID not found. Cannot save changes.",
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

      const response = await fetch(`/api/users/${customer.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update customer information")
      }

      const result = await response.json()
      setCustomer(result.data) // Update customer state with the latest data
      setEditingCustomer(false) // Exit editing mode

      toast({
        title: "Customer Updated",
        description: "Customer information has been successfully updated.",
      })
    } catch (error) {
      console.error("[v0] Error saving customer info:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update customer information. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveCompany = async () => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company ID not found. Cannot save changes.",
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

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: companyForm.name,
          state: companyForm.state,
          businessCategory: companyForm.businessCategory,
          businessWebsite: companyForm.businessWebsite,
          businessDescription: companyForm.businessDescription,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update company information")
      }

      const result = await response.json()
      setCompany(result.data) // Update company state with the latest data
      setEditingCompany(false) // Exit editing mode

      toast({
        title: "Company Updated",
        description: "Company information has been successfully updated.",
      })
    } catch (error) {
      console.error("[v0] Error saving company info:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update company information. Please try again.",
        variant: "destructive",
      })
    }
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
      console.error("[v0] Error updating company status:", error)
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
      console.error("[v0] Error updating registered agent status:", error)
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
      console.error("[v0] Error updating business address status:", error)
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
      console.error("[v0] Error updating service status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update service status",
        variant: "destructive",
      })
    }
  }

  // Helper function to get status icon (from original file)
  const getStatusIconOrder = (status: string) => {
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

  // Updated main return block to match the new structure and simplified UI
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-sm text-gray-600">Order ID: {orderId ? orderId.slice(0, 8) + "..." : "N/A"}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(company?.companyStatus || "pending")} text-lg px-4 py-2`}>
              {company?.companyStatus || "Pending"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Customer Information</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setEditingCustomer(true)}>
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Full Name</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(customer?.name)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(customer?.email)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(customer?.phone)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Status</p>
                    <Badge className={getStatusColor(customer?.accountStatus || "pending")}>
                      {customer?.accountStatus || "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Company Information</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setEditingCompany(true)}>
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Company Name</p>
                    <p className="text-lg text-gray-900 font-semibold">{getDisplayValue(company?.name)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">State</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(company?.state)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Entity Type</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(company?.entityType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Business Category</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(company?.businessCategory)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Business Website</p>
                    <p className="text-lg text-blue-600 truncate">{getDisplayValue(company?.businessWebsite)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Package Type</p>
                    <p className="text-lg text-gray-900">{getDisplayValue(company?.packageType)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Business Description</p>
                  <p className="text-gray-900 mt-2">{getDisplayValue(company?.businessDescription, "Not provided")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Formation Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Formation Progress</CardTitle>
                <p className="text-sm text-gray-600">
                  {completedDefaultMilestones} of {totalDefaultMilestones} milestones completed
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(completedDefaultMilestones / totalDefaultMilestones) * 100}%` }}
                  />
                </div>
                <div className="space-y-3">
                  {[
                    { key: "orderProcessed", label: "Order Successfully Processed" },
                    { key: "registeredAgentAssigned", label: "Registered Agent Assigned" },
                    { key: "mailingAddressIssued", label: "Business Mailing Address Issued" },
                    { key: "formationCompleted", label: "Company Formation Completed" },
                    { key: "einProcessed", label: "EIN Successfully Processed" },
                    { key: "boiReportFiled", label: "BOI Report Filed" },
                  ].map((milestone) => (
                    <div key={milestone.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{milestone.label}</span>
                      {getMilestoneStatus(milestones[milestone.key as keyof typeof milestones] || false)}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMilestonesDialogOpen(true)}>
                    Manage Milestones
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCustomMilestoneDialogOpen(true)}>
                    Add Custom
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setUploadDocDialogOpen(true)}>
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Business Members */}
            {company?.members && company.members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Owners / Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.members.map((member: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{member.name || "N/A"}</p>
                            <p className="text-sm text-gray-600">{member.email || "N/A"}</p>
                            <p className="text-sm text-gray-600">{member.address || "N/A"}</p>
                          </div>
                          {member.isResponsiblePerson && (
                            <Badge className="bg-red-100 text-red-800">Responsible Person</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Details */}
            <Card>
              <CardHeader>
                <CardTitle>Order & Pricing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Package Price</span>
                    <span className="font-semibold">
                      ${getDisplayValue(order?.pricing?.packagePrice || order?.packagePrice || "0.00")}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>State Filing Fee</span>
                    <span className="font-semibold">
                      ${getDisplayValue(order?.pricing?.stateFilingFee || order?.stateFilingFee || "0.00")}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Add-ons Total</span>
                    <span className="font-semibold">
                      $
                      {getDisplayValue(
                        order?.pricing?.addonsTotal ||
                          (order?.selectedAddons || []).reduce(
                            (sum: number, addon: any) => sum + (addon.price || 0),
                            0,
                          ) ||
                          "0.00",
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-blue-600">
                      $
                      {getDisplayValue(order?.pricing?.total || order?.pricing?.totalAmount || order?.amount || "0.00")}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="text-gray-900">{getDisplayValue(order?.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status</span>
                      <Badge className={getStatusColor(order?.paymentStatus || "pending")}>
                        {getDisplayValue(order?.paymentStatus, "Pending")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Company Status</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Badge className={getStatusColor(company?.companyStatus || "pending")}>
                      {company?.companyStatus || "Pending"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setCompanyStatusDialogOpen(true)}>
                      Update
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Registered Agent Status</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Badge className={getStatusColor(company?.registeredAgentStatus || "pending")}>
                      {company?.registeredAgentStatus || "pending"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setRegisteredAgentStatusDialogOpen(true)}>
                      Update
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Business Address Status</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Badge className={getStatusColor(company?.businessAddressStatus || "pending")}>
                      {company?.businessAddressStatus || "pending"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setBusinessAddressStatusDialogOpen(true)}>
                      Update
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Service Status</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Badge className={getStatusColor(company?.serviceStatus || "pending")}>
                      {company?.serviceStatus || "pending"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setServiceStatusDialogOpen(true)}>
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                  onClick={generateInvoice}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Update Modals */}
      <StatusUpdateModal
        isOpen={companyStatusDialogOpen}
        onClose={() => setCompanyStatusDialogOpen(false)}
        onUpdate={(status) => handleCompanyStatusUpdate(status as any)}
        statusType="Company Status"
        currentStatus={company?.companyStatus}
        orderId={orderId}
      />
      <StatusUpdateModal
        isOpen={registeredAgentStatusDialogOpen}
        onClose={() => setRegisteredAgentStatusDialogOpen(false)}
        onUpdate={(status) => handleRegisteredAgentStatusUpdate(status as any)}
        statusType="Registered Agent Status"
        currentStatus={company?.registeredAgentStatus}
        orderId={orderId}
      />
      <StatusUpdateModal
        isOpen={businessAddressStatusDialogOpen}
        onClose={() => setBusinessAddressStatusDialogOpen(false)}
        onUpdate={(status) => handleBusinessAddressStatusUpdate(status as any)}
        statusType="Business Address Status"
        currentStatus={company?.businessAddressStatus}
        orderId={orderId}
      />
      <StatusUpdateModal
        isOpen={serviceStatusDialogOpen}
        onClose={() => setServiceStatusDialogOpen(false)}
        onUpdate={(status) => handleServiceStatusUpdate(status as any)}
        statusType="Service Status"
        currentStatus={company?.serviceStatus}
        orderId={orderId}
      />

      {/* Other Dialogs */}
      <Dialog open={registeredAgentDialogOpen} onOpenChange={handleCloseRegisteredAgentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registered Agent Information</DialogTitle>
            <DialogDescription>Update the registered agent details for the company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentName" className="text-right">
                {" "}
                Name{" "}
              </Label>
              <Input
                id="agentName"
                className="col-span-3"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentCompany" className="text-right">
                {" "}
                Company{" "}
              </Label>
              <Input
                id="agentCompany"
                className="col-span-3"
                value={agentForm.company}
                onChange={(e) => setAgentForm({ ...agentForm, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentAddress" className="text-right">
                {" "}
                Address{" "}
              </Label>
              <Input
                id="agentAddress"
                className="col-span-3"
                value={agentForm.address}
                onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentCity" className="text-right">
                {" "}
                City{" "}
              </Label>
              <Input
                id="agentCity"
                className="col-span-3"
                value={agentForm.city}
                onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentState" className="text-right">
                {" "}
                State{" "}
              </Label>
              <Input
                id="agentState"
                className="col-span-3"
                value={agentForm.state}
                onChange={(e) => setAgentForm({ ...agentForm, state: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentZip" className="text-right">
                {" "}
                Zip{" "}
              </Label>
              <Input
                id="agentZip"
                className="col-span-3"
                value={agentForm.zip}
                onChange={(e) => setAgentForm({ ...agentForm, zip: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentPhone" className="text-right">
                {" "}
                Phone{" "}
              </Label>
              <Input
                id="agentPhone"
                className="col-span-3"
                value={agentForm.phone}
                onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentEmail" className="text-right">
                {" "}
                Email{" "}
              </Label>
              <Input
                id="agentEmail"
                className="col-span-3"
                value={agentForm.email}
                onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentServicePeriod" className="text-right">
                {" "}
                Service Period{" "}
              </Label>
              <Select
                value={agentForm.servicePeriod}
                onValueChange={(value) => setAgentForm({ ...agentForm, servicePeriod: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Year">1 Year</SelectItem>
                  <SelectItem value="2 Years">2 Years</SelectItem>
                  <SelectItem value="3 Years">3 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssignRegisteredAgent} disabled={agentUpdating}>
              {agentUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mailingAddressDialogOpen} onOpenChange={handleCloseMailingAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mailing Address Information</DialogTitle>
            <DialogDescription>Update the mailing address for the company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mailingStreet" className="text-right">
                {" "}
                Street{" "}
              </Label>
              <Input
                id="mailingStreet"
                className="col-span-3"
                value={mailingAddress.street}
                onChange={(e) => setMailingAddress({ ...mailingAddress, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mailingCity" className="text-right">
                {" "}
                City{" "}
              </Label>
              <Input
                id="mailingCity"
                className="col-span-3"
                value={mailingAddress.city}
                onChange={(e) => setMailingAddress({ ...mailingAddress, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mailingState" className="text-right">
                {" "}
                State{" "}
              </Label>
              <Input
                id="mailingState"
                className="col-span-3"
                value={mailingAddress.state}
                onChange={(e) => setMailingAddress({ ...mailingAddress, state: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mailingZip" className="text-right">
                {" "}
                Zip{" "}
              </Label>
              <Input
                id="mailingZip"
                className="col-span-3"
                value={mailingAddress.zip}
                onChange={(e) => setMailingAddress({ ...mailingAddress, zip: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssignMailingAddress} disabled={addressUpdating}>
              {addressUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={einDialogOpen} onOpenChange={handleCloseEinDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign EIN</DialogTitle>
            <DialogDescription>Enter the EIN for the company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ein" className="text-right">
                {" "}
                EIN{" "}
              </Label>
              <Input
                id="ein"
                className="col-span-3"
                value={einValue}
                onChange={(e) => setEinValue(e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssignEIN} disabled={einUpdating}>
              {einUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign EIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itinDialogOpen} onOpenChange={handleCloseItinDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign ITIN</DialogTitle>
            <DialogDescription>Enter the ITIN for the company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itin" className="text-right">
                {" "}
                ITIN{" "}
              </Label>
              <Input
                id="itin"
                className="col-span-3"
                value={itinValue}
                onChange={(e) => setItinValue(e.target.value)}
                placeholder="9XX-XX-XXXX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssignITIN} disabled={itinUpdating}>
              {itinUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign ITIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={businessIdDialogOpen} onOpenChange={handleCloseBusinessIdDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Business ID</DialogTitle>
            <DialogDescription>Enter the Business ID for the company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessId" className="text-right">
                {" "}
                Business ID{" "}
              </Label>
              <Input
                id="businessId"
                className="col-span-3"
                value={businessIdValue}
                onChange={(e) => setBusinessIdValue(e.target.value)}
                placeholder="e.g., BI-12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssignBusinessId} disabled={businessIdUpdating}>
              {businessIdUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Business ID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDocDialogOpen} onOpenChange={setUploadDocDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a document related to this order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="documentType" className="text-right">
                {" "}
                Document Type{" "}
              </Label>
              <Select value={uploadDocType} onValueChange={setUploadDocType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="id">Identification</SelectItem>
                  <SelectItem value="formation">Formation Documents</SelectItem>
                  <SelectItem value="tax">Tax Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="documentFile" className="text-right">
                {" "}
                File{" "}
              </Label>
              <Input id="documentFile" type="file" className="col-span-3" onChange={handleDocumentUpload} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setUploadDocDialogOpen(false)}>
              Cancel
            </Button>
            {/* The actual upload is handled by the onChange of the file input */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={milestonesDialogOpen} onOpenChange={setMilestonesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Milestones</DialogTitle>
            <DialogDescription>Mark milestones as complete or incomplete.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {Object.entries(milestones).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                <Switch checked={value} onCheckedChange={() => handleMilestoneToggle(key as keyof typeof milestones)} />
              </div>
            ))}
            {company?.customMilestones?.map((milestone: any) => (
              <div key={milestone.id} className="flex items-center justify-between">
                <Label className="capitalize">{milestone.title}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{milestone.completed ? "Completed" : "Pending"}</span>
                  <Switch
                    checked={milestone.completed}
                    onCheckedChange={() => handleCustomMilestoneToggle(milestone.id)}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setMilestonesDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customMilestoneDialogOpen} onOpenChange={handleCloseCustomMilestoneDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Milestone</DialogTitle>
            <DialogDescription>Add a custom milestone for tracking.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestoneTitle" className="text-right">
                {" "}
                Title{" "}
              </Label>
              <Input
                id="milestoneTitle"
                className="col-span-3"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestoneDescription" className="text-right">
                {" "}
                Description{" "}
              </Label>
              <Textarea
                id="milestoneDescription"
                className="col-span-3"
                value={newMilestoneDescription}
                onChange={(e) => setNewMilestoneDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddCustomMilestone} disabled={!newMilestoneTitle}>
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompanyDetailsModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        company={selectedCompany}
      />
    </div>
  )
}
