"use client"

import { Switch } from "@/components/ui/switch"
import { StatusUpdateModal } from "@/components/status-update-modal"
import { AdminManualDataModal } from "@/components/admin-manual-data-modal"

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
      console.log("[v0] Order API response:", orderData)

      if (!orderData.success || !orderData.data) {
        setError("Invalid order data")
        setLoading(false)
        return
      }

      const {
        data: { company: foundCompany, user: foundUser, passportDocuments: foundPassportDocuments, ...foundOrder },
      } = orderData

      console.log("[v0] Found order:", foundOrder)
      console.log("[v0] Found company:", foundCompany)
      console.log("[v0] Found user:", foundUser)

      let customerData = foundUser
      if (!customerData && foundCompany?.members?.[0]) {
        console.warn("[v0] User not found, creating placeholder from company members")
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

      console.log("[v0] Customer data:", customerData)

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
        console.log("[v0] Initializing milestones from company data:", foundCompany.milestones)
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

      if (foundCompany?.mailingAddress) {
        const address = foundCompany.mailingAddress
        console.log("[v0] Pre-populating mailing address form:", address)
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
      console.log("[v0] Order status updated:", result)

      setOrder({ ...order, status: newStatus })

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })

      await loadOrderData()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
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

  // --- Status Update Handlers ---
  const handleUpdateCompanyStatus = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Updating company status to:", newStatus)

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PUT",
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
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        throw new Error(errorData.error || "Failed to update company status")
      }

      const result = await response.json()
      console.log("[v0] Status update successful:", result)

      setCompany({ ...company, companyStatus: newStatus })
      setCompanyStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: `Company status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("[v0] Error updating company status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRegisteredAgentStatus = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Updating registered agent status to:", newStatus)

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PUT",
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
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        throw new Error(errorData.error || "Failed to update registered agent status")
      }

      const result = await response.json()
      console.log("[v0] Status update successful:", result)

      setCompany({ ...company, registeredAgentStatus: newStatus })
      setRegisteredAgentStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: `Registered agent status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("[v0] Error updating registered agent status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBusinessAddressStatus = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Updating business address status to:", newStatus)

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PUT",
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
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        throw new Error(errorData.error || "Failed to update business address status")
      }

      const result = await response.json()
      console.log("[v0] Status update successful:", result)

      setCompany({ ...company, businessAddressStatus: newStatus })
      setBusinessAddressStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: `Business address status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("[v0] Error updating business address status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleUpdateServiceStatus = async (newStatus: "pending" | "active" | "inactive") => {
    if (!company) return

    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Updating service status to:", newStatus)

      const response = await fetch(`/api/companies/${company.id}/status`, {
        method: "PUT",
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
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        throw new Error(errorData.error || "Failed to update service status")
      }

      const result = await response.json()
      console.log("[v0] Status update successful:", result)

      setCompany({ ...company, serviceStatus: newStatus })
      setServiceStatusDialogOpen(false)

      toast({
        title: "Status Updated",
        description: `Service status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("[v0] Error updating service status:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
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
    if (!customer || !user?.id) {
      toast({
        title: "Error",
        description: "Cannot update customer - user not found",
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

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update customer")
      }

      const result = await response.json()
      console.log("[v0] Customer updated:", result)

      setCustomer({ ...customer, ...customerForm })
      setUser({ ...user, ...customerForm })
      setEditingCustomer(false)

      toast({
        title: "Success",
        description: "Customer information updated",
      })
    } catch (error) {
      console.error("[v0] Error updating customer:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update customer information",
        variant: "destructive",
      })
    }
  }

  const handleSaveCompany = async () => {
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
        body: JSON.stringify(companyForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update company")
      }

      const result = await response.json()
      console.log("[v0] Company updated:", result)

      setCompany(result.data)
      setEditingCompany(false)

      toast({
        title: "Success",
        description: "Company information updated",
      })
    } catch (error) {
      console.error("[v0] Error updating company:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update company information",
        variant: "destructive",
      })
    }
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
                {!editingCustomer && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(true)} className="h-8 text-xs">
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

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
                {!editingCompany && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingCompany(true)} className="h-8 text-xs">
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
                              <Badge variant="secondary" className="mt-1 text-xs">
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
                        {member.email && (
                          <div>
                            <p className="text-xs text-slate-600">Email</p>
                            <p className="text-sm font-medium text-slate-900">{member.email}</p>
                          </div>
                        )}
                        {member.phone && (
                          <div>
                            <p className="text-xs text-slate-600">Phone</p>
                            <p className="text-sm font-medium text-slate-900">{member.phone}</p>
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
                        {member.ssn && (
                          <div>
                            <p className="text-xs text-slate-600">SSN/ITIN</p>
                            <p className="text-sm font-medium text-slate-900">
                              {member.ssn.length > 4 ? `***-**-${member.ssn.slice(-4)}` : "Provided"}
                            </p>
                          </div>
                        )}
                        {member.passportUrl && (
                          <div>
                            <p className="text-xs text-slate-600">Passport Document</p>
                            <a
                              href={member.passportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              View Document
                            </a>
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
                {/* Pricing Breakdown */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Package Price</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${(order?.pricing?.packagePrice || order?.packagePrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">State Filing Fee</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${(order?.pricing?.stateFilingFee || order?.stateFilingFee || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Add-ons Total</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${(order?.pricing?.addonsTotal || order?.addonsTotal || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] border border-slate-200">
                    <p className="text-xs text-white mb-1">Total Amount</p>
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
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">{hasBusinessId ? "View/Edit Business ID" : "Assign Business ID"}</span>
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

          {/* Admin Manual Data Section - Add after Status Management card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Manual Admin Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Tax & Compliance Info</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTaxModalOpen(true)} disabled={statusUpdating}>
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Registered Agent</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAgentModalOpen(true)} disabled={statusUpdating}>
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Business Address</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAddressModalOpen(true)} disabled={statusUpdating}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Milestones Section - Now inside main grid */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Milestones
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomMilestoneDialogOpen(true)}
                className="h-9"
                disabled={
                  statusUpdating ||
                  agentUpdating ||
                  addressUpdating ||
                  einUpdating ||
                  itinUpdating ||
                  businessIdUpdating ||
                  docUploading ||
                  milestoneUpdating ||
                  deleting
                }
              >
                <Clock className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </div>

            {/* Standard Milestones */}
            <Card className="bg-white border-slate-200 shadow-sm mb-4">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Standard Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "orderProcessed", label: "Order Processed", icon: Package },
                    { key: "registeredAgentAssigned", label: "Registered Agent Assigned", icon: UserCheck },
                    { key: "mailingAddressIssued", label: "Mailing Address Issued", icon: Home },
                    { key: "formationCompleted", label: "Formation Completed", icon: Building2 },
                    { key: "einProcessed", label: "EIN Processed", icon: Hash },
                    { key: "boiReportFiled", label: "BOI Report Filed", icon: FileCheck },
                  ].map((milestone) => (
                    <div
                      key={milestone.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <milestone.icon className="w-5 h-5 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">{milestone.label}</span>
                      </div>
                      <Switch
                        checked={milestones[milestone.key as keyof typeof milestones]}
                        onCheckedChange={() => handleMilestoneToggle(milestone.key as keyof typeof milestones)}
                        disabled={milestoneUpdating}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Milestones */}
            {company?.customMilestones && company.customMilestones.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-900">Custom Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {company.customMilestones.map((customMilestone: any) => (
                      <div
                        key={customMilestone.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <CheckCircle2 className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{customMilestone.title}</p>
                            {customMilestone.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{customMilestone.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={customMilestone.completed}
                            onCheckedChange={() => handleCustomMilestoneToggle(customMilestone.id)}
                            disabled={milestoneUpdating}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomMilestone(customMilestone.id)}
                            disabled={milestoneUpdating}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Manage Milestones Dialog */}
        <Dialog open={milestonesDialogOpen} onOpenChange={setMilestonesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Manage Formation Milestones</DialogTitle>
              <DialogDescription>
                Toggle milestones to update the formation progress for {company?.name}
                <br />
                <span className="text-sm text-slate-600 mt-2 block">
                  Core Progress: {completedDefaultMilestones}/{totalDefaultMilestones} ({completionPercentage}%)
                  {company?.customMilestones && company.customMilestones.length > 0 && (
                    <span className="text-slate-500">
                      {" "}
                      • Total with Custom: {completedMilestonesWithCustom}/{totalMilestonesWithCustom}
                    </span>
                  )}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Order Successfully Processed</p>
                      <p className="text-xs text-slate-500">Articles of Organization uploaded</p>
                    </div>
                  </div>
                  <Switch
                    checked={milestones.orderProcessed}
                    onCheckedChange={() => handleMilestoneToggle("orderProcessed")}
                    disabled={milestoneUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Registered Agent Assigned</p>
                      <p className="text-xs text-slate-500">
                        {company?.registeredAgent?.servicePeriod || "1 Year"} service period
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={milestones.registeredAgentAssigned}
                    onCheckedChange={() => handleMilestoneToggle("registeredAgentAssigned")}
                    disabled={milestoneUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Business Mailing Address Issued</p>
                      <p className="text-xs text-slate-500">Address confirmation received</p>
                    </div>
                  </div>
                  <Switch
                    checked={milestones.mailingAddressIssued}
                    onCheckedChange={() => handleMilestoneToggle("mailingAddressIssued")}
                    disabled={milestoneUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Company Formation Completed</p>
                      <p className="text-xs text-slate-500">Formation certificate issued</p>
                    </div>
                  </div>
                  <Switch
                    checked={milestones.formationCompleted}
                    onCheckedChange={() => handleMilestoneToggle("formationCompleted")}
                    disabled={milestoneUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <HashIcon className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">EIN Successfully Processed</p>
                      <p className="text-xs text-slate-500">EIN letter uploaded</p>
                    </div>
                  </div>
                  <Switch
                    checked={milestones.einProcessed}
                    onCheckedChange={() => handleMilestoneToggle("einProcessed")}
                    disabled={milestoneUpdating}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileBarChart className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">BOI Report Filed</p>
                      <p className="text-xs text-slate-500">Beneficial ownership report submitted</p>
                    </div>
                  </div>
                  <Switch
                    checked={milestones.boiReportFiled}
                    onCheckedChange={() => handleMilestoneToggle("boiReportFiled")}
                    disabled={milestoneUpdating}
                  />
                </div>

                {company?.customMilestones && company.customMilestones.length > 0 && (
                  <>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 mb-1">Custom Milestones</p>
                      <p className="text-xs text-slate-500 mb-3">
                        Custom milestones are tracked separately and don't affect the core progress percentage
                      </p>
                    </div>
                    {company.customMilestones.map((customMilestone: any) => (
                      <div
                        key={customMilestone.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <CheckCircle2 className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{customMilestone.title}</p>
                            {customMilestone.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {customMilestone.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={customMilestone.completed}
                          onCheckedChange={() => handleCustomMilestoneToggle(customMilestone.id)}
                          disabled={milestoneUpdating}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setMilestonesDialogOpen(false)} className="h-10">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                Assign a registered agent for {company?.name}. This will update the company records and mark the
                milestone as complete.
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
      </div>
    </div>
  )
}
