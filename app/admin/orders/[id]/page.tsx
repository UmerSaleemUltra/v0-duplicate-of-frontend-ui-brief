"use client"

import { useState, useEffect, use as useAsync } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Package,
  User,
  Building2,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Edit,
  Upload,
  Hash,
  UserCheck,
  Home,
  FileCheck,
  HashIcon,
  FileBarChart,
  Users,
  MapPin,
  Calendar,
  Briefcase,
  ShoppingCart,
  MessageCircle,
  ExternalLink,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { orderStorage, userStorage, companyStorage, addonStorage } from "@/lib/local-storage"
import { documentStorage } from "@/lib/document-storage"
import { getDisplayValue, formatEIN, formatBusinessId } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = useAsync(params)
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("admin")

  const [order, setOrder] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [newStatus, setNewStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addons, setAddons] = useState<any[]>([])

  const [uploadDocOpen, setUploadDocOpen] = useState(false)
  const [milestonesOpen, setMilestonesOpen] = useState(false)
  const [registeredAgentOpen, setRegisteredAgentOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [passportUrls, setPassportUrls] = useState<Record<string, string>>({})
  const [passportFileInfo, setPassportFileInfo] = useState<Record<string, { fileName: string; fileType: string }>>({})

  const [einDialogOpen, setEinDialogOpen] = useState(false)
  const [businessIdDialogOpen, setBusinessIdDialogOpen] = useState(false)
  const [einValue, setEinValue] = useState("")
  const [businessIdValue, setBusinessIdValue] = useState("")

  const [customMilestoneOpen, setCustomMilestoneOpen] = useState(false)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("")

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

  const hasEIN =
    company?.ein &&
    company.ein.trim() !== "" &&
    company.ein !== "Pending" &&
    company.ein !== "Not yet" &&
    !company.ein.includes("PENDING")
  const hasBusinessId =
    company?.businessId &&
    company.businessId.trim() !== "" &&
    !company.businessId.includes("PENDING") &&
    company.businessId !== "BIZ-PENDING"
  const hasRegisteredAgent =
    company?.registeredAgent &&
    company.registeredAgent.name &&
    company.registeredAgent.name.trim() !== "" &&
    company.registeredAgent.address &&
    company.registeredAgent.address.trim() !== "" &&
    company.registeredAgent.address !== "100 Ambition Parkway" &&
    company.registeredAgent.name !== "BuzzFiling Services Inc."

  const getWeeksSinceOrder = () => {
    if (!order) return 0
    const orderDate = new Date(order.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - orderDate.getTime())
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks
  }

  const weeksSinceOrder = getWeeksSinceOrder()
  const isOverdue = weeksSinceOrder >= 7

  const getAddonName = (addonId: string) => {
    const addon = addons.find((a) => a.id === addonId)
    if (addon) return addon.name

    // Fallback for legacy addon IDs
    if (addonId.startsWith("itin-")) return "ITIN Application"
    if (addonId === "reseller-certificate") return "Reseller Certificate"
    if (addonId === "business-website") return "Business Website"

    return addonId
  }

  const handleAddCustomMilestone = () => {
    if (!company || !newMilestoneTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a milestone title",
        variant: "destructive",
      })
      return
    }

    const customMilestones = company.customMilestones || []
    const newMilestone = {
      id: `custom-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      description: newMilestoneDescription.trim() || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    const updatedCompany = {
      ...company,
      customMilestones: [...customMilestones, newMilestone],
      updatedAt: new Date().toISOString(),
    }

    companyStorage.update(company.id, updatedCompany)
    setCompany(updatedCompany)
    setCustomMilestoneOpen(false)
    setNewMilestoneTitle("")
    setNewMilestoneDescription("")

    toast({
      title: "Milestone Added",
      description: `Custom milestone "${newMilestone.title}" has been added`,
    })
  }

  const handleToggleCustomMilestone = (milestoneId: string) => {
    if (!company) return

    const customMilestones = company.customMilestones || []
    const updatedMilestones = customMilestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            completed: !m.completed,
            completedAt: !m.completed ? new Date().toISOString() : undefined,
          }
        : m,
    )

    const updatedCompany = {
      ...company,
      customMilestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    }

    companyStorage.update(company.id, updatedCompany)
    setCompany(updatedCompany)

    const milestone = updatedMilestones.find((m) => m.id === milestoneId)
    toast({
      title: "Milestone Updated",
      description: `${milestone?.title} has been ${milestone?.completed ? "completed" : "uncompleted"}`,
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const allAddons = addonStorage.getAll()
        setAddons(allAddons)

        const orderData = orderStorage.getById(resolvedParams.id)
        if (!orderData) {
          setError("Order not found")
          setLoading(false)
          return
        }

        setOrder(orderData)
        setNewStatus(orderData.status)
        const userData = userStorage.getById(orderData.userId)
        const companyData = companyStorage.getById(orderData.companyId)
        setCustomer(userData)
        setCompany(companyData)

        if (companyData?.milestones) {
          setMilestones(companyData.milestones)
        }

        const loadPassports = async () => {
          if (!companyData?.members) return

          const urls: Record<string, string> = {}
          const fileInfo: Record<string, { fileName: string; fileType: string }> = {}
          const { getPassport, arrayBufferToFile } = await import("@/lib/passport-storage")

          console.log("[v0] Admin Order Details - Loading passports for company:", companyData.id)
          console.log("[v0] Total members:", companyData.members.length)

          for (let i = 0; i < companyData.members.length; i++) {
            const member = companyData.members[i]
            console.log(`[v0] Loading passport for member ${i + 1}:`, member.name)

            // Use passportKey from member data if available, otherwise fall back to constructed key
            const passportKey = member.passportKey || `${companyData.id}_member-${i + 1}`
            console.log(`[v0] Attempting to load passport with key:`, passportKey)

            try {
              const passportData = await getPassport(passportKey)
              if (passportData) {
                console.log(`[v0] ✓ Passport found with key:`, passportKey)
                const file = arrayBufferToFile(passportData)
                const url = URL.createObjectURL(file)
                urls[`member-${i + 1}`] = url
                fileInfo[`member-${i + 1}`] = {
                  fileName: passportData.fileName,
                  fileType: passportData.fileType,
                }
                console.log(`[v0] Passport URL created:`, url)
              } else {
                console.log(`[v0] ⚠ No passport found for member ${i + 1}`)
              }
            } catch (error) {
              console.log(`[v0] ✗ Error loading passport for member ${i + 1}:`, error)
            }
          }

          console.log("[v0] Final passport URLs:", urls)
          setPassportUrls(urls)
          setPassportFileInfo(fileInfo)
        }

        await loadPassports()
        setLoading(false)
      } catch (err) {
        console.error("Error loading order data:", err)
        setError("Failed to load order data")
        setLoading(false)
      }
    }

    loadData()

    return () => {
      Object.values(passportUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [resolvedParams.id])

  const handleStatusUpdate = () => {
    if (order && newStatus) {
      orderStorage.update(order.id, { status: newStatus })
      setOrder({ ...order, status: newStatus })
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    }
  }

  const handleMilestoneToggle = (milestone: keyof typeof milestones) => {
    const updatedMilestones = {
      ...milestones,
      [milestone]: !milestones[milestone],
    }
    setMilestones(updatedMilestones)

    if (company) {
      companyStorage.update(company.id, {
        milestones: updatedMilestones,
        updatedAt: new Date().toISOString(),
      })
      setCompany({ ...company, milestones: updatedMilestones })

      toast({
        title: "Milestone Updated",
        description: `${milestone} has been ${updatedMilestones[milestone] ? "completed" : "uncompleted"}`,
      })
    }
  }

  const handleDocumentUpload = async () => {
    const fileInput = document.getElementById("documentFile") as HTMLInputElement
    const titleInput = (document.getElementById("documentTitle") as HTMLInputElement)?.value
    const descriptionInput = (document.getElementById("documentDescription") as HTMLTextAreaElement)?.value

    if (fileInput?.files?.[0] && company && customer) {
      setUploadProgress(true)

      const file = fileInput.files[0]
      const documentTitle = titleInput || file.name

      try {
        const documentId = await documentStorage.store(file, {
          companyId: company.id,
          userId: customer.id,
          orderId: order.id,
          title: documentTitle,
          description: descriptionInput || "",
          uploadedBy: "admin",
          uploadedAt: new Date().toISOString(),
        })

        const updatedMilestones = { ...milestones }
        const titleLower = documentTitle.toLowerCase()

        if (titleLower.includes("articles") || titleLower.includes("organization")) {
          updatedMilestones.orderProcessed = true
        }
        if (titleLower.includes("registered agent")) {
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

        companyStorage.update(company.id, {
          milestones: updatedMilestones,
          updatedAt: new Date().toISOString(),
        })
        setMilestones(updatedMilestones)
        setCompany({ ...company, milestones: updatedMilestones })

        toast({
          title: "Document Uploaded",
          description: `Successfully uploaded ${file.name} to ${company.name}`,
        })

        setUploadProgress(false)
        setUploadDocOpen(false)

        fileInput.value = ""
        if (titleInput) (document.getElementById("documentTitle") as HTMLInputElement).value = ""
        if (descriptionInput) (document.getElementById("documentDescription") as HTMLTextAreaElement).value = ""
      } catch (error) {
        console.error("Error uploading document:", error)
        setUploadProgress(false)

        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Missing Information",
        description: "Please select a file to upload",
        variant: "destructive",
      })
    }
  }

  const handleAssignRegisteredAgent = () => {
    if (!company || !agentForm.name || !agentForm.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least agent name and address",
        variant: "destructive",
      })
      return
    }

    const updatedCompany = {
      ...company,
      registeredAgent: {
        name: agentForm.name,
        company: agentForm.company,
        address: agentForm.address,
        city: agentForm.city,
        state: agentForm.state,
        zip: agentForm.zip,
        phone: agentForm.phone,
        email: agentForm.email,
        servicePeriod: agentForm.servicePeriod,
        status: "Active",
      },
      milestones: {
        ...milestones,
        registeredAgentAssigned: true,
      },
      updatedAt: new Date().toISOString(),
    }

    companyStorage.update(company.id, updatedCompany)
    setCompany(updatedCompany)
    setMilestones(updatedCompany.milestones)
    setRegisteredAgentOpen(false)

    // Reset form
    setAgentForm({
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

    toast({
      title: "Registered Agent Assigned",
      description: "Registered agent has been successfully assigned to the company",
    })
  }

  const handleAssignEIN = () => {
    if (!company || !einValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a valid EIN",
        variant: "destructive",
      })
      return
    }

    const updatedCompany = {
      ...company,
      ein: einValue.trim(),
      milestones: {
        ...milestones,
        einProcessed: true,
      },
      updatedAt: new Date().toISOString(),
    }

    companyStorage.update(company.id, updatedCompany)
    setCompany(updatedCompany)
    setMilestones(updatedCompany.milestones)
    setEinDialogOpen(false)
    setEinValue("")

    toast({
      title: "EIN Assigned",
      description: `EIN ${einValue} has been successfully assigned to ${company.name}`,
    })
  }

  const handleAssignBusinessId = () => {
    if (!company || !businessIdValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a valid Business ID",
        variant: "destructive",
      })
      return
    }

    const updatedCompany = {
      ...company,
      businessId: businessIdValue.trim(),
      updatedAt: new Date().toISOString(),
    }

    companyStorage.update(company.id, updatedCompany)
    setCompany(updatedCompany)
    setBusinessIdDialogOpen(false)
    setBusinessIdValue("")

    toast({
      title: "Business ID Assigned",
      description: `Business ID ${businessIdValue} has been successfully assigned to ${company.name}`,
    })
  }

  const handleDownloadInvoice = () => {
    if (!order) return

    const invoiceContent = `
INVOICE
=====================================

Invoice Number: INV-${order.id}
Order ID: ${order.id}
Date: ${new Date(order.createdAt).toLocaleDateString()}

BILL TO:
${customer?.name || "N/A"}
${customer?.email || "N/A"}
${customer?.phone || "N/A"}

COMPANY:
${company?.name || "N/A"}
${company?.entityType || "N/A"}
${company?.state || "N/A"}

ITEMS:
Formation Service: $${order.amount}

TOTAL: $${order.amount}

Payment Status: ${order.paymentStatus || "Paid"}
Payment Method: ${order.paymentMethod || "Stripe"}

Thank you for your business!
=====================================
`

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invoice-${order.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Invoice Downloaded",
      description: "Invoice has been downloaded successfully",
    })
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    )
  }

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
    completedDefaultMilestones + (company?.customMilestones?.filter((m) => m.completed).length || 0)

  return (
    <div className="space-y-8">
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
        <div className="flex gap-3">
          <Button variant="outline" className="h-10 gap-2 bg-transparent" onClick={handleDownloadInvoice}>
            <Download className="w-4 h-4" />
            Download Invoice
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Status */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Current Status</p>
                  <Badge className={`${getStatusColor(order.status)} text-sm`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={newStatus === order.status}
                    className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                  >
                    Update Status
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-900 mb-3">Order Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Order Placed</p>
                      <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {order.status !== "pending" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Processing Started</p>
                        <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {order.status === "completed" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Order Completed</p>
                        <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
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
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCustomMilestoneOpen(true)} className="h-9 gap-2">
                  <Edit className="w-4 h-4" />
                  Add Milestone
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMilestonesOpen(true)} className="h-9 gap-2">
                  <Edit className="w-4 h-4" />
                  Manage Milestones
                </Button>
              </div>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${milestones.orderProcessed ? "text-green-600" : "text-slate-400"}`} />
                    <span className="text-sm font-medium">Order Successfully Processed</span>
                  </div>
                  {milestones.orderProcessed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <UserCheck
                      className={`w-5 h-5 ${milestones.registeredAgentAssigned ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-medium">Registered Agent Assigned</span>
                  </div>
                  {milestones.registeredAgentAssigned && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Home
                      className={`w-5 h-5 ${milestones.mailingAddressIssued ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-medium">Business Mailing Address Issued</span>
                  </div>
                  {milestones.mailingAddressIssued && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileCheck
                      className={`w-5 h-5 ${milestones.formationCompleted ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-medium">Company Formation Completed</span>
                  </div>
                  {milestones.formationCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <HashIcon className={`w-5 h-5 ${milestones.einProcessed ? "text-green-600" : "text-slate-400"}`} />
                    <span className="text-sm font-medium">EIN Successfully Processed</span>
                  </div>
                  {milestones.einProcessed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileBarChart
                      className={`w-5 h-5 ${milestones.boiReportFiled ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-medium">BOI Report Filed</span>
                  </div>
                  {milestones.boiReportFiled && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>

                {company?.customMilestones && company.customMilestones.length > 0 && (
                  <>
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                        Custom Milestones
                      </p>
                    </div>
                    {company.customMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                          <FileCheck
                            className={`w-5 h-5 ${milestone.completed ? "text-green-600" : "text-slate-400"}`}
                          />
                          <div>
                            <span className="text-sm font-medium">{milestone.title}</span>
                            {milestone.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                        {milestone.completed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Company Name</p>
                      <p className="text-sm font-medium text-slate-900">
                        {getDisplayValue(company.name, "Not provided")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Entity Type</p>
                      <p className="text-sm font-medium text-slate-900">
                        {getDisplayValue(company.entityType, "Not provided")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">State</p>
                      <p className="text-sm font-medium text-slate-900">
                        {getDisplayValue(company.state, "Not provided")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Package Type</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {getDisplayValue(company.packageType, "Not provided")}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-900">Identification Numbers</p>
                      {isOverdue && (!hasEIN || !hasBusinessId) && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {weeksSinceOrder} weeks since order
                        </Badge>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* EIN Section */}
                      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            EIN
                          </p>
                          {!hasEIN && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEinDialogOpen(true)}
                              className="h-7 text-xs gap-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0"
                            >
                              <Edit className="w-3 h-3" />
                              Assign
                            </Button>
                          )}
                        </div>
                        {hasEIN ? (
                          <div>
                            <p className="text-sm font-mono font-medium text-slate-900">
                              {formatEIN(company.ein, true)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEinValue(company.ein || "")
                                setEinDialogOpen(true)
                              }}
                              className="h-6 text-xs mt-2 px-2"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Update
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm italic text-slate-500">Not yet assigned</p>
                            {isOverdue && (
                              <p className="text-xs text-amber-600 mt-1">Expected within 7 weeks of order</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Business ID Section */}
                      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Business ID
                          </p>
                          {!hasBusinessId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBusinessIdDialogOpen(true)}
                              className="h-7 text-xs gap-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0"
                            >
                              <Edit className="w-3 h-3" />
                              Assign
                            </Button>
                          )}
                        </div>
                        {hasBusinessId ? (
                          <div>
                            <p className="text-sm font-mono font-medium text-slate-900">
                              {formatBusinessId(company.businessId)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBusinessIdValue(company.businessId || "")
                                setBusinessIdDialogOpen(true)
                              }}
                              className="h-6 text-xs mt-2 px-2"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Update
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm italic text-slate-500">Not yet assigned</p>
                            {isOverdue && (
                              <p className="text-xs text-amber-600 mt-1">Expected within 7 weeks of order</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isOverdue && (!hasEIN || !hasBusinessId) && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm text-amber-800">
                          <strong>Action Required:</strong> It's been {weeksSinceOrder} weeks since order placement.
                          Please assign the missing identifiers.
                        </p>
                      </div>
                    )}
                  </div>

                  {company.address && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-600 mb-1">Address</p>
                      <p className="text-sm font-medium text-slate-900">{company.address}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No company information available</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Package Price</span>
                  <span className="text-sm font-medium text-slate-900">${order.packagePrice || 149}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-sm text-slate-600">State Filing Fee</span>
                  <span className="text-sm font-medium text-slate-900">${order.stateFilingFee || 0}</span>
                </div>
                {order.addonsTotal > 0 && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Add-ons Total</span>
                    <span className="text-sm font-medium text-slate-900">${order.addonsTotal}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-300">
                  <span className="text-base font-semibold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-bold text-slate-900">${order.amount}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      {order.paymentMethod === "whatsapp" ? (
                        <>
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-slate-900">WhatsApp Payment</p>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-slate-900">Stripe (Card Payment)</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Payment Status</p>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Payment Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {order.transactionReference && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Transaction ID</p>
                      <p className="text-sm font-mono font-medium text-slate-900">{order.transactionReference}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {order.purchasedAddons && order.purchasedAddons.length > 0 && (
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Purchased Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items
                    ?.filter((item: any) => order.purchasedAddons?.includes(item.id))
                    .map((item: any) => {
                      const addon = addons.find((a) => a.id === item.id)
                      const isItin = item.id.startsWith("itin-")
                      const memberName = isItin
                        ? company?.members?.find((m: any) => item.id === `itin-${m.id}`)?.name || "Member"
                        : ""

                      return (
                        <div key={item.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="text-sm font-medium text-slate-900">
                                  {isItin ? `ITIN Application - ${memberName}` : item.name}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  Qty: {item.quantity || 1}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600">
                                {item.description ||
                                  addon?.description ||
                                  (isItin
                                    ? "Individual Taxpayer Identification Number application"
                                    : item.id === "reseller-certificate"
                                      ? "Sales tax exemption certificate"
                                      : item.id === "business-website"
                                        ? "Professional website design and hosting"
                                        : "Add-on service")}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                ${item.price || addon?.price || 0}
                              </Badge>
                              {item.quantity > 1 && (
                                <p className="text-xs text-slate-600 mt-1">
                                  Total: ${(item.price || addon?.price || 0) * item.quantity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Checkout Data & Business Details
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">Complete information collected during checkout</p>
              </div>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="space-y-6">
                  {/* Company Status */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Company Status</p>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm">
                          {company.status || "Active"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600 mb-1">Formation Date</p>
                        <p className="text-sm font-medium text-slate-900">
                          {company.formationDate
                            ? new Date(company.formationDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : new Date(company.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Business Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Business Name</p>
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
                        <p className="text-sm font-medium text-slate-900">
                          {company.businessCategory || "Not provided"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Package Type</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {company.packageType || "Starter"}
                        </Badge>
                      </div>
                    </div>
                    {company.businessDescription && (
                      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Business Description</p>
                        <p className="text-sm text-700">{company.businessDescription}</p>
                      </div>
                    )}
                  </div>

                  {/* Members & Owners */}
                  {company.members && company.members.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Members & Owners
                      </h3>
                      <div className="space-y-3">
                        {company.members.map((member: any, index: number) => {
                          const memberId = `member-${index + 1}`
                          const hasPassport = passportUrls[memberId]

                          return (
                            <div key={index} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {member.isResponsiblePerson && (
                                      <Badge className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 text-xs">
                                        Responsible Person
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      Member
                                    </Badge>
                                  </div>
                                </div>
                                {member.ownershipPercentage && (
                                  <div className="text-right">
                                    <p className="text-xs text-slate-600">Ownership</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                      {member.ownershipPercentage}%
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="grid md:grid-cols-2 gap-3">
                                {member.address && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      Address
                                    </p>
                                    <p className="text-xs text-slate-700">
                                      {member.address}
                                      {member.city && `, ${member.city}`}
                                      {member.state && `, ${member.state}`}
                                      {member.zip && ` ${member.zip}`}
                                    </p>
                                  </div>
                                )}
                                {member.ssn && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">SSN/ITIN</p>
                                    <p className="text-xs font-mono text-slate-700">
                                      {member.ssn ? "***-**-" + member.ssn.slice(-4) : "Not provided"}
                                    </p>
                                  </div>
                                )}
                                {member.dateOfBirth && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Date of Birth
                                    </p>
                                    <p className="text-xs text-slate-700">{member.dateOfBirth}</p>
                                  </div>
                                )}
                                {hasPassport && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">Passport Document</p>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 gap-2 text-xs bg-transparent"
                                        >
                                          <FileCheck className="w-3 h-3" />
                                          {passportFileInfo[memberId]?.fileName || "View Passport"}
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                                        <DialogHeader>
                                          <DialogTitle>
                                            {member.name} -{" "}
                                            {passportFileInfo[memberId]?.fileName || "Passport Document"}
                                          </DialogTitle>
                                          <Badge className="w-fit mt-2">
                                            {passportFileInfo[memberId]?.fileType || "image/jpeg"}
                                          </Badge>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                                            {passportFileInfo[memberId]?.fileType === "application/pdf" ? (
                                              <iframe
                                                src={passportUrls[memberId]}
                                                className="w-full h-[600px]"
                                                title={`${member.name} passport`}
                                              />
                                            ) : (
                                              <img
                                                src={passportUrls[memberId] || "/placeholder.svg"}
                                                alt={`${member.name} passport`}
                                                className="w-full h-auto object-contain"
                                              />
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                            <FileText className="w-4 h-4 text-slate-600" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs text-slate-600">File URL</p>
                                              <p className="text-sm font-mono text-slate-900 truncate">
                                                {passportUrls[memberId]}
                                              </p>
                                            </div>
                                            <Button
                                              onClick={() => {
                                                window.open(passportUrls[memberId], "_blank")
                                              }}
                                              variant="outline"
                                              size="sm"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          <Button
                                            onClick={() => {
                                              const link = document.createElement("a")
                                              link.href = passportUrls[memberId]
                                              link.download =
                                                passportFileInfo[memberId]?.fileName ||
                                                `${member.name.replace(/\s+/g, "_")}_passport.jpg`
                                              document.body.appendChild(link)
                                              link.click()
                                              document.body.removeChild(link)
                                            }}
                                            className="w-full gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                                          >
                                            <Download className="w-4 h-4" />
                                            Download Document
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Registered Agent */}
                  {hasRegisteredAgent && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Registered Agent
                      </h3>
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-600 mb-1">Agent Name</p>
                            <p className="text-sm font-medium text-slate-900">{company.registeredAgent.name}</p>
                          </div>
                          {company.registeredAgent.company && (
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Company</p>
                              <p className="text-sm font-medium text-slate-900">{company.registeredAgent.company}</p>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <p className="text-xs text-slate-600 mb-1">Full Address</p>
                            <p className="text-sm font-medium text-slate-900">
                              {company.registeredAgent.address}
                              {company.registeredAgent.city && `, ${company.registeredAgent.city}`}
                              {company.registeredAgent.state && `, ${company.registeredAgent.state}`}
                              {company.registeredAgent.zip && ` ${company.registeredAgent.zip}`}
                            </p>
                          </div>
                          {company.registeredAgent.phone && (
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Phone</p>
                              <p className="text-sm font-medium text-slate-900">{company.registeredAgent.phone}</p>
                            </div>
                          )}
                          {company.registeredAgent.email && (
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Email</p>
                              <p className="text-sm font-medium text-slate-900">{company.registeredAgent.email}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-600 mb-1">Service Period</p>
                            <Badge variant="outline" className="text-xs">
                              {company.registeredAgent.servicePeriod || "1 Year"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 mb-1">Status</p>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                              {company.registeredAgent.status || "Active"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tax Information */}
                  {hasEIN && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        EIN Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1">EIN (Employer Identification Number)</p>
                          <p className="text-sm font-mono font-medium text-slate-900">{formatEIN(company.ein, true)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No checkout data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Customer Information */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Name</p>
                    <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-900">{customer.email}</p>
                  </div>
                  {customer.phone && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{customer.phone}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full h-10 bg-transparent"
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  >
                    View Customer Profile
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No customer information available</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-10 justify-start gap-2 bg-transparent"
                onClick={() => setRegisteredAgentOpen(true)}
              >
                <UserCheck className="w-4 h-4" />
                Assign Registered Agent
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 justify-start gap-2 bg-transparent"
                onClick={() => setUploadDocOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 justify-start gap-2 bg-transparent"
                onClick={() => setMilestonesOpen(true)}
              >
                <FileCheck className="w-4 h-4" />
                Manage Milestones
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 justify-start gap-2 bg-transparent"
                onClick={handleDownloadInvoice}
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Order ID</span>
                  <span className="text-sm font-mono font-medium text-slate-900">{order.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Order Date</span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Total Amount</span>
                    <span className="text-lg font-semibold text-slate-900">${order.amount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDocOpen} onOpenChange={setUploadDocOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for {company?.name} - Order #{order.id}
              <br />
              <span className="text-xs text-amber-600 mt-2 block">
                💡 Tip: Document titles like "EIN", "Articles of Organization", "BOI Report" will automatically update
                milestones
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentTitle">Document Title</Label>
                <Input id="documentTitle" placeholder="e.g., EIN Letter, Articles of Incorporation" className="h-10" />
                <p className="text-xs text-slate-500">
                  Use keywords like "EIN", "Articles", "BOI", "Formation" to auto-update milestones
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentDescription">Description (Optional)</Label>
                <Textarea
                  id="documentDescription"
                  placeholder="Add any notes about this document..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentFile">Select File</Label>
                <Input id="documentFile" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="h-10" />
                <p className="text-xs text-slate-500">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setUploadDocOpen(false)}
                className="h-10"
                disabled={uploadProgress}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDocumentUpload}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={uploadProgress}
              >
                {uploadProgress ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Milestones Dialog */}
      <Dialog open={milestonesOpen} onOpenChange={setMilestonesOpen}>
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
                  {company.customMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileCheck className={`w-5 h-5 ${milestone.completed ? "text-green-600" : "text-slate-400"}`} />
                        <div>
                          <span className="text-sm font-medium">{milestone.title}</span>
                          {milestone.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={milestone.completed}
                        onCheckedChange={() => handleToggleCustomMilestone(milestone.id)}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setMilestonesOpen(false)} className="h-10">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Milestone Dialog */}
      <Dialog open={customMilestoneOpen} onOpenChange={setCustomMilestoneOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add Custom Milestone</DialogTitle>
            <DialogDescription>
              Create a custom milestone for {company?.name} that will appear in their progress tracker
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestoneTitle">Milestone Title *</Label>
              <Input
                id="milestoneTitle"
                placeholder="e.g., Business License Approved"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestoneDescription">Description (Optional)</Label>
              <Textarea
                id="milestoneDescription"
                placeholder="Add any notes about this milestone..."
                value={newMilestoneDescription}
                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setCustomMilestoneOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomMilestone}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!newMilestoneTitle.trim()}
              >
                Add Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={registeredAgentOpen} onOpenChange={setRegisteredAgentOpen}>
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

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentPhone">Phone</Label>
                <Input
                  id="agentPhone"
                  placeholder="(305) 555-0123"
                  value={agentForm.phone}
                  onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentEmail">Email</Label>
                <Input
                  id="agentEmail"
                  type="email"
                  placeholder="agent@example.com"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
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
              <Button variant="outline" onClick={() => setRegisteredAgentOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button
                onClick={handleAssignRegisteredAgent}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Assign Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={einDialogOpen} onOpenChange={setEinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign EIN</DialogTitle>
            <DialogDescription>
              Assign an Employer Identification Number (EIN) for {company?.name}. This will update the company records
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
              <Button variant="outline" onClick={() => setEinDialogOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button
                onClick={handleAssignEIN}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!einValue.trim()}
              >
                <Hash className="w-4 h-4 mr-2" />
                Assign EIN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={businessIdDialogOpen} onOpenChange={setBusinessIdDialogOpen}>
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
              <Button variant="outline" onClick={() => setBusinessIdDialogOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button
                onClick={handleAssignBusinessId}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={!businessIdValue.trim()}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Assign Business ID
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Members & Passport Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {company?.members && company.members.length > 0 ? (
              company.members.map((member: any, index: number) => {
                const memberId = `member-${index + 1}`
                const hasPassport = passportUrls[memberId]

                return (
                  <div key={index} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                        {member.isResponsiblePerson && (
                          <Badge className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 text-xs mt-1">
                            Responsible Person
                          </Badge>
                        )}
                      </div>
                      {member.ownershipPercentage && (
                        <div className="text-right">
                          <p className="text-xs text-slate-600">Ownership</p>
                          <p className="text-lg font-semibold text-slate-900">{member.ownershipPercentage}%</p>
                        </div>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {member.address && (
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Address</p>
                          <p className="text-xs text-slate-700">
                            {member.address}
                            {member.city && `, ${member.city}`}
                            {member.state && `, ${member.state}`}
                            {member.zip && ` ${member.zip}`}
                          </p>
                        </div>
                      )}
                      {hasPassport && (
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Passport Document</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs bg-transparent">
                                <FileCheck className="w-3 h-3" />
                                {passportFileInfo[memberId]?.fileName || "View Passport"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  {member.name} - {passportFileInfo[memberId]?.fileName || "Passport Document"}
                                </DialogTitle>
                                <Badge className="w-fit mt-2">
                                  {passportFileInfo[memberId]?.fileType || "image/jpeg"}
                                </Badge>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                                  {passportFileInfo[memberId]?.fileType === "application/pdf" ? (
                                    <iframe
                                      src={passportUrls[memberId]}
                                      className="w-full h-[600px]"
                                      title={`${member.name} passport`}
                                    />
                                  ) : (
                                    <img
                                      src={passportUrls[memberId] || "/placeholder.svg"}
                                      alt={`${member.name} passport`}
                                      className="w-full h-auto object-contain"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                  <FileText className="w-4 h-4 text-slate-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-600">File URL</p>
                                    <p className="text-sm font-mono text-slate-900 truncate">
                                      {passportUrls[memberId]}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      window.open(passportUrls[memberId], "_blank")
                                    }}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                                <Button
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = passportUrls[memberId]
                                    link.download =
                                      passportFileInfo[memberId]?.fileName ||
                                      `${member.name.replace(/\s+/g, "_")}_passport.jpg`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  }}
                                  className="w-full gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                                >
                                  <Download className="w-4 h-4" />
                                  Download Document
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-slate-600">No member information available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {hasRegisteredAgent && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Registered Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Agent Name</p>
                <p className="text-sm font-medium text-slate-900">{company.registeredAgent.name}</p>
              </div>
              {company.registeredAgent.company && (
                <div>
                  <p className="text-xs text-slate-600 mb-1">Company</p>
                  <p className="text-sm font-medium text-slate-900">{company.registeredAgent.company}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-xs text-slate-600 mb-1">Full Address</p>
                <p className="text-sm font-medium text-slate-900">
                  {company.registeredAgent.address}
                  {company.registeredAgent.city && `, ${company.registeredAgent.city}`}
                  {company.registeredAgent.state && `, ${company.registeredAgent.state}`}
                  {company.registeredAgent.zip && ` ${company.registeredAgent.zip}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasRegisteredAgent && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Registered Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Not Yet Assigned</strong> - Registered agent will be assigned during formation process
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
