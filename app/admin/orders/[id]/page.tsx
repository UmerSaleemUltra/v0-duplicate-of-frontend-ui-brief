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
  AlertCircle,
  Hash,
  UserCheck,
  FileCheck,
  Loader2,
  MapPin,
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
  // Removed passportDocuments, passportUrls, user state as they are not used in the provided updates.
  // const [passportDocuments, setPassportDocuments] = useState<any[]>([])
  // const [passportUrls, setPassportUrls] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  // Removed editingSection state as it's not used in the provided updates.
  // const [editingSection, setEditingSection] = useState<string | null>(null)

  const [statusUpdating, setStatusUpdating] = useState(false)
  const [agentUpdating, setAgentUpdating] = useState(false)
  const [addressUpdating, setAddressUpdating] = useState(false)
  const [einUpdating, setEinUpdating] = useState(false)
  // Removed itinUpdating state as it's not used in the provided updates.
  // const [itinUpdating, setItinUpdating] = useState(false)
  const [businessIdUpdating, setBusinessIdUpdating] = useState(false)
  // Removed docUploading state as it's not used in the provided updates.
  // const [docUploading, setDocUploading] = useState(false)
  const [milestoneUpdating, setMilestoneUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [companyStatusDialogOpen, setCompanyStatusDialogOpen] = useState(false)
  const [registeredAgentStatusDialogOpen, setRegisteredAgentStatusDialogOpen] = useState(false)
  const [businessAddressStatusDialogOpen, setBusinessAddressStatusDialogOpen] = useState(false)
  const [serviceStatusDialogOpen, setServiceStatusDialogOpen] = useState(false)

  // Corrected undeclared variables:
  // Removed agentStatusModalOpen, addressStatusModalOpen, serviceStatusModalOpen as they seem to be duplicates or unused.
  // const [agentStatusModalOpen, setAgentStatusModalOpen] = useState(false)
  // const [addressStatusModalOpen, setAddressStatusModalOpen] = useState(false)
  // const [serviceStatusModalOpen, setServiceStatusModalOpen] = useState(false)

  const [registeredAgentDialogOpen, setRegisteredAgentDialogOpen] = useState(false)
  const [mailingAddressDialogOpen, setMailingAddressDialogOpen] = useState(false)
  const [einDialogOpen, setEinDialogOpen] = useState(false)
  // Removed itinDialogOpen state as it's not used in the provided updates.
  // const [itinDialogOpen, setItinDialogOpen] = useState(false)
  const [businessIdDialogOpen, setBusinessIdDialogOpen] = useState(false)
  // Removed uploadDocDialogOpen state as it's not used in the provided updates.
  // const [uploadDocDialogOpen, setUploadDocDialogOpen] = useState(false)
  const [milestonesDialogOpen, setMilestonesDialogOpen] = useState(false)
  const [customMilestoneDialogOpen, setCustomMilestoneDialogOpen] = useState(false)
  // Removed duplicate addMilestoneDialogOpen state

  // Removed taxModalOpen, agentModalOpen, addressModalOpen as they seem to be duplicates or unused.
  // const [taxModalOpen, setTaxModalOpen] = useState(false)
  // const [agentModalOpen, setAgentModalOpen] = useState(false)
  // const [addressModalOpen, setAddressModalOpen] = useState(false)

  const [einValue, setEinValue] = useState("")
  // Removed itinValue state as it's not used in the provided updates.
  // const [itinValue, setItinValue] = useState("")
  const [businessIdValue, setBusinessIdValue] = useState("")
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("")
  // Removed uploadDocType state as it's not used in the provided updates.
  // const [uploadDocType, setUploadDocType] = useState("general")

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

  // Removed editingCustomer and editingCompany states as they are not used in the provided updates.
  // const [editingCustomer, setEditingCustomer] = useState(false)
  // const [editingCompany, setEditingCompany] = useState(false)
  // Removed customerForm and companyForm states as they are not used in the provided updates.
  // const [customerForm, setCustomerForm] = useState({
  //   name: "",
  //   email: "",
  //   phone: "",
  // })
  // const [companyForm, setCompanyForm] = useState({
  //   name: "",
  //   state: "",
  //   businessCategory: "",
  //   businessWebsite: "",
  //   businessDescription: "",
  // })

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
      setCustomer(
        orderData.user || {
          name: orderData.company?.members?.[0]?.name || "Unknown User",
          email: orderData.company?.members?.[0]?.email || "N/A",
          phone: orderData.company?.members?.[0]?.phone || "N/A",
        },
      )
      setUser(orderData.user)
      // Removed passportDocuments and passportUrls as they are not used in the provided updates.
      // setPassportDocuments(orderData.passportDocuments || [])

      // Removed customerForm and companyForm initialization as they are not used in the provided updates.
      // setCustomerForm({
      //   name: orderData.user?.name || orderData.company?.members?.[0]?.name || "",
      //   email: orderData.user?.email || orderData.company?.members?.[0]?.email || "",
      //   phone: orderData.user?.phone || orderData.company?.members?.[0]?.phone || "",
      // })

      // setCompanyForm({
      //   name: orderData.company?.name || "",
      //   state: orderData.company?.state || "",
      //   businessCategory: orderData.company?.businessCategory || "",
      //   businessWebsite: orderData.company?.businessWebsite || "",
      //   businessDescription: orderData.company?.businessDescription || "",
      // })

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
        // Initialize with default false values if no milestones exist
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

  // Milestones are now initialized directly in loadOrderData

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !company) return

    setStatusUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      // Update ONLY the status field in the API, not the entire order
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

  // Removed handleDocumentUpload as it's not used in the provided updates.
  // const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { ... }

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

  // Removed handleAssignITIN as it's not used in the provided updates.
  // const handleAssignITIN = async () => { ... }

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

  // Removed handleCompanyInfoUpdate as it's not used in the provided updates.
  // const handleCompanyInfoUpdate = async (field: string) => { ... }

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

  // Removed handleCloseItinDialog as it's not used in the provided updates.
  // const handleCloseItinDialog = () => { ... }

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

  // Removed handleSaveCustomer and handleSaveCompany as they are not used in the provided updates.
  // const handleSaveCustomer = async () => { ... }
  // const handleSaveCompany = async () => { ... }

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-gray-600">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle>Customer Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Name</Label>
                  <p className="font-semibold">{getDisplayValue(customer?.name)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-semibold">{getDisplayValue(customer?.email)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Phone</Label>
                  <p className="font-semibold">{getDisplayValue(customer?.phone)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Account Status</Label>
                  <Badge variant="outline" className="mt-1">
                    {getDisplayValue(customer?.accountStatus, "Active")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <CardTitle>Company Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Company Name</Label>
                  <p className="font-semibold">{getDisplayValue(company?.name)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">State</Label>
                  <p className="font-semibold">{getDisplayValue(company?.state)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-gray-600">Business Category</Label>
                  <p className="font-semibold">{getDisplayValue(company?.businessCategory)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-gray-600">Business Website</Label>
                  <p className="font-semibold">{getDisplayValue(company?.businessWebsite)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Business Identifiers */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-green-600" />
                  <CardTitle>Business Identifiers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-gray-600">EIN Number</Label>
                    <p className="font-semibold mt-1">{hasEIN ? formatEIN(company?.ein, true) : "Not Yet"}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEinDialogOpen(true)}>
                    {hasEIN ? "Update" : "Assign"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-gray-600">Business ID</Label>
                    <p className="font-semibold mt-1">
                      {hasBusinessId ? formatBusinessId(company?.businessId) : "Not Yet"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setBusinessIdDialogOpen(true)}>
                    {hasBusinessId ? "Update" : "Assign"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registered Agent */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-orange-600" />
                  <CardTitle>Registered Agent</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {hasRegisteredAgent ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Name</Label>
                      <p className="font-semibold">{company?.registeredAgent?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Address</Label>
                      <p className="font-semibold">{company?.registeredAgent?.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">City</Label>
                      <p className="font-semibold">{company?.registeredAgent?.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">State</Label>
                      <p className="font-semibold">{company?.registeredAgent?.state}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Not Assigned</p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={() => setRegisteredAgentDialogOpen(true)}
                >
                  {hasRegisteredAgent ? "Update" : "Assign"} Registered Agent
                </Button>
              </CardContent>
            </Card>

            {/* Mailing Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <CardTitle>Mailing Address</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {hasMailingAddress ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-sm text-gray-600">Street</Label>
                      <p className="font-semibold">{company?.mailingAddress?.street}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">City</Label>
                      <p className="font-semibold">{company?.mailingAddress?.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">State</Label>
                      <p className="font-semibold">{company?.mailingAddress?.state}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">ZIP</Label>
                      <p className="font-semibold">{company?.mailingAddress?.zip}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Not Assigned</p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={() => setMailingAddressDialogOpen(true)}
                >
                  {hasMailingAddress ? "Update" : "Assign"} Mailing Address
                </Button>
              </CardContent>
            </Card>

            {/* Business Owners/Members */}
            {company?.members && company.members.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <CardTitle>Business Owners</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.members.map((member: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-lg">
                              {getDisplayValue(member.name || member.address, "Member")}
                            </p>
                            {member.address && <p className="text-sm text-gray-600 mt-1">{member.address}</p>}
                          </div>
                          {member.isResponsiblePerson && (
                            <Badge className="bg-blue-100 text-blue-800">Responsible</Badge>
                          )}
                        </div>
                        {member.needsItin && (
                          <Badge variant="outline" className="mt-3">
                            ITIN Required
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Purchased Add-ons */}
            {addons.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-cyan-600" />
                    <CardTitle>Purchased Add-ons</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {addons.map((addon: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{getAddonName(typeof addon === "string" ? addon : addon.id)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Status */}
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <CardTitle>Order Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Current Status</Label>
                  <Badge className="mt-2 text-base py-1">{order.status || "Pending"}</Badge>
                </div>
                <div>
                  <Label htmlFor="status-select" className="text-sm text-gray-600">
                    Change Status
                  </Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="status-select" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
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
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-green-600" />
                  <CardTitle>Order Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge variant="outline">{order.paymentStatus || "Pending"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold">{order.paymentMethod || "N/A"}</span>
                </div>
                {isOverdue && (
                  <div className="flex gap-2 p-2 bg-red-50 rounded text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="text-xs">Order is overdue ({weeksSinceOrder} weeks)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-purple-600" />
                  <CardTitle>Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(milestones).map(([key, completed]) => (
                  <div key={key} className="flex items-center gap-3">
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={completed ? "font-semibold" : "text-gray-600"}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
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
