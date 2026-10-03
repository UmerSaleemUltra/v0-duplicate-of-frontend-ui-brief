"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
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
  RefreshCw,
  Copy,
  Check,
  Radio,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [isLive, setIsLive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const itemsPerPage = 12

  // Realtime SSE connection
  useEffect(() => {
    const token = authService.getToken()
    if (!token) return

    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      eventSource = new EventSource(`/api/realtime/sse?token=${token}`)

      eventSource.onopen = () => {
        setIsLive(true)
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
          reconnectTimeout = null
        }
      }

      eventSource.onerror = () => {
        setIsLive(false)
        eventSource?.close()
        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.resource === "promo-codes") {
            handleRealtimeUpdate(data.action, data.data)
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    connect()

    return () => {
      eventSource?.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [])

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((action: string, data: any) => {
    switch (action) {
      case "created":
        setPromoCodes((prev) => [data, ...prev])
        setCurrentPage(1)
        toast.info(`New promo code "${data.code}" created`)
        break
      case "updated":
        setPromoCodes((prev) =>
          prev.map((code) => (code._id === data._id ? data : code))
        )
        toast.info(`Promo code "${data.code}" updated`)
        break
      case "deleted":
        setPromoCodes((prev) => prev.filter((code) => code._id !== data._id))
        setCurrentPage(1)
        toast.info("Promo code deleted")
        break
    }
  }, [])

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
        // SSE will handle updating the list in realtime
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
    try {
      const token = authService.getToken()
      const response = await fetch(`/api/promo-codes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Promo code deleted")
        // SSE will handle updating the list in realtime
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
        // SSE will handle updating the list in realtime
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
  
  // Pagination
  const totalPages = Math.ceil(promoCodes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCodes = promoCodes.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Promo Codes</h1>
            {isLive && (
              <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <p className="mt-1 text-lg leading-7 text-slate-500">Manage discount codes for checkout</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchPromoCodes}
            disabled={isLoading}
            className="h-11 rounded-xl border-slate-200 px-5 text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 rounded-xl bg-[#880000] px-5 shadow-sm hover:bg-[#660000]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Promo Code
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">Total Codes</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{promoCodes.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">Active Codes</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">Total Uses</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{totalUsed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Promo code cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <Tag className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">No promo codes yet. Create your first promo code.</p>
          <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Create Promo Code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedCodes.map((code) => (
            <div key={code._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="truncate text-sm font-semibold tracking-wide text-slate-950">{code.code}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(code.code)} aria-label={`Copy ${code.code}`}>
                      {copiedCode === code.code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </Button>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{code.description || "Discount code for checkout"}</p>
                </div>
                {getStatusBadge(code)}
              </div>

              <div className="my-3 border-t border-slate-100" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">
                    {code.discountType === "percentage" ? `${code.discountValue}%` : `$${code.discountValue}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{code.discountType === "percentage" ? "Percentage discount" : "Fixed discount"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Active</span>
                  <Switch checked={code.isActive} onCheckedChange={() => handleToggleActive(code)} />
                </div>
              </div>

              <div className="my-3 border-t border-slate-100" />
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-1 text-xs text-slate-400">
                  <p>{code.usedCount}{code.usageLimit ? ` / ${code.usageLimit}` : " / Unlimited"} uses</p>
                  <p>{code.validUntil ? `Valid to ${formatDate(code.validUntil)}` : `From ${formatDate(code.validFrom)}`}</p>
                  <Badge variant="outline" className="capitalize">{code.applicableTo === "all" ? "All Packages" : code.applicableTo}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => handleOpenDialog(code)} aria-label={`Edit ${code.code}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-500" onClick={() => setPendingDeleteId(code._id)} aria-label={`Delete ${code.code}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 gap-4">
            <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {startIndex + 1}–{Math.min(endIndex, promoCodes.length)} of {promoCodes.length}
            </p>
            <div className="overflow-x-auto flex-1">
              <div className="flex items-center gap-1 min-w-max">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 shrink-0 px-3 text-xs"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`h-8 w-8 p-0 text-xs shrink-0 ${
                      currentPage === page 
                        ? "bg-slate-900 text-white hover:bg-slate-800" 
                        : "text-slate-600"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="h-8 shrink-0 px-3 text-xs"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-[620px] overflow-y-auto rounded-xl p-4 sm:p-6">
          <DialogHeader className="pr-6">
            <DialogTitle className="text-xl sm:text-2xl">{editingCode ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3 sm:gap-4 sm:py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                placeholder="e.g. SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="h-10 font-mono uppercase"
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
                className="min-h-20 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#880000] hover:bg-[#660000] sm:w-auto"
            >
              {isSubmitting ? "Saving..." : editingCode ? "Update Code" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete Promo Code"
        description="Are you sure you want to delete this promo code? This action cannot be undone."
        actionLabel="Delete Promo Code"
        onConfirm={() => {
          if (pendingDeleteId) void handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
