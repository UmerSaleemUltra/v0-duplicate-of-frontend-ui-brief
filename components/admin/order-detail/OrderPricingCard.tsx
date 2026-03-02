"use client"

import { useState } from "react"
import { Receipt, Calendar, CheckCircle, Clock, Phone, ExternalLink, Pencil, Check, X } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface OrderPricingCardProps {
  order: any
  onOrderUpdate?: (updatedOrder: any) => void
}

interface EditableFieldProps {
  label: string
  value: number
  dark?: boolean
  onSave: (val: number) => void
  saving: boolean
}

function EditablePrice({ label, value, dark, onSave, saving }: EditableFieldProps) {
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
    <div className={`${dark ? "bg-gray-900" : "bg-white"} px-5 py-4 group relative`}>
      <p className={`text-xs font-medium mb-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-semibold ${dark ? "text-white" : "text-gray-900"}`}>$</span>
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
            className={`w-28 text-xl font-semibold bg-transparent border-b-2 border-blue-500 outline-none ${
              dark ? "text-white" : "text-gray-900"
            }`}
          />
          <button
            onClick={confirm}
            disabled={saving}
            className="p-1 rounded-md text-green-500 hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cancel}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className={`text-xl font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
            ${value.toFixed(2)}
          </p>
          <button
            onClick={startEdit}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${
              dark
                ? "text-gray-400 hover:bg-gray-700"
                : "text-gray-400 hover:bg-gray-100"
            }`}
            title="Edit price"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function OrderPricingCard({ order, onOrderUpdate }: OrderPricingCardProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const packagePrice = order?.pricing?.packagePrice ?? order?.packagePrice ?? 0
  const stateFee = order?.pricing?.stateFilingFee ?? order?.stateFilingFee ?? 0
  const addonsTotal = order?.pricing?.addonsTotal ?? order?.addonsTotal ?? 0
  const total = order?.pricing?.total ?? order?.pricing?.totalAmount ?? order?.amount ?? 0
  const isPaid = order?.paymentInfo?.status === "paid"

  const whatsappPhone = order?.whatsappPhone || order?.paymentInfo?.whatsappPhone
  const receiptUrl = order?.receiptUrl || order?.paymentInfo?.receiptUrl

  const savePricingField = async (field: "packagePrice" | "stateFilingFee" | "addonsTotal" | "total", value: number) => {
    if (!order?.id) return
    setSaving(true)
    try {
      const token = authService.getToken()
      const updatedPricing = {
        packagePrice: order?.pricing?.packagePrice ?? order?.packagePrice ?? 0,
        stateFilingFee: order?.pricing?.stateFilingFee ?? order?.stateFilingFee ?? 0,
        addonsTotal: order?.pricing?.addonsTotal ?? order?.addonsTotal ?? 0,
        total: order?.pricing?.total ?? order?.pricing?.totalAmount ?? order?.amount ?? 0,
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
      toast({ title: "Price updated", description: `${field.replace(/([A-Z])/g, " $1")} saved successfully.` })
    } catch {
      toast({ title: "Save failed", description: "Could not update the price.", variant: "destructive" })
    } finally {
      setSaving(false)
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
          <p className="text-xs text-gray-400 mt-0.5">Hover a price to edit it inline</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Editable pricing grid */}
        <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-xl overflow-hidden">
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
          <EditablePrice
            label="Total Amount"
            value={total}
            dark
            saving={saving}
            onSave={(v) => savePricingField("total", v)}
          />
        </div>

        {/* Payment details */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            {isPaid ? (
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="text-xs text-gray-400 w-36 shrink-0">Payment Status</span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                isPaid
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {order?.paymentInfo?.status || "Pending"}
            </span>
          </div>

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

          {receiptUrl && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Receipt className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="text-xs text-gray-400 w-36 shrink-0">Payment Receipt</span>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View File
              </a>
            </div>
          )}

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
