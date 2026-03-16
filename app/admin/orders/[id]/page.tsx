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
  ChevronRight,
  Pencil,
  UploadCloud,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { CompanyDetailsModal } from "@/components/modals/company-details-modal"
import { CustomerInfoCard } from "@/components/admin/order-detail/CustomerInfoCard"
import { OrderStatusCard } from "@/components/admin/order-detail/OrderStatusCard"
import { FormationProgressCard } from "@/components/admin/order-detail/FormationProgressCard"
import { CompanyInfoCard } from "@/components/admin/order-detail/CompanyInfoCard"
import { MembersCard } from "@/components/admin/order-detail/MembersCard"
import { OrderPricingCard } from "@/components/admin/order-detail/OrderPricingCard"
import { AddonsCard } from "@/components/admin/order-detail/AddonsCard"
import { AdminActionsCard } from "@/components/admin/order-detail/AdminActionsCard"
import { StatusManagementCard } from "@/components/admin/order-detail/StatusManagementCard"
import { AssignedInfoCards } from "@/components/admin/order-detail/AssignedInfoCards"

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

  // Banner state
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [bannerMessage, setBannerMessage] = useState("")
  const [bannerType, setBannerType] = useState<"info" | "warning" | "success" | "error">("info")
  const [bannerSaving, setBannerSaving] = useState(false)
  const [existingBanner, setExistingBanner] = useState<any>(null)

  // Send Notification state
  const [notifDialogOpen, setNotifDialogOpen] = useState(false)
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [notifSending, setNotifSending] = useState(false)

  // View/Edit Notifications state
  const [viewNotifsDialogOpen, setViewNotifsDialogOpen] = useState(false)
  const [sentNotifications, setSentNotifications] = useState<any[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null)
  const [editNotifTitle, setEditNotifTitle] = useState("")
  const [editNotifMessage, setEditNotifMessage] = useState("")
  const [notifUpdating, setNotifUpdating] = useState(false)
  const [notifDeleting, setNotifDeleting] = useState<string | null>(null)

  const [einValue, setEinValue] = useState("")
  const [itinValue, setItinValue] = useState("")
  const [itinSelectedMemberId, setItinSelectedMemberId] = useState("")
  const [itinCustomMemberName, setItinCustomMemberName] = useState("")
  const [businessIdValue, setBusinessIdValue] = useState("")
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("")
  const [uploadDocType, setUploadDocType] = useState("general")
  const [uploadDocTitle, setUploadDocTitle] = useState("")
  const [uploadDocFiles, setUploadDocFiles] = useState<FileList | null>(null)

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
    einObtained: false,
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

  const handleCustomMilestoneToggle = async (
    milestoneId: string,
    sendEmail?: boolean,
    emailSubject?: string,
    emailContent?: string,
    sendNotification?: boolean,
    notificationMessage?: string,
  ) => {
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
      const isNowCompleted = milestone?.completed

      toast({
        title: "Milestone Updated",
        description: `${milestone?.title} has been ${isNowCompleted ? "completed" : "uncompleted"}`,
      })

      // Send email and/or notification when completing a milestone
      if (isNowCompleted) {
        const customerEmail = customer?.email || order?.email || ""

        if (sendEmail && emailSubject && emailContent && customerEmail) {
          try {
            await fetch("/api/email/milestone", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: customerEmail,
                subject: emailSubject,
                content: emailContent,
              }),
            })
          } catch (emailErr) {
            console.log("[v0] Error sending milestone email:", emailErr)
          }
        }

        if (sendNotification && notificationMessage && customerEmail) {
          try {
            await fetch("/api/notifications", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: customer?.id || order?.userId,
                type: "milestone_completed",
                title: milestone?.title || "Milestone Completed",
                message: notificationMessage,
                metadata: {
                  companyId: company.id,
                  companyName: company.name,
                  milestoneId,
                  milestoneName: milestone?.title,
                },
              }),
            })
          } catch (notifErr) {
            console.log("[v0] Error sending milestone notification:", notifErr)
          }
        }
      }
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
          einObtained: orderData.company.milestones.einObtained || false,
        })
      } else {
        // Initialize with default false values if no milestones exist
        setMilestones({
          orderSuccessfullyProcessed: false,
          registeredAgentAssigned: false,
          businessMailingAddressIssued: false,
          companyFormationCompleted: false,
          einApplicationSubmitted: false,
          einObtained: false,
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

  const handleDocumentUpload = async () => {
    if (!uploadDocFiles || uploadDocFiles.length === 0 || !company) return

    setDocUploading(true)
    try {
      const formData = new FormData()
      Array.from(uploadDocFiles).forEach((file) => formData.append("files", file))
      if (uploadDocTitle.trim()) formData.append("title", uploadDocTitle.trim())
      formData.append("type", uploadDocType)
      formData.append("category", uploadDocType)
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

      const fileNames =
        uploadDocFiles.length === 1
          ? uploadDocFiles[0].name
          : `${uploadDocFiles.length} files`

      toast({
        title: "Document Uploaded",
        description: `${fileNames} uploaded successfully`,
      })

      setUploadDocDialogOpen(false)
      setUploadDocTitle("")
      setUploadDocFiles(null)
      setUploadDocType("general")

      const file = uploadDocFiles[0]

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
        updatedMilestones.einObtained = true
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
      setMilestones(updatedCompany.milestones || milestones)
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
      setMilestones(updatedCompany.milestones || milestones)
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
        }),
      })

      if (!response.ok) throw new Error("Failed to assign EIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] EIN assigned successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || milestones)
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
        description: "Please enter a valid ITIN number",
        variant: "destructive",
      })
      return
    }

    // Determine the member name to use
    let memberName = itinCustomMemberName.trim()
    if (!memberName && itinSelectedMemberId) {
      const selectedMember = (company.members || []).find(
        (m: any) => (m._id?.toString() || m.id) === itinSelectedMemberId,
      )
      if (selectedMember) {
        const fn = selectedMember.firstName || ""
        const mn = selectedMember.middleName || ""
        const ln = selectedMember.lastName || ""
        memberName = fn && ln ? (mn ? `${fn} ${mn} ${ln}` : `${fn} ${ln}`) : selectedMember.name || ""
      }
    }

    setItinUpdating(true)
    try {
      // Build the updated itinMembers array
      const existingItinMembers: any[] = company.itinMembers || []
      const newEntry = {
        memberId: itinSelectedMemberId || null,
        memberName: memberName || "Unknown Member",
        itin: itinValue.trim(),
        assignedAt: new Date().toISOString(),
      }
      const updatedItinMembers = [...existingItinMembers, newEntry]

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          itin: itinValue.trim(),
          itinMembers: updatedItinMembers,
        }),
      })

      if (!response.ok) throw new Error("Failed to assign ITIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      setCompany(updatedCompany)
      setItinDialogOpen(false)
      setItinValue("")
      setItinSelectedMemberId("")
      setItinCustomMemberName("")

      toast({
        title: "ITIN Assigned",
        description: `ITIN has been successfully assigned to ${memberName || "the member"}`,
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
        }),
      })

      if (!response.ok) throw new Error("Failed to assign Business ID")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] Business ID assigned successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || milestones)
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
    setItinSelectedMemberId("")
    setItinCustomMemberName("")
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
            einObtained: false,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to remove EIN")

      const result = await response.json()
      const updatedCompany = result.data || result.company

      console.log("[v0] EIN removed successfully")

      setCompany(updatedCompany)
      setMilestones(updatedCompany.milestones || { ...milestones, einObtained: false })

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

  const handleOpenBannerDialog = async () => {
    if (!company) return
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/banners?companyId=${company.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.data) {
        setExistingBanner(data.data)
        setBannerMessage(data.data.message)
        setBannerType(data.data.type || "info")
      } else {
        setExistingBanner(null)
        setBannerMessage("")
        setBannerType("info")
      }
    } catch {
      setExistingBanner(null)
      setBannerMessage("")
      setBannerType("info")
    }
    setBannerDialogOpen(true)
  }

  const handleSaveBanner = async () => {
    if (!company || !bannerMessage.trim()) return
    setBannerSaving(true)
    try {
      const token = authService.getToken()
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId: company.id, message: bannerMessage.trim(), type: bannerType }),
      })
      if (!res.ok) throw new Error("Failed to save banner")
      toast({ title: "Banner saved", description: "The client dashboard banner has been updated." })
      setBannerDialogOpen(false)
    } catch {
      toast({ title: "Error", description: "Failed to save banner. Please try again.", variant: "destructive" })
    } finally {
      setBannerSaving(false)
    }
  }

  const handleRemoveBanner = async () => {
    if (!company) return
    setBannerSaving(true)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/banners?companyId=${company.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to remove banner")
      toast({ title: "Banner removed", description: "The client dashboard banner has been cleared." })
      setBannerDialogOpen(false)
      setExistingBanner(null)
    } catch {
      toast({ title: "Error", description: "Failed to remove banner. Please try again.", variant: "destructive" })
    } finally {
      setBannerSaving(false)
    }
  }

  const handleSendNotification = async () => {
    if (!customer?.id || !notifTitle.trim() || !notifMessage.trim()) return
    setNotifSending(true)
    try {
      const token = authService.getToken()
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: customer.id,
          type: "admin_message",
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          metadata: { companyId: company?.id, companyName: company?.name },
        }),
      })
      if (!res.ok) throw new Error("Failed to send notification")
      toast({ title: "Notification sent", description: `A notification has been sent to ${customer.name || customer.email}.` })
      setNotifDialogOpen(false)
      setNotifTitle("")
      setNotifMessage("")
    } catch {
      toast({ title: "Error", description: "Failed to send notification. Please try again.", variant: "destructive" })
    } finally {
      setNotifSending(false)
    }
  }

  const fetchSentNotifications = async () => {
    if (!customer?.id) return
    setNotifsLoading(true)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/notifications?userId=${customer.id}&type=admin_message`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSentNotifications(data.data || [])
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch notifications.", variant: "destructive" })
    } finally {
      setNotifsLoading(false)
    }
  }

  const handleUpdateNotification = async () => {
    if (!editingNotifId || !editNotifTitle.trim() || !editNotifMessage.trim()) return
    setNotifUpdating(true)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/notifications/${editingNotifId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editNotifTitle.trim(), message: editNotifMessage.trim() }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast({ title: "Updated", description: "Notification updated successfully." })
      setEditingNotifId(null)
      fetchSentNotifications()
    } catch {
      toast({ title: "Error", description: "Failed to update notification.", variant: "destructive" })
    } finally {
      setNotifUpdating(false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    setNotifDeleting(id)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: "Notification deleted successfully." })
      setSentNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      toast({ title: "Error", description: "Failed to delete notification.", variant: "destructive" })
    } finally {
      setNotifDeleting(null)
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
    <div className="min-h-screen bg-white">
      {/* Apple-style Page Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/orders")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Orders
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-sm text-gray-900 font-medium">Order Details</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">{order.orderId || order.id}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
              >
                {getStatusIcon(order.status)}
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero row: company name + quick meta */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {company?.name || "Unnamed Business"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">
              {company?.state && <span className="font-medium text-gray-700">{company.state}</span>}
              {company?.state && company?.packageType && " · "}
              {company?.packageType && (
                <span className="capitalize">
                  {company.packageType
                    .split("-")
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </span>
              )}
            </span>
            {order?.createdAt && (
              <span className="text-sm text-gray-400">
                {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-10 bg-gray-100 rounded-lg p-1 mb-8 w-auto inline-flex gap-0.5">
            <TabsTrigger value="overview" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="company" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">
              Company
            </TabsTrigger>
            <TabsTrigger value="members" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">
              Members
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">
              Pricing
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">
              Tax & IDs
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">
              Actions
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-5 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-5">
                <CustomerInfoCard
                  customer={customer}
                  editingCustomer={editingCustomer}
                  customerForm={customerForm}
                  onEdit={() => setEditingCustomer(true)}
                  onSave={handleSaveCustomer}
                  onCancel={() => {
                    setEditingCustomer(false)
                    setCustomerForm({
                      name: customer?.name || "",
                      email: customer?.email || "",
                      phone: customer?.phone || "",
                    })
                  }}
                  onFormChange={setCustomerForm}
                />

                <FormationProgressCard
                  milestones={milestones}
                  company={company}
                  completedDefaultMilestones={completedDefaultMilestones}
                  totalDefaultMilestones={totalDefaultMilestones}
                  completionPercentage={completionPercentage}
                  completedMilestonesWithCustom={completedMilestonesWithCustom}
                  totalMilestonesWithCustom={totalMilestonesWithCustom}
                  onCustomMilestoneToggle={handleCustomMilestoneToggle}
                  onDeleteCustomMilestone={handleDeleteCustomMilestone}
                  deletingMilestoneId={deletingMilestoneId}
                  customerEmail={customer?.email || order?.email || ""}
                />

              </div>

              {/* Right column */}
              <div className="space-y-5">
                <OrderStatusCard
                  order={order}
                  newStatus={newStatus}
                  statusUpdating={statusUpdating}
                  onStatusChange={setNewStatus}
                  onStatusUpdate={handleStatusUpdate}
                />

                <StatusManagementCard
                  company={company}
                  onUpdateCompanyStatus={() => setCompanyStatusDialogOpen(true)}
                  onUpdateAgentStatus={() => setRegisteredAgentStatusDialogOpen(true)}
                  onUpdateAddressStatus={() => setBusinessAddressStatusDialogOpen(true)}
                  onUpdateServiceStatus={() => setServiceStatusDialogOpen(true)}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── COMPANY TAB ── */}
          <TabsContent value="company" className="focus-visible:outline-none">
            <CompanyInfoCard
              company={company}
              editingCompany={editingCompany}
              companyForm={companyForm}
              onEdit={() => setEditingCompany(true)}
              onSave={handleSaveCompany}
              onCancel={() => {
                setEditingCompany(false)
                setCompanyForm({
                  name: company?.name || "",
                  state: company?.state || "",
                  businessCategory: company?.businessCategory || "",
                  businessWebsite: company?.businessWebsite || "",
                  businessDescription: company?.businessDescription || "",
                })
              }}
              onFormChange={setCompanyForm}
            />
          </TabsContent>

          {/* ── MEMBERS TAB ── */}
          <TabsContent value="members" className="focus-visible:outline-none">
              <MembersCard
                members={company?.members || []}
                companyId={company?.id}
                onMembersUpdate={(updatedMembers) => setCompany((prev: any) => prev ? { ...prev, members: updatedMembers } : prev)}
              />
          </TabsContent>

          {/* ── PRICING TAB ── */}
          <TabsContent value="pricing" className="focus-visible:outline-none space-y-6">
            <OrderPricingCard
              order={order}
              onOrderUpdate={(updated) =>
                setOrder((prev: any) => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    // Only override a field if the updated payload explicitly includes it
                    ...(updated.pricing !== undefined && { pricing: updated.pricing }),
                    ...(updated.whatsappPhone !== undefined && { whatsappPhone: updated.whatsappPhone }),
                    ...(updated.paymentInfo !== undefined && { paymentInfo: updated.paymentInfo }),
                    ...(updated.createdAt !== undefined && { createdAt: updated.createdAt }),
                    ...(updated.receiptUrl !== undefined && { receiptUrl: updated.receiptUrl }),
                    ...(updated.purchasedAddons !== undefined && { purchasedAddons: updated.purchasedAddons }),
                  }
                })
              }
            />
            <AddonsCard
              order={order}
              onOrderUpdate={(updated) =>
                setOrder((prev: any) => ({
                  ...prev,
                  ...updated,
                  // purchasedAddons and pricing are always set explicitly by AddonsCard
                  purchasedAddons: updated.purchasedAddons ?? prev?.purchasedAddons,
                  pricing: updated.pricing ?? prev?.pricing,
                }))
              }
            />
          </TabsContent>

          {/* ── TAX & IDs TAB ── */}
          <TabsContent value="assigned" className="focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AssignedInfoCards
                company={company}
                onUpdateCompany={async (patch) => {
                  const token = authService.getToken()
                  if (!token || !company?.id) return
                  const response = await fetch(`/api/companies/${company.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(patch),
                  })
                  if (!response.ok) {
                    toast({ title: "Update Failed", description: "Failed to update. Please try again.", variant: "destructive" })
                    throw new Error("Update failed")
                  }
                  const result = await response.json()
                  setCompany(result.data)
                  toast({ title: "Updated", description: "Information has been updated successfully." })
                }}
              />
            </div>
          </TabsContent>

          {/* ── ACTIONS TAB ── */}
          <TabsContent value="actions" className="focus-visible:outline-none">
            <AdminActionsCard
              company={company}
              hasEIN={hasEIN}
              agentUpdating={agentUpdating}
              addressUpdating={addressUpdating}
              einUpdating={einUpdating}
              itinUpdating={itinUpdating}
              businessIdUpdating={businessIdUpdating}
              taxUpdating={taxUpdating}
              milestoneUpdating={milestoneUpdating}
              deleting={deleting}
              onAddMilestone={() => setCustomMilestoneDialogOpen(true)}
              onAssignAgent={() => setRegisteredAgentDialogOpen(true)}
              onAssignAddress={() => setMailingAddressDialogOpen(true)}
              onAssignEIN={() => setEinDialogOpen(true)}
              onAssignITIN={() => setItinDialogOpen(true)}
              onAssignBusinessId={() => setBusinessIdDialogOpen(true)}
              onTaxInfo={() => {
                setTaxData({
                  taxClassification: company?.taxClassification || "",
                  annualReportFilingDate: company?.annualReportFilingDate || "",
                  irsFilingDate: company?.irsFilingDate || "",
                  itin: company?.itin || "",
                })
                setTaxInfoDialogOpen(true)
              }}
              onManageMilestones={() => setMilestonesDialogOpen(true)}
              onDownloadInvoice={generateInvoice}
              onDeleteOrder={() => {
                setDeleteDialogOpen(true)
              }}
              onSetBanner={handleOpenBannerDialog}
              onSendNotification={() => {
                setNotifTitle("")
                setNotifMessage("")
                setNotifDialogOpen(true)
              }}
              onViewNotifications={() => {
                setViewNotifsDialogOpen(true)
                fetchSentNotifications()
              }}
              onUploadDocument={() => {
                setUploadDocTitle("")
                setUploadDocFiles(null)
                setUploadDocType("general")
                setUploadDocDialogOpen(true)
              }}
            />
          </TabsContent>
        </Tabs>
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
  onCustomMilestoneToggle={handleCustomMilestoneToggle}
  onDeleteCustomMilestone={handleDeleteCustomMilestone}
  deletingMilestoneId={deletingMilestoneId}
