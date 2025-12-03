"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "other" as Addon["category"],
    isActive: true,
    icon: "",
    features: "",
  })

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
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const token = authService.getToken()
      const addonData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        isActive: formData.isActive,
        icon: formData.icon || undefined,
        features: formData.features
          ? formData.features
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
          : [],
      }

      if (editingAddon) {
        // Update existing addon
        const response = await fetch("/api/addons", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingAddon.id,
            ...addonData,
          }),
        })

        if (response.ok) {
          toast({
            title: "Addon Updated",
            description: "The addon has been updated successfully",
          })
        } else {
          throw new Error("Failed to update addon")
        }
      } else {
        // Create new addon
        const response = await fetch("/api/addons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addonData),
        })

        if (response.ok) {
          toast({
            title: "Addon Created",
            description: "The addon has been created successfully",
          })
        } else {
          throw new Error("Failed to create addon")
        }
      }

      await loadAddons()
      setIsDialogOpen(false)
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this addon?")) {
      return
    }

    try {
      const token = authService.getToken()

      const response = await fetch(`/api/addons?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Addon Deleted",
          description: "The addon has been deleted successfully",
        })
        await loadAddons()
      } else {
        throw new Error("Failed to delete addon")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete addon",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (addon: Addon) => {
    try {
      const token = authService.getToken()

      const response = await fetch("/api/addons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: addon.id,
          isActive: !addon.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: addon.isActive ? "Addon Deactivated" : "Addon Activated",
          description: `The addon has been ${addon.isActive ? "deactivated" : "activated"}`,
        })
        await loadAddons()
      } else {
        throw new Error("Failed to toggle addon status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update addon status",
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
          <h1 className="text-3xl font-bold text-slate-900">Addons Management</h1>
          <p className="text-slate-600 mt-1">Create and manage add-on services for clients</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
          <Plus className="w-4 h-4 mr-2" />
          Add New Addon
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {addons.map((addon) => (
          <Card key={addon.id} className={`${!addon.isActive ? "opacity-60" : ""}`}>
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
                    onClick={() => handleDelete(addon.id)}
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
    </div>
  )
}
