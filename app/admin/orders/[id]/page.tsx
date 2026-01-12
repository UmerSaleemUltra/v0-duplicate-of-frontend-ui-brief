"use client"

import { Switch } from "@/components/ui/switch"
import { StatusUpdateModal } from "@/components/status-update-modal"

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
  FileCheck,
  HashIcon,
  FileBarChart,
  Loader2,
  MapPin,
  Trash2,
  Plus,
  Receipt,
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

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !company) return

    setStatusUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      // Update the order status directly
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
      setOrder(result.data) // Update local order state
      setCompany(result.data.company) // Update company state if it's part of the response

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update order status",
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
      console.error("[v0] Error uploading document:", error)
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
      console.error("[v0] Error updating company info:", error)
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
      console.error("[v0] Error updating company status:", error)
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
      console.error("[v0] Error updating registered agent status:", error)
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
      console.error("[v0] Error updating business address status:", error)
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
      console.error("[v0] Error updating service status:", error)
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
  // const completedDefaultMilestones = Object.values(milestones).filter(Boolean).length;
  // const totalDefaultMilestones = Object.keys(milestones).length;
  // const completionPercentage =
  //   totalDefaultMilestones > 0 ? Math.round((completedDefaultMilestones / totalDefaultMilestones) * 100) : 0;

  // const totalMilestonesWithCustom = totalDefaultMilestones + (company?.customMilestones?.length || 0);
  // const completedMilestonesWithCustom =
  //   completedDefaultMilestones + (company?.customMilestones?.filter((m: any) => m.completed).length || 0);

  // Milestone progress calculation
  let completedDefaultMilestones = 0
  let totalDefaultMilestones = 0
  let completionPercentage = 0

  // Calculate only if milestones object is not empty
  if (milestones && Object.keys(milestones).length > 0) {
    completedDefaultMilestones = Object.values(milestones).filter(Boolean).length
    totalDefaultMilestones = Object.keys(milestones).length
    completionPercentage =
      totalDefaultMilestones > 0 ? Math.round((completedDefaultMilestones / totalDefaultMilestones) * 100) : 0
  }

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
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={generateInvoice} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            <Download className="w-4 h-4 mr-2" />
            Invoice
          </Button>
          <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" className="flex items-center">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Order
          </Button>
        </div>
      </div>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-5 h-5 mr-3 text-muted-foreground" />
              <span>Order #{order.id}</span>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm text-gray-600">Customer</Label>
              <p className="text-base font-medium">{getDisplayValue(customer?.name)}</p>
              <p className="text-sm text-gray-500">{getDisplayValue(customer?.email, "N/A")}</p>
              <p className="text-sm text-gray-500">{getDisplayValue(customer?.phone, "N/A")}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Company</Label>
              <p className="text-base font-medium cursor-pointer" onClick={handleViewCompanyDetails}>
                {getDisplayValue(company?.name)}
              </p>
              <p className="text-sm text-gray-500">{getDisplayValue(company?.state)}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Order Date</Label>
              <p className="text-base font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Payment Status</Label>
              <p
                className={`text-base font-medium capitalize ${order?.paymentInfo?.status === "paid" ? "text-green-600" : "text-yellow-700"}`}
              >
                {order?.paymentInfo?.status || "Pending"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Amount</Label>
              <p className="text-base font-medium">${order?.amount.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Weeks Since Order</Label>
              <p className="text-base font-medium">
                {weeksSinceOrder} weeks {isOverdue && <span className="text-red-500">(Overdue)</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Update Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Update Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStatusUpdate} disabled={!newStatus || statusUpdating}>
              {statusUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-3 text-muted-foreground" />
            Company Information
          </CardTitle>
          {/* Replaced editing section */}
          <Button variant="ghost" onClick={() => setEditingCompany(!editingCompany)}>
            {editingCompany ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {!editingCompany && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-slate-500">Company Name</Label>
                <p className="text-sm font-medium text-slate-900">{company?.name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Entity Type</Label>
                <p className="text-sm text-slate-600">{company?.type || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">State</Label>
                <p className="text-sm text-slate-600">{company?.state || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Business Category</Label>
                <p className="text-sm text-slate-600">{company?.businessCategory || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Business Website</Label>
                <p className="text-sm text-slate-600">
                  {company?.businessWebsite ? (
                    <a
                      href={company.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {getDisplayValue(company.businessWebsite)}
                    </a>
                  ) : (
                    getDisplayValue(company?.businessWebsite)
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Business Description</Label>
                <p className="text-sm text-slate-600">{getDisplayValue(company?.businessDescription) || "N/A"}</p>
              </div>
            </div>
          )}
          {editingCompany && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveCompany()
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    defaultValue={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyState">State</Label>
                  <Input
                    id="companyState"
                    defaultValue={companyForm.state}
                    onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessCategory">Business Category</Label>
                  <Input
                    id="businessCategory"
                    defaultValue={companyForm.businessCategory}
                    onChange={(e) => setCompanyForm({ ...companyForm, businessCategory: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessWebsite">Business Website</Label>
                  <Input
                    id="businessWebsite"
                    defaultValue={companyForm.businessWebsite}
                    onChange={(e) => setCompanyForm({ ...companyForm, businessWebsite: e.target.value })}
                  />
                </div>
                <div className="col-span-full">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    defaultValue={companyForm.businessDescription}
                    onChange={(e) => setCompanyForm({ ...companyForm, businessDescription: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button type="submit">Save Company Info</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Business Owners / Members Section */}
      {company?.members && company.members.length > 0 && (
        <Card className="border-slate-200 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              Business Owners / Members
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {company.members.length} member{company.members.length !== 1 ? "s" : ""} registered
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.members.map((member: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  member.responsiblePerson ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{member.name || "N/A"}</p>
                    <div className="mt-2 space-y-1">
                      {member.address && <p className="text-xs text-slate-600">{member.address}</p>}
                      {member.city && (
                        <p className="text-xs text-slate-600">
                          {member.city}, {member.state} {member.zip}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.responsiblePerson && (
                    <Badge className="bg-blue-600 text-white text-xs">Responsible Person</Badge>
                  )}
                </div>
                {member.needsItin && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <Badge variant="secondary" className="text-xs">
                      ITIN Required
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Customer Information Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-3 text-muted-foreground" />
            Customer Information
          </CardTitle>
          {/* Removed Edit button and form for customer information section */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-slate-500">Name</Label>
              <p className="text-sm font-medium text-slate-900">{customer?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500">Email</Label>
              <p className="text-sm text-slate-600">{customer?.email || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500">Phone</Label>
              <p className="text-sm text-slate-600">{customer?.phone || "N/A"}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Milestones Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <FileCheck className="w-5 h-5 mr-3 text-muted-foreground" />
            Formation Milestones
          </CardTitle>
          <Button variant="outline" onClick={() => setMilestonesDialogOpen(true)}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(milestones)
              .filter(([key]) => key !== "customMilestones") // Filter out customMilestones if it exists here
              .map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={Boolean(value)}
                    onCheckedChange={() => handleMilestoneToggle(key as keyof typeof milestones)}
                  />
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm text-gray-600">Custom Milestones</Label>
            {company?.customMilestones && company.customMilestones.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {company.customMilestones.map((milestone: any) => (
                  <li key={milestone.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{milestone.title}</span>
                      {milestone.description && <p className="text-xs text-gray-500">{milestone.description}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={milestone.completed}
                        onCheckedChange={() => handleCustomMilestoneToggle(milestone.id)}
                      />
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCustomMilestone(milestone.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No custom milestones added yet.</p>
            )}
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => setCustomMilestoneDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Custom Milestone
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <Label>Overall Progress</Label>
              <span className="text-sm font-medium">
                {Math.round((completedMilestonesWithCustom / totalMilestonesWithCustom) * 100) || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.round((completedMilestonesWithCustom / totalMilestonesWithCustom) * 100) || 0}%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addons Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-3 text-muted-foreground" />
            Purchased Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addons.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addons.map((addon: any, index: number) => (
                <li key={index} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">
                    {getAddonName(typeof addon === "object" ? addon.serviceId : addon)}
                  </span>
                  {typeof addon === "object" && addon.price && (
                    <span className="text-gray-700">${addon.price.toFixed(2)}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No add-ons purchased for this order.</p>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
            Documents
          </CardTitle>
          <Button variant="outline" onClick={() => setUploadDocDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {passportDocuments.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passportDocuments.map((doc: any) => (
                <li key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {doc.name}
                    </a>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Registered Agent & Addresses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Registered Agent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-3 text-muted-foreground" />
              Registered Agent
            </CardTitle>
            {company?.registeredAgent?.name ? (
              <Button variant="ghost" onClick={() => setRegisteredAgentDialogOpen(true)}>
                Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setRegisteredAgentDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Assign Agent
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {company?.registeredAgent?.name ? (
              <>
                <p className="text-base font-medium">{getDisplayValue(company.registeredAgent.name)}</p>
                <p className="text-sm text-gray-500">{getDisplayValue(company.registeredAgent.company)}</p>
                <p className="text-sm text-gray-500">{getDisplayValue(company.registeredAgent.address)}</p>
                <p className="text-sm text-gray-500">
                  {getDisplayValue(company.registeredAgent.city)}, {getDisplayValue(company.registeredAgent.state)}{" "}
                  {getDisplayValue(company.registeredAgent.zip)}
                </p>
                <p className="text-sm text-gray-500">Phone: {getDisplayValue(company.registeredAgent.phone)}</p>
                <p className="text-sm text-gray-500">Email: {getDisplayValue(company.registeredAgent.email)}</p>
                <p className="text-sm text-gray-500">
                  Service Period: {getDisplayValue(company.registeredAgent.servicePeriod)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No registered agent assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Mailing Address */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-3 text-muted-foreground" />
              Mailing Address
            </CardTitle>
            {hasMailingAddress ? (
              <Button variant="ghost" onClick={() => setMailingAddressDialogOpen(true)}>
                Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setMailingAddressDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Assign Address
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {hasMailingAddress ? (
              <>
                <p className="text-base font-medium">{getDisplayValue(company.mailingAddress.street)}</p>
                <p className="text-sm text-gray-500">
                  {getDisplayValue(company.mailingAddress.city)}, {getDisplayValue(company.mailingAddress.state)}{" "}
                  {getDisplayValue(company.mailingAddress.zip)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No mailing address assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax IDs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* EIN */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <HashIcon className="w-5 h-5 mr-3 text-muted-foreground" />
              EIN (Employer Identification Number)
            </CardTitle>
            {hasEIN ? (
              <Button variant="ghost" onClick={handleRemoveEIN}>
                Remove
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setEinDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Assign EIN
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{formatEIN(company?.ein, true)}</p>
          </CardContent>
        </Card>

        {/* ITIN */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Hash className="w-5 h-5 mr-3 text-muted-foreground" />
              ITIN (Individual Taxpayer Identification Number)
            </CardTitle>
            {company?.itin ? (
              <Button variant="ghost" onClick={handleRemoveITIN}>
                Remove
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setItinDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Assign ITIN
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{getDisplayValue(company?.itin)}</p>
          </CardContent>
        </Card>

        {/* Business ID */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <FileBarChart className="w-5 h-5 mr-3 text-muted-foreground" />
              Business ID / Registration Number
            </CardTitle>
            {hasBusinessId ? (
              <Button variant="ghost" onClick={handleRemoveBusinessId}>
                Remove
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setBusinessIdDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Assign Business ID
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium uppercase">{formatBusinessId(company?.businessId)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs for Updates */}
      <StatusUpdateModal
        isOpen={companyStatusDialogOpen}
        onClose={() => setCompanyStatusDialogOpen(false)}
        onUpdate={(status) => handleCompanyStatusUpdate(status as any)}
        title="Update Company Status"
      />
      <StatusUpdateModal
        isOpen={registeredAgentStatusDialogOpen}
        onClose={() => setRegisteredAgentStatusDialogOpen(false)}
        onUpdate={(status) => handleRegisteredAgentStatusUpdate(status as any)}
        title="Update Registered Agent Status"
      />
      <StatusUpdateModal
        isOpen={businessAddressStatusDialogOpen}
        onClose={() => setBusinessAddressStatusDialogOpen(false)}
        onUpdate={(status) => handleBusinessAddressStatusUpdate(status as any)}
        title="Update Business Address Status"
      />
      <StatusUpdateModal
        isOpen={serviceStatusDialogOpen}
        onClose={() => setServiceStatusDialogOpen(false)}
        onUpdate={(status) => handleServiceStatusUpdate(status as any)}
        title="Update Service Status"
      />

      {/* Assign Registered Agent Modal */}
      <Dialog open={registeredAgentDialogOpen} onOpenChange={handleCloseRegisteredAgentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Registered Agent</DialogTitle>
            <DialogDescription>Enter the details for the registered agent.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAssignRegisteredAgent()
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentName" className="text-right">
                  Name
                </Label>
                <Input
                  id="agentName"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentCompany" className="text-right">
                  Company
                </Label>
                <Input
                  id="agentCompany"
                  value={agentForm.company}
                  onChange={(e) => setAgentForm({ ...agentForm, company: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentAddress" className="text-right">
                  Address
                </Label>
                <Input
                  id="agentAddress"
                  value={agentForm.address}
                  onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentCity" className="text-right">
                  City
                </Label>
                <Input
                  id="agentCity"
                  value={agentForm.city}
                  onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentState" className="text-right">
                  State
                </Label>
                <Input
                  id="agentState"
                  value={agentForm.state}
                  onChange={(e) => setAgentForm({ ...agentForm, state: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentZip" className="text-right">
                  Zip
                </Label>
                <Input
                  id="agentZip"
                  value={agentForm.zip}
                  onChange={(e) => setAgentForm({ ...agentForm, zip: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentPhone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="agentPhone"
                  value={agentForm.phone}
                  onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="agentEmail"
                  type="email"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentServicePeriod" className="text-right">
                  Service Period
                </Label>
                <Select
                  onValueChange={(value) => setAgentForm({ ...agentForm, servicePeriod: value })}
                  defaultValue={agentForm.servicePeriod}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select service period" />
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
              <Button type="submit" disabled={agentUpdating}>
                {agentUpdating ? "Assigning..." : "Assign Agent"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Mailing Address Modal */}
      <Dialog open={mailingAddressDialogOpen} onOpenChange={handleCloseMailingAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Mailing Address</DialogTitle>
            <DialogDescription>Enter the company's mailing address.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAssignMailingAddress()
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mailingStreet" className="text-right">
                  Street
                </Label>
                <Input
                  id="mailingStreet"
                  value={mailingAddress.street}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, street: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mailingCity" className="text-right">
                  City
                </Label>
                <Input
                  id="mailingCity"
                  value={mailingAddress.city}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, city: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mailingState" className="text-right">
                  State
                </Label>
                <Input
                  id="mailingState"
                  value={mailingAddress.state}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, state: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mailingZip" className="text-right">
                  Zip
                </Label>
                <Input
                  id="mailingZip"
                  value={mailingAddress.zip}
                  onChange={(e) => setMailingAddress({ ...mailingAddress, zip: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addressUpdating}>
                {addressUpdating ? "Assigning..." : "Assign Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign EIN Modal */}
      <Dialog open={einDialogOpen} onOpenChange={handleCloseEinDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign EIN</DialogTitle>
            <DialogDescription>Enter the EIN for the company.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAssignEIN()
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="einValue" className="text-right">
                  EIN
                </Label>
                <Input
                  id="einValue"
                  value={einValue}
                  onChange={(e) => setEinValue(e.target.value)}
                  className="col-span-3"
                  placeholder="XX-XXXXXXX"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={einUpdating}>
                {einUpdating ? "Assigning..." : "Assign EIN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign ITIN Modal */}
      <Dialog open={itinDialogOpen} onOpenChange={handleCloseItinDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign ITIN</DialogTitle>
            <DialogDescription>Enter the ITIN for the company or contact person.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAssignITIN()
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itinValue" className="text-right">
                  ITIN
                </Label>
                <Input
                  id="itinValue"
                  value={itinValue}
                  onChange={(e) => setItinValue(e.target.value)}
                  className="col-span-3"
                  placeholder="XXX-XX-XXXX"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={itinUpdating}>
                {itinUpdating ? "Assigning..." : "Assign ITIN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Business ID Modal */}
      <Dialog open={businessIdDialogOpen} onOpenChange={handleCloseBusinessIdDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Business ID</DialogTitle>
            <DialogDescription>Enter the Business ID or Registration Number.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAssignBusinessId()
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="businessIdValue" className="text-right">
                  Business ID
                </Label>
                <Input
                  id="businessIdValue"
                  value={businessIdValue}
                  onChange={(e) => setBusinessIdValue(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={businessIdUpdating}>
                {businessIdUpdating ? "Assigning..." : "Assign Business ID"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={uploadDocDialogOpen} onOpenChange={(open) => setUploadDocDialogOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a file related to this order.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleDocumentUpload(e as any)
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentFile" className="text-right">
                  File
                </Label>
                <Input id="documentFile" type="file" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentType" className="text-right">
                  Type
                </Label>
                <Select onValueChange={setUploadDocType} defaultValue={uploadDocType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="id">ID Document</SelectItem>
                    <SelectItem value="formation_docs">Formation Documents</SelectItem>
                    <SelectItem value="tax_forms">Tax Forms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={docUploading}>
                {docUploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Milestone Modal */}
      <Dialog open={customMilestoneDialogOpen} onOpenChange={handleCloseCustomMilestoneDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Milestone</DialogTitle>
            <DialogDescription>Enter details for a new milestone.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddCustomMilestone()
            }}
          >
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="milestoneTitle" className="text-right">
                  Title
                </Label>
                <Input
                  id="milestoneTitle"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="milestoneDescription" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="milestoneDescription"
                  value={newMilestoneDescription}
                  onChange={(e) => setNewMilestoneDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Milestone</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Milestones Dialog (for viewing all) */}
      <Dialog open={milestonesDialogOpen} onOpenChange={(open) => setMilestonesDialogOpen(open)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>All Formation Milestones</DialogTitle>
            <DialogDescription>Track the progress of the company formation.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {Object.entries(milestones).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch id={key} checked={Boolean(value)} disabled />
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setMilestonesDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Details Modal */}
      <CompanyDetailsModal
        company={selectedCompany}
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
      />

      {/* Delete Order Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
    </div>
  )
}