/>

      {/* Set Client Dashboard Banner Dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Set Client Dashboard Banner</DialogTitle>
            <DialogDescription>
              This banner will appear at the top of {company?.name}&apos;s dashboard. Leave blank to remove it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bannerType">Banner Type</Label>
              <Select value={bannerType} onValueChange={(v: any) => setBannerType(v)}>
                <SelectTrigger id="bannerType" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (Blue)</SelectItem>
                  <SelectItem value="success">Success (Green)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="error">Alert (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerMessage">Message</Label>
              <Textarea
                id="bannerMessage"
                placeholder="e.g., Your EIN has been approved. Please check the details below."
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
            {existingBanner && (
              <p className="text-xs text-gray-500">
                Current banner: &quot;{existingBanner.message}&quot;
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            {existingBanner && (
              <Button
                variant="outline"
                onClick={handleRemoveBanner}
                disabled={bannerSaving}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {bannerSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Remove Banner
              </Button>
            )}
            <Button
              onClick={handleSaveBanner}
              disabled={bannerSaving || !bannerMessage.trim()}
              className="bg-[#d81c20] hover:bg-[#b91518] text-white"
            >
              {bannerSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Client Notification Dialog */}
      <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Send Client Notification</DialogTitle>
            <DialogDescription>
              This notification will appear in {customer?.name || customer?.email || "the client"}&apos;s notification bar on their dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notifTitle">Title</Label>
              <Input
                id="notifTitle"
                placeholder="e.g., Action Required"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifMessage">Message</Label>
              <Textarea
                id="notifMessage"
                placeholder="e.g., Your documents are ready. Please log in to review them."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNotifDialogOpen(false)} disabled={notifSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={notifSending || !notifTitle.trim() || !notifMessage.trim()}
              className="bg-[#d81c20] hover:bg-[#b91518] text-white"
            >
              {notifSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Sent Notifications Dialog */}
      <Dialog open={viewNotifsDialogOpen} onOpenChange={setViewNotifsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Sent Notifications</DialogTitle>
            <DialogDescription>
              Admin notifications sent to {customer?.name || customer?.email || "this client"}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {notifsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : sentNotifications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No notifications sent yet.</p>
            ) : (
              sentNotifications.map((notif) => (
                <div key={notif.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  {editingNotifId === notif.id ? (
                    <>
                      <Input
                        value={editNotifTitle}
                        onChange={(e) => setEditNotifTitle(e.target.value)}
                        placeholder="Title"
                        className="mb-2"
                      />
                      <Textarea
                        value={editNotifMessage}
                        onChange={(e) => setEditNotifMessage(e.target.value)}
                        placeholder="Message"
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={handleUpdateNotification}
                          disabled={notifUpdating || !editNotifTitle.trim() || !editNotifMessage.trim()}
                          className="bg-[#d81c20] hover:bg-[#b91518] text-white"
                        >
                          {notifUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNotifId(null)} disabled={notifUpdating}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{notif.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingNotifId(notif.id)
                              setEditNotifTitle(notif.title)
                              setEditNotifMessage(notif.message)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNotification(notif.id)}
                            disabled={notifDeleting === notif.id}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            {notifDeleting === notif.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewNotifsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
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
              />
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
            <DialogTitle className="text-xl font-semibold">Assign ITIN to Member</DialogTitle>
            <DialogDescription>
              ITIN is an Individual Taxpayer Identification Number assigned to a specific member, not the company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Member selector */}
            <div className="space-y-2">
              <Label htmlFor="itinMemberSelect">Select Member</Label>
              {company?.members && company.members.length > 0 ? (
                <Select value={itinSelectedMemberId} onValueChange={setItinSelectedMemberId}>
                  <SelectTrigger id="itinMemberSelect" className="h-10">
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {company.members.map((m: any, idx: number) => {
                      const fn = m.firstName || ""
                      const mn = m.middleName || ""
                      const ln = m.lastName || ""
                      const displayName =
                        fn && ln ? (mn ? `${fn} ${mn} ${ln}` : `${fn} ${ln}`) : m.name || `Member ${idx + 1}`
                      const memberId = m._id?.toString() || m.id || `member-${idx}`
                      return (
                        <SelectItem key={memberId} value={memberId}>
                          {displayName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-slate-500 italic">No members found for this company.</p>
              )}
            </div>

            {/* Custom member name override */}
            <div className="space-y-2">
              <Label htmlFor="itinCustomName">
                Custom Member Name{" "}
                <span className="text-slate-400 font-normal">(optional — overrides selected member name)</span>
              </Label>
              <Input
                id="itinCustomName"
                placeholder="Enter custom name..."
                value={itinCustomMemberName}
                onChange={(e) => setItinCustomMemberName(e.target.value)}
                className="h-10"
              />
            </div>

            {/* ITIN Number */}
            <div className="space-y-2">
              <Label htmlFor="itinInput">ITIN Number *</Label>
              <Input
                id="itinInput"
                placeholder="9XX-XX-XXXX"
                value={itinValue}
                onChange={(e) => setItinValue(e.target.value)}
                className="h-10 font-mono"
              />
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
                    <Hash className="w-4 h-4 mr-2" />
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

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDocDialogOpen}
        onOpenChange={(open) => {
          if (!docUploading) {
            setUploadDocDialogOpen(open)
            if (!open) {
              setUploadDocTitle("")
              setUploadDocFiles(null)
              setUploadDocType("general")
            }
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <UploadCloud className="w-5 h-5 text-[#dc2626]" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload one or more documents for{" "}
              <span className="font-medium text-gray-700">{company?.name || "this order"}</span>. The document will be
              visible in the client portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="uploadDocTitle">Document Title</Label>
              <Input
                id="uploadDocTitle"
                placeholder="e.g. Articles of Organization"
                value={uploadDocTitle}
                onChange={(e) => setUploadDocTitle(e.target.value)}
                disabled={docUploading}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="uploadDocType">Document Type</Label>
              <Select value={uploadDocType} onValueChange={setUploadDocType} disabled={docUploading}>
                <SelectTrigger id="uploadDocType" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="identity">Identity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File picker */}
            <div className="space-y-1.5">
              <Label htmlFor="uploadDocFiles">Files *</Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  uploadDocFiles && uploadDocFiles.length > 0
                    ? "border-[#880000]/40 bg-red-50/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  id="uploadDocFiles"
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={(e) => setUploadDocFiles(e.target.files)}
                  disabled={docUploading}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv,.txt"
                />
                {uploadDocFiles && uploadDocFiles.length > 0 ? (
                  <div className="space-y-1">
                    <UploadCloud className="w-5 h-5 text-[#880000] mx-auto" />
                    <p className="text-sm font-medium text-gray-800">
                      {uploadDocFiles.length === 1
                        ? uploadDocFiles[0].name
                        : `${uploadDocFiles.length} files selected`}
                    </p>
                    <p className="text-xs text-gray-400">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-6 h-6 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-500">Click to select files</p>
                    <p className="text-xs text-gray-400">PDF, DOC, PNG, JPG, XLSX and more (max 200MB each)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadDocDialogOpen(false)}
              disabled={docUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDocumentUpload}
              disabled={docUploading || !uploadDocFiles || uploadDocFiles.length === 0}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
            >
              {docUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
