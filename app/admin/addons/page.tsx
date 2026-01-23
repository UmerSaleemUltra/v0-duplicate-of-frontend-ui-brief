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
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedAddonForAssign, setSelectedAddonForAssign] = useState<Addon | null>(null)
  const [assignToAllUsers, setAssignToAllUsers] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [assignOnCreate, setAssignOnCreate] = useState(false)
  const [createAssignToAll, setCreateAssignToAll] = useState(false)
  const [createSelectedUserIds, setCreateSelectedUserIds] = useState<Set<string>>(new Set())
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

      // Add user assignment for new addons only
      if (!editingAddon && assignOnCreate) {
        bodyData.assignToAll = createAssignToAll
        if (!createAssignToAll) {
          bodyData.userIds = Array.from(createSelectedUserIds)
        }
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
        toast({
          title: editingAddon ? "Addon Updated" : "Addon Created",
          description: `The addon has been ${editingAddon ? "updated" : "created"}`,
        })
        setIsDialogOpen(false)
        await loadAddons()
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
        console.log("[v0] Users loaded successfully:", usersList.length)
        setUsers(usersList)
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
      // Reset assignment states for new addon
      setAssignOnCreate(false)
      setCreateAssignToAll(false)
      setCreateSelectedUserIds(new Set())
      setUserSearchQuery("")
      // Load users when creating new addon
      loadUsers()
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

  const handleCreateUserToggle = (userId: string) => {
    const newSelected = new Set(createSelectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setCreateSelectedUserIds(newSelected)
  }

  const handleSelectAllFilteredCreate = () => {
    const newSelected = new Set(createSelectedUserIds)
    filteredUsers.forEach((user) => newSelected.add(user.id))
    setCreateSelectedUserIds(newSelected)
  }

  const handleClearSelectionCreate = () => {
    setCreateSelectedUserIds(new Set())
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

  const handleSubmitAssignment = async () => {
    if (!selectedAddonForAssign) {
      toast({
        title: "Error",
        description: "No addon selected",
        variant: "destructive",
      })
      return
    }

    if (!assignToAllUsers && selectedUserIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select users or choose 'Assign to All Users'",
        variant: "destructive",
      })
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
          addonId: selectedAddonForAssign.id,
          assignToAll: assignToAllUsers,
          userIds: assignToAllUsers ? [] : Array.from(selectedUserIds),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Addon assigned successfully",
        })
        setIsAssignDialogOpen(false)
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
                    <Button variant="outline" size="sm" onClick={() => handleOpenAssignDialog(addon)} className="flex-1">
                      <Package className="w-3 h-3 mr-1" />
                      Assign
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

              {!editingAddon && (
                <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="assignOnCreate" className="text-sm font-medium">
                        Assign to Users
                      </Label>
                      <p className="text-xs text-slate-600 mt-1">Assign this addon to users when created</p>
                    </div>
                    <Switch
                      id="assignOnCreate"
                      checked={assignOnCreate}
                      onCheckedChange={(checked) => {
                        setAssignOnCreate(checked)
                        if (!checked) {
                          setCreateAssignToAll(false)
                          setCreateSelectedUserIds(new Set())
                        }
                      }}
                    />
                  </div>

                  {assignOnCreate && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          id="create-assign-all"
                          checked={createAssignToAll}
                          onChange={() => setCreateAssignToAll(true)}
                          className="w-4 h-4 mt-1"
                        />
                        <label htmlFor="create-assign-all" className="flex-1 cursor-pointer">
                          <span className="text-sm font-medium block">Assign to All Users</span>
                          <span className="text-xs text-slate-600">All current and future users will have access</span>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          id="create-assign-specific"
                          checked={!createAssignToAll}
                          onChange={() => setCreateAssignToAll(false)}
                          className="w-4 h-4 mt-1"
                        />
                        <label htmlFor="create-assign-specific" className="flex-1 cursor-pointer">
                          <span className="text-sm font-medium block">Assign to Specific Users</span>
                          <span className="text-xs text-slate-600">Choose which users can access this addon</span>
                        </label>
                      </div>

                      {!createAssignToAll && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">
                              Select Users ({createSelectedUserIds.size} selected)
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllFilteredCreate}
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
                                onClick={handleClearSelectionCreate}
                                disabled={createSelectedUserIds.size === 0}
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
                                    onClick={() => handleCreateUserToggle(user.id)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                      createSelectedUserIds.has(user.id) ? "bg-red-50" : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        createSelectedUserIds.has(user.id)
                                          ? "bg-[#880000] border-[#880000]"
                                          : "border-slate-300"
                                      }`}
                                    >
                                      {createSelectedUserIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
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
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]" disabled={isSaving}>
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

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Addon to Users</DialogTitle>
              <DialogDescription>Assign "{selectedAddonForAssign?.name}" to users</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Assignment Option</Label>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    id="assignAll"
                    name="assignOption"
                    checked={assignToAllUsers}
                    onChange={(e) => {
                      setAssignToAllUsers(e.target.checked)
                      setSelectedUserIds(new Set())
                    }}
                    className="w-4 h-4 mt-1"
                  />
                  <Label htmlFor="assignAll" className="flex-1 cursor-pointer mb-0">
                    <span className="font-medium">Assign to All Users</span>
                    <p className="text-xs text-slate-600 mt-1">Grant this addon to all registered users</p>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    id="assignSelected"
                    name="assignOption"
                    checked={!assignToAllUsers}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignToAllUsers(false)
                      }
                    }}
                    className="w-4 h-4 mt-1"
                  />
                  <Label htmlFor="assignSelected" className="flex-1 cursor-pointer mb-0">
                    <span className="font-medium">Assign to Selected Users</span>
                    <p className="text-xs text-slate-600 mt-1">Choose specific users to grant this addon</p>
                  </Label>
                </div>
              </div>

              {!assignToAllUsers && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Select Users ({selectedUserIds.size} selected)</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllFiltered}
                        disabled={filteredUsers.length === 0}
                        className="text-xs bg-transparent"
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
                        className="text-xs bg-transparent"
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
                              {selectedUserIds.has(user.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
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

              {selectedAddonForAssign && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm font-medium text-slate-900">Addon Details:</p>
                  <p className="text-sm text-slate-600 mt-1">
                    ${selectedAddonForAssign.price} - {selectedAddonForAssign.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isAssigning}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignment}
                className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                disabled={isAssigning || (!assignToAllUsers && selectedUserIds.size === 0)}
              >
                {isAssigning ? "Assigning..." : "Assign Addon"}
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
