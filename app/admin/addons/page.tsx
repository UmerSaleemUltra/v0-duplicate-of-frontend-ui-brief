"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, DollarSign, Search, X, Check } from "lucide-react"
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
}

interface User {
  id: string
  email: string
  name?: string
}

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [assignToAllUsers, setAssignToAllUsers] = useState(false)
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
        ...formData,
        features: formData.features.split(", ").filter(Boolean),
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
        const addonId = data.data?.addon?.id || editingAddon?.id
        
        if (!editingAddon) {
          // New addon created, show assignment modal
          setNewlyCreatedAddonId(addonId)
          setShowAssignmentInDialog(true)
          setSelectedUserIds(new Set())
          setAssignToAllUsers(false)
          setUserSearchQuery("")
          loadUsers()
        } else {
          // Existing addon updated
          toast({
            title: "Success",
            description: "Addon updated successfully",
          })
          setIsDialogOpen(false)
          await loadAddons()
        }
      } else {
        throw new Error("Failed to save addon")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save addon",
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

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const token = authService.getToken()

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const usersList = data.data?.users || data.users || data.data || []
        // Filter out admin@buzzfiling.com
        const filteredUsers = usersList.filter((user: any) => user.email !== "admin@buzzfiling.com")
        console.log("[v0] Users loaded successfully:", filteredUsers.length)
        setUsers(filteredUsers)
      } else {
        console.log("[v0] Failed to load users, status:", response.status)
        setUsers([])
      }
    } catch (error) {
      console.log("[v0] Error loading users:", error)
      setUsers([])
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
      })
      setShowAssignmentInDialog(true)
      setSelectedUserIds(new Set())
      setAssignToAllUsers(false)
      setUserSearchQuery("")
      loadUsers()
      
      // Load currently assigned users
      if (addon.assignedUserIds && addon.assignedUserIds.length > 0) {
        const assigned = users.filter(u => addon.assignedUserIds?.includes(u.id))
        setCurrentlyAssignedUsers(assigned)
      } else {
        setCurrentlyAssignedUsers([])
      }
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
      })
      setShowAssignmentInDialog(false)
      setNewlyCreatedAddonId(null)
      setSelectedUserIds(new Set())
      setAssignToAllUsers(false)
      setCurrentlyAssignedUsers([])
    }
    setIsDialogOpen(true)
  }

  const handleOpenAssignDialog = (addon: Addon) => {
    setSelectedAddonForAssign(addon)
    setSelectedUserIds(new Set())
    setAssignToAllUsers(false)
    setUserSearchQuery("")
    setIsAssignDialogOpen(true)
    loadUsers()
  }

  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery.trim()) return true
    const query = userSearchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query))
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
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
              Addons Management
            </h1>
            <p className="text-slate-600 mt-1">Create and manage add-on services for clients</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Addon
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {addons.map((addon) => (
            <Card
              key={addon.id}
              className={`transition-all duration-300 hover:shadow-xl hover:scale-105 ${!addon.isActive ? "opacity-60" : "border-slate-200"}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                    <CardDescription className="mt-1">{addon.description}</CardDescription>
                  </div>
                  <Badge className={getCategoryColor(addon.category)}>{addon.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span className="text-2xl font-bold text-slate-900">${addon.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Active</span>
                      <Switch checked={addon.isActive} onCheckedChange={() => handleToggleActive(addon)} />
                    </div>
                  </div>

                  {addon.features && addon.features.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Features:</p>
                      <ul className="space-y-1">
                        {addon.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="text-xs text-slate-600 flex items-start gap-1">
                            <span className="text-[#ff0d13] mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(addon)} className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(addon)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {addons.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-600 text-center">No addons yet. Create your first addon to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
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

              {!editingAddon && showAssignmentInDialog && (
                <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Assign to Users
                      </Label>
                      <p className="text-xs text-slate-600 mt-1">Assign this addon to users immediately after creation</p>
                    </div>
                    <Switch
                      checked={assignToAllUsers}
                      onCheckedChange={(checked) => {
                        setAssignToAllUsers(checked)
                        if (!checked) {
                          setSelectedUserIds(new Set())
                        }
                      }}
                    />
                  </div>

                  {assignToAllUsers && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          id="create-assign-all"
                          checked={assignToAllUsers}
                          readOnly
                          className="w-4 h-4 mt-1"
                        />
                        <label className="flex-1">
                          <span className="text-sm font-medium block">Assign to All Users</span>
                          <span className="text-xs text-slate-600">All current and future users will have access</span>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          id="create-assign-specific"
                          checked={!assignToAllUsers}
                          onChange={() => setAssignToAllUsers(false)}
                          className="w-4 h-4 mt-1"
                        />
                        <label htmlFor="create-assign-specific" className="flex-1 cursor-pointer">
                          <span className="text-sm font-medium block">Assign to Specific Users</span>
                          <span className="text-xs text-slate-600">Choose which users can access this addon</span>
                        </label>
                      </div>

                      {!assignToAllUsers && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">
                              Select Users ({selectedUserIds.size} selected)
                            </Label>
                            <div className="flex gap-2">
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
                              placeholder="Search users by name or email..."
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

                          <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
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
                                {filteredUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    onClick={() => handleUserToggle(user.id)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                      selectedUserIds.has(user.id) ? "bg-red-50" : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        selectedUserIds.has(user.id)
                                          ? "bg-[#880000] border-[#880000]"
                                          : "border-slate-300"
                                      }`}
                                    >
                                      {selectedUserIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {user.name || "No Name"}
                                      </p>
                                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {filteredUsers.length > 0 && (
                            <p className="text-xs text-slate-500">
                              Showing {filteredUsers.length} of {users.length} users
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {editingAddon && showAssignmentInDialog && (
                <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                  <Label className="text-base font-semibold">Assign Addon to Users</Label>

                  {currentlyAssignedUsers.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">Currently Assigned Users ({currentlyAssignedUsers.length})</p>
                      <div className="space-y-2">
                        {currentlyAssignedUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900">{user.name || user.email}</span>
                            <span className="text-blue-700">({user.email})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        id="edit-assign-all"
                        checked={assignToAllUsers}
                        onChange={() => setAssignToAllUsers(true)}
                        className="w-4 h-4 mt-1"
                      />
                      <label htmlFor="edit-assign-all" className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium block">Assign to All Users</span>
                        <span className="text-xs text-slate-600">All current and future users will have access</span>
                      </label>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        id="edit-assign-specific"
                        checked={!assignToAllUsers}
                        onChange={() => setAssignToAllUsers(false)}
                        className="w-4 h-4 mt-1"
                      />
                      <label htmlFor="edit-assign-specific" className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium block">Assign to Specific Users</span>
                        <span className="text-xs text-slate-600">Choose which users can access this addon</span>
                      </label>
                    </div>
                  </div>

                  {!assignToAllUsers && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          Select Users ({selectedUserIds.size} selected)
                        </Label>
                        <div className="flex gap-2">
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
                          placeholder="Search users by name or email..."
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

                      <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
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
                            {filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => handleUserToggle(user.id)}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                  selectedUserIds.has(user.id) ? "bg-red-50" : "hover:bg-slate-50"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    selectedUserIds.has(user.id)
                                      ? "bg-[#880000] border-[#880000]"
                                      : "border-slate-300"
                                  }`}
                                >
                                  {selectedUserIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {user.name || "No Name"}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {filteredUsers.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Showing {filteredUsers.length} of {users.length} users
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false)
                setShowAssignmentInDialog(false)
                setNewlyCreatedAddonId(null)
              }} disabled={isSaving || isAssigning}>
                {showAssignmentInDialog && !editingAddon ? "Skip Assignment" : "Cancel"}
              </Button>
              {!showAssignmentInDialog || !editingAddon ? (
                <Button onClick={handleSave} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]" disabled={isSaving || isAssigning}>
                  {isSaving ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      {editingAddon ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingAddon ? "Update Addon" : "Create Addon"}</>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSkipAssignment}
                    disabled={isAssigning}
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleSubmitAssignmentAfterCreate}
                    className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                    disabled={isAssigning || (!assignToAllUsers && selectedUserIds.size === 0)}
                  >
                    {isAssigning ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Assigning...
                      </>
                    ) : (
                      <>Complete & Assign</>
                    )}
                  </Button>
                </>
              )}
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
