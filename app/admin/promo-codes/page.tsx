"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"

type PromoCode = {
  _id: string
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount: number | null
  usageLimit: number | null
  usedCount: number
  perUserLimit: number | null
  validFrom: string
  validUntil: string | null
  applicableTo: "all" | "starter" | "advanced"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const emptyPromoCode = {
  code: "",
  description: "",
  discountType: "percentage" as const,
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscountAmount: null as number | null,
  usageLimit: null as number | null,
  perUserLimit: null as number | null,
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: "",
  applicableTo: "all" as const,
  isActive: true,
}

export default function PromoCodesPage() {
  const router = useRouter()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [formData, setFormData] = useState(emptyPromoCode)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }
    fetchPromoCodes()
  }, [router])

  const fetchPromoCodes = async () => {
    setIsLoading(true)
    try {
      const token = authService.getToken()
      const response = await fetch("/api/promo-codes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setPromoCodes(data.data || [])
      } else {
        toast.error(data.error || "Failed to fetch promo codes")
      }
    } catch (error) {
      toast.error("Failed to fetch promo codes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (code?: PromoCode) => {
    if (code) {
      setEditingCode(code)
      setFormData({
        code: code.code,
        description: code.description,
        discountType: code.discountType,
        discountValue: code.discountValue,
        minOrderAmount: code.minOrderAmount || 0,
        maxDiscountAmount: code.maxDiscountAmount,
        usageLimit: code.usageLimit,
        perUserLimit: code.perUserLimit,
        validFrom: code.validFrom ? new Date(code.validFrom).toISOString().split("T")[0] : "",
        validUntil: code.validUntil ? new Date(code.validUntil).toISOString().split("T")[0] : "",
        applicableTo: code.applicableTo,
        isActive: code.isActive,
      })
    } else {
      setEditingCode(null)
      setFormData(emptyPromoCode)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      toast.error("Promo code is required")
      return
    }
    if (!formData.discountValue || formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0")
      return
    }

    setIsSubmitting(true)
    try {
      const token = authService.getToken()
      const url = "/api/promo-codes"
      const method = editingCode ? "PATCH" : "POST"
      const body = editingCode
        ? { id: editingCode._id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(editingCode ? "Promo code updated" : "Promo code created")
        setIsDialogOpen(false)
        fetchPromoCodes()
      } else {
        toast.error(data.error || "Failed to save promo code")
      }
    } catch (error) {
      toast.error("Failed to save promo code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return

    try {
      const token = authService.getToken()
      const response = await fetch(`/api/promo-codes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Promo code deleted")
        fetchPromoCodes()
      } else {
        toast.error(data.error || "Failed to delete promo code")
      }
    } catch (error) {
      toast.error("Failed to delete promo code")
    }
  }

  const handleToggleActive = async (code: PromoCode) => {
    try {
      const token = authService.getToken()
      const response = await fetch("/api/promo-codes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: code._id, isActive: !code.isActive }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Promo code ${code.isActive ? "deactivated" : "activated"}`)
        fetchPromoCodes()
      } else {
        toast.error(data.error || "Failed to update promo code")
      }
    } catch (error) {
      toast.error("Failed to update promo code")
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No limit"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (code: PromoCode) => {
    if (!code.isActive) {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Inactive</Badge>
    }
    const now = new Date()
    if (code.validUntil && new Date(code.validUntil) < now) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700">Expired</Badge>
    }
    if (code.usageLimit && code.usedCount >= code.usageLimit) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Limit Reached</Badge>
    }
    return <Badge className="bg-green-100 text-green-700">Active</Badge>
  }

  // Stats
  const activeCount = promoCodes.filter(c => c.isActive && (!c.validUntil || new Date(c.validUntil) > new Date())).length
  const totalUsed = promoCodes.reduce((sum, c) => sum + c.usedCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="text-sm text-slate-500 mt-1">Manage discount codes for checkout</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPromoCodes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => handleOpenDialog()} className="bg-[#880000] hover:bg-[#660000]">
            <Plus className="h-4 w-4 mr-2" />
            Add Promo Code
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#880000]/10">
                <Tag className="h-6 w-6 text-[#880000]" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Codes</p>
                <p className="text-2xl font-bold text-slate-900">{promoCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Codes</p>
                <p className="text-2xl font-bold text-green-700">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Uses</p>
                <p className="text-2xl font-bold text-blue-700">{totalUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No promo codes yet</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first promo code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((code) => (
                    <TableRow key={code._id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono font-semibold text-slate-800">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(code.code)}
                          >
                            {copiedCode === code.code ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </Button>
                        </div>
                        {code.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">
                            {code.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {code.discountType === "percentage" ? (
                            <>
                              <Percent className="h-4 w-4 text-slate-400" />
                              <span className="font-semibold">{code.discountValue}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 text-slate-400" />
                              <span className="font-semibold">${code.discountValue}</span>
                            </>
                          )}
                        </div>
                        {code.minOrderAmount > 0 && (
                          <p className="text-xs text-slate-500">Min: ${code.minOrderAmount}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{code.usedCount}</span>
                        <span className="text-slate-400">
                          {code.usageLimit ? ` / ${code.usageLimit}` : " / Unlimited"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(code.validFrom)}</span>
                        </div>
                        {code.validUntil && (
                          <p className="text-xs text-slate-500">to {formatDate(code.validUntil)}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {code.applicableTo === "all" ? "All Packages" : code.applicableTo}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(code)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={code.isActive}
                          onCheckedChange={() => handleToggleActive(code)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(code)}
                          >
                            <Pencil className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(code._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                placeholder="e.g. SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Internal note about this promo code"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Discount Type *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountValue">
                  {formData.discountType === "percentage" ? "Percentage *" : "Amount ($) *"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={1}
                  max={formData.discountType === "percentage" ? 100 : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minOrderAmount">Min Order Amount ($)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.minOrderAmount || ""}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                />
              </div>
              {formData.discountType === "percentage" && (
                <div className="grid gap-2">
                  <Label htmlFor="maxDiscountAmount">Max Discount ($)</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min={0}
                    placeholder="No limit"
                    value={formData.maxDiscountAmount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usageLimit">Total Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={formData.usageLimit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="perUserLimit">Per User Limit</Label>
                <Input
                  id="perUserLimit"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={formData.perUserLimit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, perUserLimit: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Applicable To</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value: "all" | "starter" | "advanced") =>
                  setFormData({ ...formData, applicableTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="starter">Starter Package Only</SelectItem>
                  <SelectItem value="advanced">Advanced Package Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#880000] hover:bg-[#660000]"
            >
              {isSubmitting ? "Saving..." : editingCode ? "Update Code" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
