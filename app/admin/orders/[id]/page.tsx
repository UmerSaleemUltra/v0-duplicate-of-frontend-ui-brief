"use client"

// Order Detail Page - Admin view for managing individual orders
import { Switch } from "@/components/ui/switch"
import { StatusUpdateModal } from "@/components/status-update-modal"
import { AdminManualDataModal } from "@/components/admin-manual-data-modal"
import { MilestonesDialog } from "@/components/admin/milestones-dialog"

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
import { Skeleton } from "@/components/ui/skeleton"
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
  Plus,
  Receipt,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { CompanyDetailsModal } from "@/components/modals/company-details-modal"

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
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null)
  const [companyStatusDialogOpen, setCompanyStatusDialogOpen] = useState(false)
  const [registeredAgentStatusDialogOpen, setRegisteredAgentStatusDialogOpen] = useState(false)
  const [businessAddressStatusDialogOpen, setBusinessAddressStatusDialogOpen] = useState(false)
  const [serviceStatusDialogOpen, setServiceStatusDialogOpen] = useState(false)

  // Corrected undeclared variables:
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
  const [taxInfoDialogOpen, setTaxInfoDialogOpen] = useState(false)
  const [taxData, setTaxData] = useState({
    taxClassification: "",
    annualReportFilingDate: "",
    irsFilingDate: "",
    itin: "",
  })
  const [taxUpdating, setTaxUpdating] = useState(false)
  // Removed duplicate addMilestoneDialogOpen state

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
    orderSuccessfullyProcessed: false,
    registeredAgentAssigned: false,
    businessMailingAddressIssued: false,
    companyFormationCompleted: false,
    einApplicationSubmitted: false,
    einObtainedFromApis: false,
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
      setDeletingMilestoneId(milestoneId)
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
    } finally {
      setDeletingMilestoneId(null)
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
          orderSuccessfullyProcessed: orderData.company.milestones.orderSuccessfullyProcessed || false,
          registeredAgentAssigned: orderData.company.milestones.registeredAgentAssigned || false,
          businessMailingAddressIssued: orderData.company.milestones.businessMailingAddressIssued || false,
          companyFormationCompleted: orderData.company.milestones.companyFormationCompleted || false,
          einApplicationSubmitted: orderData.company.milestones.einApplicationSubmitted || false,
          einObtainedFromApis: orderData.company.milestones.einObtainedFromApis || false,
        })
      } else {
        // Initialize with default false values if no milestones exist
        setMilestones({
          orderSuccessfullyProcessed: false,
          registeredAgentAssigned: false,
          businessMailingAddressIssued: false,
          companyFormationCompleted: false,
          einApplicationSubmitted: false,
          einObtainedFromApis: false,
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

  // Alias for loadOrderData to use in handleSaveTaxInfo
  const fetchOrderData = loadOrderData

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
        updatedMilestones.orderSuccessfullyProcessed = true
      }
      if (titleLower.includes("registered agent") || titleLower.includes("agent appointed")) {
        updatedMilestones.registeredAgentAssigned = true
      }
      if (titleLower.includes("address") || titleLower.includes("mailing")) {
        updatedMilestones.businessMailingAddressIssued = true
      }
      if (titleLower.includes("formation") || titleLower.includes("certificate")) {
        updatedMilestones.companyFormationCompleted = true
      }
      if (titleLower.includes("ein") || titleLower.includes("tax id")) {
        updatedMilestones.einObtainedFromApis = true
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
          registeredAgentStatus: "active",
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
          mailingAddressStatus: "active",
          milestones: {
            ...milestones,
            businessMailingAddressIssued: true,
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
      setMilestones(updatedCompany.milestones || { ...milestones, businessMailingAddressIssued: true })
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
            einObtainedFromApis: true,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to assign EIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] EIN assigned successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, einObtainedFromApis: true })
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
            companyFormationCompleted: true,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to assign Business ID")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] Business ID assigned successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, companyFormationCompleted: true })
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
      const token = authService.getToken()
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
        router.push("/admin/customers")
      } else {
        router.push("/admin/orders")
      }
    } catch (err: any) {
      console.error("[v0] Delete error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete order",
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

  const handleSaveTaxInfo = async () => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company ID not found",
        variant: "destructive",
      })
      return
    }

    setTaxUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const taxPayload: any = {}
      if (taxData.taxClassification?.trim()) {
        taxPayload.taxClassification = taxData.taxClassification.trim()
      }
      if (taxData.annualReportFilingDate?.trim()) {
        taxPayload.annualReportFilingDate = taxData.annualReportFilingDate.trim()
      }
      if (taxData.irsFilingDate?.trim()) {
        taxPayload.irsFilingDate = taxData.irsFilingDate.trim()
      }
      if (taxData.itin?.trim()) {
        taxPayload.itin = taxData.itin.trim()
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taxPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update tax information")
      }

      const result = await response.json()
      setCompany(result.data) // Update company state with the latest data

      toast({
        title: "Success",
        description: "Tax information updated successfully",
      })

      setTaxInfoDialogOpen(false)
      // Reload order data to reflect changes, especially for ITIN if updated
      fetchOrderData()
    } catch (err: any) {
      console.error("[v0] Tax update error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update tax information",
        variant: "destructive",
      })
    } finally {
      setTaxUpdating(false)
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
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
            einObtainedFromApis: false,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to remove EIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] EIN removed successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, einObtainedFromApis: false })

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
            companyFormationCompleted: false,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to remove Business ID")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] Business ID removed successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, companyFormationCompleted: false })

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

  // Removed duplicate Status Management section
  // Removed duplicate handleUpdateCompanyStatus
  // Removed duplicate handleUpdateRegisteredAgentStatus
  // Removed duplicate handleUpdateBusinessAddressStatus
  // Removed duplicate handleUpdateServiceStatus

  return (
    <div className="space-y-6">
      {/* Header - Prominent Order ID */}
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
            <h1 className="text-2xl font-semibold text-slate-900">Order Details</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                <Package className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600 font-medium">Order ID:</span>
                <span className="font-mono text-sm font-semibold text-slate-900">{order.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Main Content - Responsive Grid */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-600" />
                  Customer Information
                </CardTitle>
                {!editingCustomer && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(true)} className="h-9 text-xs w-full sm:w-auto">
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingCustomer ? (
                <div className="space-y-4">
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCustomer} size="sm">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCustomer(false)
                        setCustomerForm({
                          name: customer?.name || "",
                          email: customer?.email || "",
                          phone: customer?.phone || "",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-600 mb-1.5 font-medium">Customer Name</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{customer?.name || "Unknown"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-600 mb-1.5 font-medium">Email Address</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{customer?.email || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-600 mb-1.5 font-medium">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{customer?.phone || "N/A"}</p>
                  </div>
                </div>
              )}
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
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.orderSuccessfullyProcessed ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${milestones.orderSuccessfullyProcessed ? "text-green-600" : "text-slate-400"}`} />
                    <span
                      className={`text-sm font-medium ${milestones.orderSuccessfullyProcessed ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Order Successfully Processed
                    </span>
                  </div>
                  {milestones.orderSuccessfullyProcessed ? (
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
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.businessMailingAddressIssued ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <Home
                      className={`w-5 h-5 ${milestones.businessMailingAddressIssued ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${milestones.businessMailingAddressIssued ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Business Mailing Address Issued
                    </span>
                  </div>
                  {milestones.businessMailingAddressIssued ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.companyFormationCompleted ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck
                      className={`w-5 h-5 ${milestones.companyFormationCompleted ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${milestones.companyFormationCompleted ? "text-slate-900" : "text-slate-600"}`}
                    >
                      Company Formation Completed
                    </span>
                  </div>
                  {milestones.companyFormationCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${milestones.einObtainedFromApis ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <HashIcon className={`w-5 h-5 ${milestones.einObtainedFromApis ? "text-green-600" : "text-slate-400"}`} />
                    <span
                      className={`text-sm font-medium ${milestones.einObtainedFromApis ? "text-slate-900" : "text-slate-600"}`}
                    >
                      EIN Successfully Processed
                    </span>
                  </div>
                  {milestones.einObtainedFromApis ? (
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
                    {company.customMilestones.map((milestone) => (
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

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-600" />
                  Company Information
                </CardTitle>
                {!editingCompany && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingCompany(true)} className="h-9 text-xs w-full sm:w-auto">
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingCompany ? (
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={companyForm.state}
                      onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label>Business Category</Label>
                    <Input
                      value={companyForm.businessCategory}
                      onChange={(e) => setCompanyForm({ ...companyForm, businessCategory: e.target.value })}
                      placeholder="Enter business category"
                    />
                  </div>
                  <div>
                    <Label>Business Website</Label>
                    <Input
                      value={companyForm.businessWebsite}
                      onChange={(e) => setCompanyForm({ ...companyForm, businessWebsite: e.target.value })}
                      placeholder="Enter website URL"
                    />
                  </div>
                  <div>
                    <Label>Business Description</Label>
                    <Textarea
                      value={companyForm.businessDescription}
                      onChange={(e) => setCompanyForm({ ...companyForm, businessDescription: e.target.value })}
                      placeholder="Enter business description"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCompany} size="sm">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCompany(false)
                        setCompanyForm({
                          name: company?.name || "",
                          state: company?.state || "",
                          businessCategory: company?.businessCategory || "",
                          businessWebsite: company?.businessWebsite || "",
                          businessDescription: company?.businessDescription || "",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Information Grid */}
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

                  {/* Business Description */}
                  {company.businessDescription && (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-2">Business Description</p>
                      <p className="text-sm text-slate-900 leading-relaxed">{company.businessDescription}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {company?.members && company.members.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-600" />
                    Business Owners / Members
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    <span className="font-semibold text-slate-900">{company.members.length}</span> member{company.members.length !== 1 ? "s" : ""} registered
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.members.map((member: any, index: number) => (
                    <div
                      key={member.id || index}
                      className={`p-5 rounded-xl border-2 ${member.responsiblePerson ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-300 shadow-sm" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full ${member.responsiblePerson ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : "bg-slate-400"} flex items-center justify-center shadow-md`}
                          >
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{member.name || "N/A"}</h3>
                            {member.responsiblePerson && (
                              <Badge
                                variant="secondary"
                                className="mt-1.5 text-xs bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0"
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Responsible Person
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-medium">
                          Member #{index + 1}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {member.email && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <p className="text-xs text-slate-500 mb-1.5 font-medium">Email Address</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">{member.email}</p>
                          </div>
                        )}
                        {member.phone && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <p className="text-xs text-slate-500 mb-1.5 font-medium">Phone Number</p>
                            <p className="text-sm font-semibold text-slate-900">{member.phone}</p>
                          </div>
                        )}
                        {member.address && (
                          <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <p className="text-xs text-slate-500 mb-1.5 font-medium">Full Address</p>
                            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                              {member.address}
                              {member.city && `, ${member.city}`}
                              {member.state && `, ${member.state}`}
                              {member.zip && ` ${member.zip}`}
                              {member.country && `, ${member.country}`}
                            </p>
                          </div>
                        )}
                        {member.ssn && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <p className="text-xs text-slate-500 mb-1.5 font-medium">SSN / ITIN</p>
                            <p className="text-sm font-semibold text-slate-900 font-mono">{member.ssn}</p>
                          </div>
                        )}
                        {member.passportUrl && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <p className="text-xs text-slate-500 mb-2 font-medium">Passport / ID Document</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(member.passportUrl, "_blank")}
                              className="w-full justify-center h-9 bg-transparent hover:bg-slate-100"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          </div>
                        )}
                        {member.itinAdded && (
                          <div className="sm:col-span-2">
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800 px-3 py-1.5 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
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

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" />
                Order & Pricing Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pricing Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-600 mb-1.5 font-medium">Package Price</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${(order?.pricing?.packagePrice || order?.packagePrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-600 mb-1.5 font-medium">State Filing Fee</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${(order?.pricing?.stateFilingFee || order?.stateFilingFee || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-600 mb-1.5 font-medium">Add-ons Total</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${(order?.pricing?.addonsTotal || order?.addonsTotal || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] border border-transparent shadow-md">
                    <p className="text-xs text-white/90 mb-1.5 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-white">
                      ${(order?.pricing?.total || order?.pricing?.totalAmount || order?.amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Method</p>
                      <p className="text-sm font-medium text-slate-900 capitalize">
                        {order?.paymentInfo?.method || order?.paymentMethod || "Not specified"}
                      </p>
                      {/* Show WhatsApp Phone if payment method is WhatsApp */}
                      {(order?.paymentInfo?.method?.toLowerCase() === "whatsapp" ||
                        order?.paymentInfo?.method?.toLowerCase() === "whatsapp phone") &&
                        order?.paymentInfo?.phone && (
                          <p className="text-xs text-slate-600 mt-1">
                            Phone: <span className="font-mono text-slate-900">{order.paymentInfo.phone}</span>
                          </p>
                        )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Status</p>
                      <Badge variant={order?.paymentInfo?.status === "paid" ? "default" : "secondary"}>
                        {order?.paymentInfo?.status || "Pending"}
                      </Badge>
                    </div>
                    {/* Show Receipt URL if available */}
                    {order?.paymentInfo?.receiptUrl && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-600 mb-1">Payment Receipt</p>
                        <a
                          href={order.paymentInfo.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Receipt className="w-4 h-4" />
                          View Receipt
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Date */}
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

          {/* Add-ons Card */}
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-600" />
                  Add-ons
                </CardTitle>
                <p className="text-sm text-slate-600 mt-2">Selected services and add-ons</p>
              </div>
            </CardHeader>
            <CardContent>
              {order?.addons && order.addons.length > 0 ? (
                <div className="space-y-3">
                  {order.addons.map((addon: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{addon.name || addon.title || addon}</p>
                          {addon.price && (
                            <p className="text-xs text-slate-600 mt-1">${addon.price.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Add-ons Total</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${(order?.pricing?.addonsTotal || order?.addonsTotal || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300">
                  <p className="text-sm text-slate-600">No add-ons selected for this order</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Actions
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">Manage order and company details</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button
                  onClick={() => setCustomMilestoneDialogOpen(true)}
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Milestone
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setRegisteredAgentDialogOpen(true)}
                  disabled={agentUpdating || !company}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">Assign Registered Agent</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setMailingAddressDialogOpen(true)}
                  disabled={addressUpdating || !company}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">Assign Mailing Address</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setEinDialogOpen(true)}
                  disabled={einUpdating || !company}
                >
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">{hasEIN ? "View/Edit EIN" : "Assign EIN"}</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setItinDialogOpen(true)}
                  disabled={itinUpdating || !company}
                >
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">{company?.itin ? "View/Edit ITIN" : "Assign ITIN"}</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setBusinessIdDialogOpen(true)}
                  disabled={businessIdUpdating || !company}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">
                    {company?.businessId ? "View/Edit Business ID" : "Assign Business ID"}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => {
                    setTaxData({
                      taxClassification: company?.taxClassification || "",
                      annualReportFilingDate: company?.annualReportFilingDate || "",
                      irsFilingDate: company?.irsFilingDate || "",
                      itin: company?.itin || "",
                    })
                    setTaxInfoDialogOpen(true)
                  }}
                  disabled={taxUpdating || !company}
                >
                  <FileBarChart className="w-4 h-4" />
                  <span className="font-medium">Tax Information</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => setMilestonesDialogOpen(true)}
                  disabled={milestoneUpdating}
                >
                  <FileCheck className="w-4 h-4" />
                  <span className="font-medium">Manage Milestones</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-11 hover:bg-slate-50 text-slate-700 bg-transparent"
                  onClick={() => {
                    generateInvoice()
                  }}
                  disabled={deleting}
                >
                  <Download className="w-4 h-4" />
                  <span className="font-medium">Download Invoice</span>
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start h-11 hover:bg-red-600"
                  onClick={() => {
                    console.log("[v0] Delete button clicked")
                    setDeleteDialogOpen(true)
                  }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Status Management
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Manage company, registered agent, business address, and service statuses
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Company Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">Company Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">Overall company operational status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      company?.companyStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : company?.companyStatus === "inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {company?.companyStatus || "pending"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setCompanyStatusDialogOpen(true)} className="h-8">
                    Update
                  </Button>
                </div>
              </div>

              {/* Registered Agent Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">Registered Agent Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">Agent assignment and service status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      company?.registeredAgentStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : company?.registeredAgentStatus === "inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {company?.registeredAgentStatus || "pending"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRegisteredAgentStatusDialogOpen(true)}
                    className="h-8"
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Business Address Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">Business Address Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">Mailing address setup status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      company?.businessAddressStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : company?.businessAddressStatus === "inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {company?.businessAddressStatus || "pending"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBusinessAddressStatusDialogOpen(true)}
                    className="h-8"
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Service Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">Service Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">Overall service delivery status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      company?.serviceStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : company?.serviceStatus === "inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {company?.serviceStatus || "pending"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setServiceStatusDialogOpen(true)} className="h-8">
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registered Agent Address - Conditional Rendering */}
          {company?.registeredAgent && company.registeredAgent.address && (
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Progress Tracking
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    <span className="font-semibold text-slate-900">{completedMilestonesWithCustom}</span> of{" "}
                    <span className="font-semibold text-slate-900">{totalMilestonesWithCustom}</span> milestones completed
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCustomMilestoneDialogOpen(true)} className="h-9 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom
                </Button>
              </div>
            </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-sm font-medium text-slate-900">{company.registeredAgent.companyName}</p>
                  <p className="text-sm text-slate-700">{company.registeredAgent.address}</p>
                  {company.registeredAgent.city && (
                    <p className="text-sm text-slate-700">
                      {company.registeredAgent.city}
                      {company.registeredAgent.state && `, ${company.registeredAgent.state}`}
                      {company.registeredAgent.zipCode && ` ${company.registeredAgent.zipCode}`}
                    </p>
                  )}
                  {company.registeredAgent.servicePeriod && (
                    <p className="text-xs text-slate-600 mt-2">Service Period: {company.registeredAgent.servicePeriod}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mailing Address - Conditional Rendering */}
          {company?.mailingAddress && company.mailingAddress.address && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Mailing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-sm font-medium text-slate-900">{company.mailingAddress.addressType || "Business Mailing Address"}</p>
                  <p className="text-sm text-slate-700">{company.mailingAddress.address}</p>
                  {company.mailingAddress.city && (
                    <p className="text-sm text-slate-700">
                      {company.mailingAddress.city}
                      {company.mailingAddress.state && `, ${company.mailingAddress.state}`}
                      {company.mailingAddress.zipCode && ` ${company.mailingAddress.zipCode}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* EIN - Conditional Rendering */}
          {hasEIN && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  EIN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Employer Identification Number</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{company?.ein}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business ID - Conditional Rendering */}
          {company?.businessId && company.businessId.trim() !== "" && !company.businessId.includes("PENDING") && company.businessId !== "BIZ-PENDING" && company.businessId !== "N/A" && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business ID
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">State Business License ID</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{company?.businessId}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ITIN - Conditional Rendering */}
          {company?.itin && company.itin.trim() !== "" && company.itin !== "N/A" && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Hash className="w-5 h-4" />
                  ITIN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Individual Taxpayer Identification Number</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{company?.itin}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Manage Milestones Dialog */}
      <MilestonesDialog
        open={milestonesDialogOpen}
        onOpenChange={setMilestonesDialogOpen}
        company={company}
        milestones={milestones}
        milestoneUpdating={milestoneUpdating}
        completedDefaultMilestones={completedDefaultMilestones}
        totalDefaultMilestones={totalDefaultMilestones}
        completionPercentage={completionPercentage}
        completedMilestonesWithCustom={completedMilestonesWithCustom}
        totalMilestonesWithCustom={totalMilestonesWithCustom}
        onMilestoneToggle={handleMilestoneToggle}
        onDeleteCustomMilestone={handleDeleteCustomMilestone}
        deletingMilestoneId={deletingMilestoneId}
      />

      {/* Custom Milestone Dialog */}
      <Dialog open={customMilestoneDialogOpen} onOpenChange={handleCloseCustomMilestoneDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add Custom Milestone</DialogTitle>
            <DialogDescription>
              Create a custom milestone for {company?.name} that will appear in their progress tracker
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customMilestoneTitle">Milestone Title *</Label>
              <Input
                id="customMilestoneTitle"
                placeholder="e.g., Business License Approved"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customMilestoneDescription">Description (Optional)</Label>
              <Textarea
                id="customMilestoneDescription"
                placeholder="Add any notes about this milestone..."
                value={newMilestoneDescription}
                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setCustomMilestoneDialogOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomMilestone}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!newMilestoneTitle.trim() || milestoneUpdating}
              >
                {milestoneUpdating ? "Adding..." : "Add Milestone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={registeredAgentDialogOpen} onOpenChange={handleCloseRegisteredAgentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign Registered Agent</DialogTitle>
            <DialogDescription>
              Assign a registered agent for {company?.name}. This will update the company records and mark the milestone
              as complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name *</Label>
                <Input
                  id="agentName"
                  placeholder="John Doe"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentCompany">Company Name</Label>
                <Input
                  id="agentCompany"
                  placeholder="Agent Services LLC"
                  value={agentForm.company}
                  onChange={(e) => setAgentForm({ ...agentForm, company: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentAddress">Street Address *</Label>
              <Input
                id="agentAddress"
                placeholder="123 Main Street"
                value={agentForm.address}
                onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentCity">City</Label>
                <Input
                  id="agentCity"
                  placeholder="Miami"
                  value={agentForm.city}
                  onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentState">State</Label>
                <Input
                  id="agentState"
                  placeholder="FL"
                  value={agentForm.state}
                  onChange={(e) => setAgentForm({ ...agentForm, state: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentZip">ZIP Code</Label>
                <Input
                  id="agentZip"
                  placeholder="33101"
                  value={agentForm.zip}
                  onChange={(e) => setAgentForm({ ...agentForm, zip: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicePeriod">Service Period</Label>
              <Select
                value={agentForm.servicePeriod}
                onValueChange={(value) => setAgentForm({ ...agentForm, servicePeriod: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Year">1 Year</SelectItem>
                  <SelectItem value="2 Years">2 Years</SelectItem>
                  <SelectItem value="3 Years">3 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setRegisteredAgentDialogOpen(false)} disabled={agentUpdating}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignRegisteredAgent}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={agentUpdating}
              >
                {agentUpdating ? (
                  "Assigning..."
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={einDialogOpen} onOpenChange={handleCloseEinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign EIN</DialogTitle>
            <DialogDescription>
              Assign a Employer Identification Number (EIN) for {company?.name}. This will update the company records
              and mark the EIN milestone as complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="einInput">EIN (Employer Identification Number) *</Label>
              <Input
                id="einInput"
                placeholder="12-3456789"
                value={einValue}
                onChange={(e) => setEinValue(e.target.value)}
                className="h-10 font-mono"
                maxLength={10}
              />
              <p className="text-xs text-slate-500">Format: XX-XXXXXXX (9 digits with hyphen)</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The EIN will be formatted automatically and the "EIN Successfully Processed"
                milestone will be marked as complete.
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

      {/* Company Details Modal */}
      <CompanyDetailsModal
        company={selectedCompany}
        orderId={order?.id || ""}
        isOpen={companyModalOpen && !!selectedCompany}
        onClose={() => setCompanyModalOpen(false)}
        passportDocuments={passportDocuments}
        orderDate={order?.createdAt}
      />

      {/* Delete Confirmation Dialog */}
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

      {/* Add status update modals */}
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

      {/* Manual Data Modals */}
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

      <Dialog open={taxInfoDialogOpen} onOpenChange={setTaxInfoDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tax Information</DialogTitle>
            <DialogDescription>Manage tax classification and filing dates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taxClassification">Tax Classification</Label>
              <Input
                id="taxClassification"
                placeholder="e.g., S-Corporation, Partnership"
                value={taxData.taxClassification}
                onChange={(e) => setTaxData({ ...taxData, taxClassification: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="annualReportFilingDate">Annual Report Filing Date</Label>
              <Input
                id="annualReportFilingDate"
                type="date"
                value={taxData.annualReportFilingDate}
                onChange={(e) => setTaxData({ ...taxData, annualReportFilingDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="irsFilingDate">IRS Filing Date</Label>
              <Input
                id="irsFilingDate"
                type="date"
                value={taxData.irsFilingDate}
                onChange={(e) => setTaxData({ ...taxData, irsFilingDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="itin">ITIN (Optional)</Label>
              <Input
                id="itin"
                placeholder="Individual Taxpayer Identification Number"
                value={taxData.itin}
                onChange={(e) => setTaxData({ ...taxData, itin: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty if not applicable</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxInfoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTaxInfo} disabled={taxUpdating}>
              {taxUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
