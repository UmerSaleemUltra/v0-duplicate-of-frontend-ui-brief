"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, DollarSign, Search, X, Check, Copy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogDescription ,DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { Spinner } from "@/components/ui/spinner"

interface Addon {
  id: string
  name: string
  description: string
  price: number
  category: "compliance" | "tax" | "legal" | "document" | "other"
  isActive: boolean
  icon?: string
  features?: string[]
  assignedUserIds?: string[]
  billingType?: "one_time" | "recurring_monthly" | "recurring_quarterly" | "recurring_annual" | "custom"
  customDuration?: string
}

interface User {
  id: string
  email: string
  name?: string
  companyNames?: string[]
}

const MAX_LEN = 30

function TruncatedCell({ text, maxLen = MAX_LEN }: { text: string; maxLen?: number }) {
  const [copied, setCopied] = useState(false)
  if (!text) return null
  const isTruncated = text.length > maxLen
  const display = isTruncated ? text.slice(0, maxLen) + "…" : text

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!isTruncated) return <span>{text}</span>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 cursor-default min-w-0">
          <span className="truncate">{display}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy() }}
            className="shrink-0 text-slate-300 hover:text-slate-600 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [assignToAllUsers, setAssignToAllUsers] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [showAssignmentInDialog, setShowAssignmentInDialog] = useState(false)
  const [newlyCreatedAddonId, setNewlyCreatedAddonId] = useState<string | null>(null)
  const [currentlyAssignedUsers, setCurrentlyAssignedUsers] = useState<User[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDeleteClick = (addon: Addon) => {
    setAddonToDelete(addon)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!addonToDelete) return

    setIsDeleting(true)
    try {
      const token = authService.getToken()

      const response = await fetch(`/api/addons/${addonToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Addon deleted successfully",
        })
        setDeleteDialogOpen(false)
        setAddonToDelete(null)
        await loadAddons()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete addon")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete addon",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const token = authService.getToken()
      const method = editingAddon ? "PUT" : "POST"
      const url = editingAddon ? `/api/addons/${editingAddon.id}` : "/api/addons"
      
      const bodyData: any = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        isActive: formData.isActive,
        icon: formData.icon,
        features: formData.features.split(", ").filter(Boolean),
        billingType: formData.billingType,
        customDuration: formData.customDuration,
        assignedUserIds: assignToAllUsers ? [] : Array.from(selectedUserIds),
      }

      const body = JSON.stringify(bodyData)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      })

      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Success",
          description: editingAddon ? "Addon updated successfully" : "Addon created successfully",
        })
        
        setIsDialogOpen(false)
        await loadAddons()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save addon",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(" Error saving addon:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save addon",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    loadAddons()
  }, [])

  const loadAddons = async () => {
    try {
      const token = authService.getToken()

      const response = await fetch("/api/addons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const addonsList = data.data?.addons || data.addons || []
        setAddons(addonsList)
      } else {
        toast({
          title: "Error",
          description: "Failed to load addons",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load addons",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async (): Promise<any[]> => {
    try {
      setIsLoadingUsers(true)
      const token = authService.getToken()

      const response = await fetch("/api/users?includeCompanies=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const usersList = data.data?.users || data.data || []
        // Filter out admin@buzzfiling.com and admin role users
        const filteredUsers = usersList.filter((user: any) => 
          user.email !== "admin@buzzfiling.com" && user.role !== "admin"
        )
        setUsers(filteredUsers)
        return filteredUsers
      } else {
        setUsers([])
        return []
      }
    } catch (error) {
      setUsers([])
      return []
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleOpenDialog = (addon?: Addon) => {
    if (addon) {
      setEditingAddon(addon)
      setFormData({
        name: addon.name,
        description: addon.description,
        price: addon.price.toString(),
        category: addon.category,
        isActive: addon.isActive,
        icon: addon.icon || "",
        features: addon.features?.join(", ") || "",
        billingType: addon.billingType || "one_time",
        customDuration: addon.customDuration || "",
      })
      // Check if addon has specific assigned users (if length > 0, specific users are assigned)
      const hasSpecificUsers = addon.assignedUserIds && addon.assignedUserIds.length > 0
      setShowAssignmentInDialog(true)
      setUserSearchQuery("")
      
      // Load users first
      loadUsers().then((loadedUsers) => {
        // Then pre-populate selectedUserIds with currently assigned users
        if (hasSpecificUsers) {
          const assignedIds = addon.assignedUserIds!.map((id: any) => 
            typeof id === 'object' ? id.toString() : id
          )
          // Set state so user selection shows these users
          setSelectedUserIds(new Set(assignedIds))
          // Also populate currentlyAssignedUsers with user details
          const assignedUserDetails = loadedUsers.filter((u: any) => {
            const userId = u.id || u._id?.toString?.() || u._id
            return assignedIds.includes(typeof userId === 'object' ? userId.toString() : userId)
          })
          setCurrentlyAssignedUsers(assignedUserDetails)
          setAssignToAllUsers(false) // Set to false so specific user selection is active
        } else {
          setCurrentlyAssignedUsers([])
          setSelectedUserIds(new Set())
          setAssignToAllUsers(true) // Set to true for assign all users
        }
      })
    } else {
      setEditingAddon(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "other",
        isActive: true,
        icon: "",
        features: "",
        billingType: "one_time",
        customDuration: "",
      })
      setShowAssignmentInDialog(false)
      setNewlyCreatedAddonId(null)
      setSelectedUserIds(new Set())
      setAssignToAllUsers(true) // Default to assign all for new addons
      setCurrentlyAssignedUsers([])
      // Load users when opening new addon dialog
      loadUsers()
    }
    setIsDialogOpen(true)
  }

  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery.trim()) return true
    const query = userSearchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.companyNames && user.companyNames.some(name => name.toLowerCase().includes(query)))
    )
  })

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedUserIds)
    filteredUsers.forEach((user) => newSelected.add(user.id))
    setSelectedUserIds(newSelected)
  }

  const handleClearSelection = () => {
    setSelectedUserIds(new Set())
  }

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const handleSubmitAssignmentAfterCreate = async () => {
    if (!newlyCreatedAddonId) return

    if (!assignToAllUsers && selectedUserIds.size === 0) {
      // Just close without assigning
      setShowAssignmentInDialog(false)
      setNewlyCreatedAddonId(null)
      toast({
        title: "Success",
        description: "Addon created successfully",
      })
      setIsDialogOpen(false)
      await loadAddons()
      return
    }

    setIsAssigning(true)

    try {
      const token = authService.getToken()

      const response = await fetch("/api/addons/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addonId: newlyCreatedAddonId,
          assignToAll: assignToAllUsers,
          userIds: assignToAllUsers ? [] : Array.from(selectedUserIds),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Addon created and assigned successfully",
        })
        setShowAssignmentInDialog(false)
        setNewlyCreatedAddonId(null)
        setIsDialogOpen(false)
        await loadAddons()
      } else {
        toast({
          title: "Error",
          description: "Failed to assign addon",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign addon",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleSkipAssignment = () => {
    setShowAssignmentInDialog(false)
    setNewlyCreatedAddonId(null)
    toast({
      title: "Success",
      description: "Addon created successfully",
    })
    setIsDialogOpen(false)
    loadAddons()
  }

  const handleToggleActive = async (addon: Addon) => {
    try {
      const token = authService.getToken()

      const response = await fetch(`/api/addons/${addon.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !addon.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Addon ${!addon.isActive ? "activated" : "deactivated"}`,
        })
        await loadAddons()
      } else {
        throw new Error("Failed to update addon")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update addon status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (addonId: string) => {
    try {
      const token = authService.getToken()

      const response = await fetch(`/api/addons/${addonId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Addon deleted successfully",
        })
        await loadAddons()
      } else {
        throw new Error("Failed to delete addon")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete addon",
        variant: "destructive",
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      compliance: "bg-blue-100 text-blue-700 border-blue-200",
      tax: "bg-green-100 text-green-700 border-green-200",
      legal: "bg-purple-100 text-purple-700 border-purple-200",
      document: "bg-orange-100 text-orange-700 border-orange-200",
      other: "bg-slate-100 text-slate-700 border-slate-200",
    }
    return colors[category] || colors.other
  }

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "other" as Addon["category"],
    isActive: true,
    icon: "",
    features: "",
    billingType: "one_time" as Addon["billingType"],
    customDuration: "",
  })

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded w-40"></div>
        </div>

        {/* Search Skeleton */}
        <div className="h-10 bg-slate-200 rounded w-full max-w-md"></div>

        {/* Addons Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-32"></div>
                    <div className="h-6 bg-slate-100 rounded-full w-24"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-slate-200 rounded"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                <div className="pt-3 border-t">
                  <div className="h-6 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t flex gap-2">
                <div className="flex-1 h-9 bg-slate-200 rounded"></div>
                <div className="flex-1 h-9 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Addons</h1>
            <p className="text-sm text-slate-500 mt-0.5">Create and manage add-on services for clients</p>
          </div>
          <Button onClick={() => handleOpenDialog()} variant="outline" size="sm" className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Addon
          </Button>
        </div>

        <TooltipProvider delayDuration={300}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className={`bg-white border border-slate-200 rounded-2xl p-5 transition-opacity ${!addon.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    <TruncatedCell text={addon.name} maxLen={28} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <TruncatedCell text={addon.description || ""} maxLen={50} />
                  </p>
                </div>
                <span className={`ml-3 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(addon.category)}`}>
                  {addon.category}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <span className="text-lg font-semibold text-slate-900">${addon.price}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Active</span>
                  <Switch checked={addon.isActive} onCheckedChange={() => handleToggleActive(addon)} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-slate-400">
                  {addon.billingType === "one_time" && "One time"}
                  {addon.billingType === "recurring_monthly" && "Monthly"}
                  {addon.billingType === "recurring_quarterly" && "Quarterly"}
                  {addon.billingType === "recurring_annual" && "Annual"}
                  {addon.billingType === "custom" && `${addon.customDuration} days`}
                  {!addon.billingType && "One time"}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={() => handleOpenDialog(addon)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500" onClick={() => handleDeleteClick(addon)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {addons.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-16 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No addons yet. Create your first addon.</p>
            </div>
          )}
        </div>
        </TooltipProvider>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddon ? "Edit Addon" : "Create New Addon"}</DialogTitle>
              <DialogDescription>
                {editingAddon ? "Update the addon details below" : "Fill in the details to create a new addon"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Addon Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., EIN Application"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this addon provides"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price ($) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Addon["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Feature 1, Feature 2, Feature 3"
                  rows={2}
                />
                <p className="text-xs text-slate-500">Separate each feature with a comma</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingType">Billing Type</Label>
                  <Select
                    value={formData.billingType || "one_time"}
                    onValueChange={(value) => {
                      setFormData({ ...formData, billingType: value as Addon["billingType"] })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="recurring_monthly">Recurring Monthly</SelectItem>
                      <SelectItem value="recurring_quarterly">Recurring Quarterly (3 Months)</SelectItem>
                      <SelectItem value="recurring_annual">Recurring Annual</SelectItem>
                      <SelectItem value="custom">Custom Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.billingType === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customDuration">Custom Duration (days)</Label>
                    <Input
                      id="customDuration"
                      type="number"
                      value={formData.customDuration}
                      onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })}
                      placeholder="e.g., 30"
                      min="1"
                    />
                  </div>
                )}
              </div>

              {/* Assignment Section - Two Clear Options */}
              <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <Label className="text-sm font-medium">User Assignment</Label>
                <p className="text-xs text-slate-600 mb-3">Choose how to assign this addon to users (admin users are excluded)</p>
                
                {/* Option 1: Assign to All Users */}
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  assignToAllUsers && selectedUserIds.size === 0
                    ? "border-[#880000] bg-red-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => {
                  setAssignToAllUsers(true)
                  setSelectedUserIds(new Set())
                  setCurrentlyAssignedUsers([])
                  setUserSearchQuery("")
                }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                      assignToAllUsers && selectedUserIds.size === 0
                        ? "bg-[#880000] border-[#880000]"
                        : "border-slate-300"
                    }`}>
                      {assignToAllUsers && selectedUserIds.size === 0 && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Assign to All Users</p>
                      <p className="text-xs text-slate-600 mt-1">Every non-admin user will have access to this addon</p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Select Specific Users */}
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedUserIds.size > 0
                    ? "border-[#880000] bg-red-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => {
                  if (selectedUserIds.size === 0) {
                    setAssignToAllUsers(false)
                    loadUsers()
                  }
                }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                      selectedUserIds.size > 0
                        ? "bg-[#880000] border-[#880000]"
                        : "border-slate-300"
                    }`}>
                      {selectedUserIds.size > 0 && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Select Specific Users</p>
                      <p className="text-xs text-slate-600 mt-1">Choose individual users from the list below ({selectedUserIds.size} selected)</p>
                    </div>
                  </div>
                </div>

                {/* Currently Assigned Users (when editing) */}
                {editingAddon && currentlyAssignedUsers && currentlyAssignedUsers.length > 0 && (
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <p className="text-sm font-medium text-blue-900 mb-2">Currently Assigned To:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentlyAssignedUsers.map((user: any) => (
                        <Badge key={user.id || user._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                          <span className="font-medium">{user.name || "No Name"}</span>
                          <span className="text-blue-600 ml-1">({user.email})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Selection List (when option 2 is selected) */}
                {selectedUserIds.size >= 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <Label className="text-sm font-medium">
                        Select Users ({selectedUserIds.size} of {users.length})
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllFiltered}
                          disabled={filteredUsers.length === 0}
                          className="text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearSelection}
                          disabled={selectedUserIds.size === 0}
                          className="text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by name, email, or company..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                      {userSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className={`border border-slate-200 rounded-lg ${filteredUsers.length > 20 ? 'max-h-72' : 'max-h-48'} overflow-y-auto bg-white`}>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Spinner className="w-6 h-6" />
                          <span className="ml-2 text-sm text-slate-600">Loading users...</span>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-slate-600">
                            {userSearchQuery ? "No users match your search" : "No users found"}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredUsers.slice(0, 100).map((user) => (
                            <div
                              key={user.id}
                              onClick={() => handleUserToggle(user.id)}
                              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                selectedUserIds.has(user.id) ? "bg-red-50" : "hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                  selectedUserIds.has(user.id)
                                    ? "bg-[#880000] border-[#880000]"
                                    : "border-slate-300"
                                }`}
                              >
                                {selectedUserIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">
                                  {user.name || "No Name"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {user.email}
                                </p>
                                {user.companyNames && user.companyNames.length > 0 && (
                                  <p className="text-xs text-[#880000] font-medium">
                                    {user.companyNames.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedUserIds.size > 0 && filteredUsers.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Showing {Math.min(filteredUsers.length, 100)} of {users.length} users
                        {filteredUsers.length > 100 && " (Use search to narrow down)"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-lg gap-3">
                <div>
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Active Status
                  </Label>
                  <p className="text-xs text-slate-600 mt-1">Make this addon available to clients</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false)
                setShowAssignmentInDialog(false)
                setNewlyCreatedAddonId(null)
              }} disabled={isSaving || isAssigning} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-[#880000] to-[#ff0d13] w-full sm:w-auto" disabled={isSaving || isAssigning}>
                {isSaving ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    {editingAddon ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{editingAddon ? "Update Addon" : "Create Addon"}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Addon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{addonToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}
