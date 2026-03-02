"use client"

import { useState, useRef } from "react"
import { Receipt, Calendar, Phone, ExternalLink, Pencil, Check, X, Upload, Loader2 } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface OrderPricingCardProps {
  order: any
  onOrderUpdate?: (updatedOrder: any) => void
}

interface EditablePriceProps {
  label: string
  value: number
  onSave: (val: number) => void
  saving: boolean
}

function EditablePrice({ label, value, onSave, saving }: EditablePriceProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const startEdit = () => {
    setDraft(value.toFixed(2))
    setEditing(true)
  }

  const cancel = () => setEditing(false)

  const confirm = () => {
    const num = parseFloat(draft)
    if (isNaN(num) || num < 0) return
    onSave(num)
    setEditing(false)
  }

  return (
    <div className="bg-white px-5 py-4">
      <p className="text-xs font-medium mb-2 text-gray-500">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold text-gray-900">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirm()
              if (e.key === "Escape") cancel()
            }}
            autoFocus
            className="w-28 text-xl font-semibold bg-transparent border-b-2 border-blue-500 outline-none text-gray-900"
          />
          <button
            onClick={confirm}
            disabled={saving}
            className="p-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cancel}
            className="p-1.5 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-gray-900">${value.toFixed(2)}</p>
          <button
            onClick={startEdit}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            title="Edit price"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

export function OrderPricingCard({ order, onOrderUpdate }: OrderPricingCardProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  // Use only order.pricing — no double-fallback to avoid duplicate display
  const pricing = order?.pricing || {}
  const packagePrice = pricing.packagePrice ?? 0
  const stateFee = pricing.stateFilingFee ?? 0
  const addonsTotal = pricing.addonsTotal ?? 0

  const whatsappPhone = order?.whatsappPhone || order?.paymentInfo?.whatsappPhone
  const receiptUrl = order?.receiptUrl || order?.paymentInfo?.receiptUrl

  const savePricingField = async (
    field: "packagePrice" | "stateFilingFee" | "addonsTotal",
    value: number,
  ) => {
    if (!order?.id) return
    setSaving(true)
    try {
      const token = authService.getToken()
      const updatedPricing = {
        ...pricing,
        [field]: value,
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pricing: updatedPricing }),
      })

      if (!res.ok) throw new Error("Failed to save")

      const result = await res.json()
      onOrderUpdate?.(result.data)
      toast({ title: "Price updated", description: `${fieldLabel(field)} saved successfully.` })
    } catch {
      toast({ title: "Save failed", description: "Could not update the price.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleReceiptUpload = async (file: File) => {
    if (!order?.id) return
    setUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append("receipt", file)
      formData.append("orderId", order.id)

      const uploadRes = await fetch("/api/payment-receipt/upload", {
        method: "POST",
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) throw new Error(uploadData.error || "Upload failed")

      const newReceiptUrl = uploadData.data.url
      const token = authService.getToken()
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentInfo: {
            ...(order?.paymentInfo || {}),
            receiptUrl: newReceiptUrl,
          },
          receiptUrl: newReceiptUrl,
        }),
      })

      if (!res.ok) throw new Error("Failed to save receipt URL")
      const result = await res.json()
      onOrderUpdate?.(result.data)
      toast({ title: "Receipt updated", description: "Payment receipt has been replaced." })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload receipt.", variant: "destructive" })
    } finally {
      setUploadingReceipt(false)
      if (receiptInputRef.current) receiptInputRef.current.value = ""
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-gray-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Order & Pricing Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click Edit on any price to update it</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Editable pricing grid — 3 cells only: Package Price, State Fee, Add-ons Total */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 rounded-xl overflow-hidden">
          <EditablePrice
            label="Package Price"
            value={packagePrice}
            saving={saving}
            onSave={(v) => savePricingField("packagePrice", v)}
          />
          <EditablePrice
            label="State Filing Fee"
            value={stateFee}
            saving={saving}
            onSave={(v) => savePricingField("stateFilingFee", v)}
          />
          <EditablePrice
            label="Add-ons Total"
            value={addonsTotal}
            saving={saving}
            onSave={(v) => savePricingField("addonsTotal", v)}
          />
        </div>

        {/* Payment details */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {whatsappPhone && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Phone className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-xs text-gray-400 w-36 shrink-0">WhatsApp Phone</span>
              <a
                href={`https://wa.me/${whatsappPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline font-mono font-medium"
              >
                {whatsappPhone}
              </a>
            </div>
          )}

          {/* Receipt row — view + edit/replace */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Receipt className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="text-xs text-gray-400 w-36 shrink-0">Payment Receipt</span>
            <div className="flex items-center gap-2 flex-wrap">
              {receiptUrl ? (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View File
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">No receipt uploaded</span>
              )}
              <button
                onClick={() => receiptInputRef.current?.click()}
                disabled={uploadingReceipt}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {uploadingReceipt ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {receiptUrl ? "Replace" : "Upload"}
              </button>
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleReceiptUpload(file)
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <Calendar className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="text-xs text-gray-400 w-36 shrink-0">Order Date</span>
            <span className="text-sm text-gray-900 font-medium">
              {order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function fieldLabel(field: string) {
  const map: Record<string, string> = {
    packagePrice: "Package Price",
    stateFilingFee: "State Filing Fee",
    addonsTotal: "Add-ons Total",
  }
  return map[field] || field
}
