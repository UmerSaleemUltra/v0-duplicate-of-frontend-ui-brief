"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Phone, ExternalLink, Receipt, Pencil, Check, X, Trash2, Upload, Loader2 } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
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

interface AddonsCardProps {
  order: any
  onOrderUpdate?: (updatedOrder: any) => void
}

export function AddonsCard({ order, onOrderUpdate }: AddonsCardProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draftPrice, setDraftPrice] = useState("")
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [uploadingReceiptIndex, setUploadingReceiptIndex] = useState<number | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const pendingUploadIndexRef = useRef<number | null>(null)

  // Read addons from the canonical location
  const addons: any[] = order?.purchasedAddons || order?.addons || order?.selectedAddons || []

  // ── Persist helper ────────────────────────────────────────────────────────

  const persistAddons = async (updated: any[]) => {
    if (!order?.id) return null
    const token = authService.getToken()
    const newTotal = updated.reduce((s: number, a: any) => s + (Number(a.price) || 0), 0)
    const updatedPricing = {
      ...(order?.pricing || {}),
      addonsTotal: newTotal,
    }

    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purchasedAddons: updated, pricing: updatedPricing }),
    })

    if (!res.ok) throw new Error("Failed to save")
    const result = await res.json()
    // Notify parent with updated data — merge carefully so purchasedAddons is replaced
    onOrderUpdate?.({
      ...result.data,
      purchasedAddons: updated,
      pricing: updatedPricing,
    })
    return result.data
  }

  // ── Edit price ────────────────────────────────────────────────────────────

  const startEdit = (index: number, currentPrice: number) => {
    setEditingIndex(index)
    setDraftPrice(String(currentPrice ?? "0"))
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setDraftPrice("")
  }

  const confirmEdit = async (index: number) => {
    const num = parseFloat(draftPrice)
    if (isNaN(num) || num < 0) return
    setSaving(true)
    try {
      const updated = addons.map((a, i) => (i === index ? { ...a, price: num } : a))
      await persistAddons(updated)
      toast({ title: "Price updated", description: `${addons[index]?.name || "Add-on"} price saved.` })
    } catch {
      toast({ title: "Save failed", description: "Could not update the price.", variant: "destructive" })
    } finally {
      setSaving(false)
      setEditingIndex(null)
    }
  }

  // ── Delete single ─────────────────────────────────────────────────────────

  const confirmDeleteSingle = async () => {
    if (deleteIndex === null) return
    setSaving(true)
    try {
      const addonName = addons[deleteIndex]?.name || "Add-on"
      const updated = addons.filter((_, i) => i !== deleteIndex)
      await persistAddons(updated)
      toast({ title: "Add-on removed", description: `${addonName} has been deleted.` })
    } catch {
      toast({ title: "Delete failed", description: "Could not delete the add-on.", variant: "destructive" })
    } finally {
      setSaving(false)
      setDeleteIndex(null)
    }
  }

  // ── Delete all ────────────────────────────────────────────────────────────

  const confirmDeleteAll = async () => {
    setSaving(true)
    try {
      await persistAddons([])
      toast({ title: "All add-ons removed", description: "All add-ons have been deleted." })
    } catch {
      toast({ title: "Delete failed", description: "Could not delete all add-ons.", variant: "destructive" })
    } finally {
      setSaving(false)
      setDeleteAllOpen(false)
    }
  }

  // ── Upload addon receipt ──────────────────────────────────────────────────

  const triggerReceiptUpload = (index: number) => {
    pendingUploadIndexRef.current = index
    receiptInputRef.current?.click()
  }

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const index = pendingUploadIndexRef.current
    if (!file || index === null || !order?.id) return

    setUploadingReceiptIndex(index)
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
      const updated = addons.map((a, i) =>
        i === index
          ? {
              ...a,
              paymentDetails: {
                ...(a.paymentDetails || {}),
                receiptUrl: newReceiptUrl,
              },
            }
          : a,
      )
      await persistAddons(updated)
      toast({ title: "Receipt updated", description: `${addons[index]?.name || "Add-on"} receipt replaced.` })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload receipt.", variant: "destructive" })
    } finally {
      setUploadingReceiptIndex(null)
      pendingUploadIndexRef.current = null
      if (receiptInputRef.current) receiptInputRef.current.value = ""
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              Add-ons
            </CardTitle>
            {addons.length > 0 && (
              <button
                onClick={() => setDeleteAllOpen(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 border border-red-600 transition-colors disabled:opacity-50 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Purchased services and add-ons</p>
        </CardHeader>

        <CardContent>
          {addons.length > 0 ? (
            <div className="space-y-3">
              {addons.map((addon: any, index: number) => {
                const payment = addon?.paymentDetails
                const phone = payment?.phoneNumber
                const receiptUrl = payment?.receiptUrl
                const method = payment?.paymentMethod
                const isEditing = editingIndex === index
                const isUploadingThisReceipt = uploadingReceiptIndex === index

                return (
                  <div key={index} className="rounded-xl border border-slate-200 overflow-hidden">
                    {/* Addon name + action row */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 flex-1 min-w-0 truncate pr-3">
                        {addon.name || addon.title || addon}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Editable price */}
                        {addon.price != null && (
                          isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-slate-800">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={draftPrice}
                                onChange={(e) => setDraftPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") confirmEdit(index)
                                  if (e.key === "Escape") cancelEdit()
                                }}
                                autoFocus
                                className="w-24 text-sm font-bold text-slate-800 bg-white border-b-2 border-blue-500 outline-none px-1"
                              />
                              <button
                                onClick={() => confirmEdit(index)}
                                disabled={saving}
                                className="p-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">
                                ${Number(addon.price).toFixed(2)}
                              </p>
                              <button
                                onClick={() => startEdit(index, addon.price)}
                                disabled={saving}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Edit price"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          )
                        )}

                        {/* Delete single addon */}
                        {!isEditing && (
                          <button
                            onClick={() => setDeleteIndex(index)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50"
                            title="Delete add-on"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Payment detail rows */}
                    {method && (
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
                        <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-400 w-32 shrink-0">Payment Method</span>
                        <span className="text-xs font-medium text-slate-700 capitalize">
                          {method === "whatsapp" ? "WhatsApp" : method.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}

                    {phone && (
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
                        <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="text-xs text-slate-400 w-32 shrink-0">WhatsApp Phone</span>
                        <a
                          href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono font-medium text-green-600 hover:underline"
                        >
                          {phone}
                        </a>
                      </div>
                    )}

                    {/* Receipt row — view + replace upload */}
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-400 w-32 shrink-0">Receipt</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {receiptUrl ? (
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View File
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No receipt</span>
                        )}
                        <button
                          onClick={() => triggerReceiptUpload(index)}
                          disabled={saving || isUploadingThisReceipt}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                          title={receiptUrl ? "Replace receipt" : "Upload receipt"}
                        >
                          {isUploadingThisReceipt ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          {receiptUrl ? "Replace" : "Upload"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Addons total */}
              {(() => {
                const total = order?.pricing?.addonsTotal ?? order?.addonsTotal ?? 0
                return total > 0 ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 px-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Add-ons Total</p>
                    <p className="text-base font-bold text-slate-900">${Number(total).toFixed(2)}</p>
                  </div>
                ) : null
              })()}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center">
              <p className="text-sm text-slate-500">No add-ons selected for this order</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for receipt uploads */}
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleReceiptFileChange}
      />

      {/* Confirm delete single */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Add-on</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteIndex !== null ? (addons[deleteIndex]?.name || "this add-on") : ""}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSingle}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete all */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Add-ons</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all{" "}
              <strong>{addons.length}</strong> add-on{addons.length !== 1 ? "s" : ""}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAll}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
