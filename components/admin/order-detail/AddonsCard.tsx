"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Phone, ExternalLink, Receipt } from "lucide-react"

interface AddonsCardProps {
  order: any
}

export function AddonsCard({ order }: AddonsCardProps) {
  // Support both purchasedAddons and addons fields
  const addons: any[] = order?.purchasedAddons || order?.addons || order?.selectedAddons || []
  const addonsTotal = order?.pricing?.addonsTotal || order?.addonsTotal || 0

  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-600" />
          Add-ons
        </CardTitle>
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

              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Addon name + price */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      {addon.name || addon.title || addon}
                    </p>
                    {addon.price != null && (
                      <p className="text-sm font-bold text-slate-800">${Number(addon.price).toFixed(2)}</p>
                    )}
                  </div>

                  {/* Payment details rows */}
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

                  {receiptUrl ? (
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-400 w-32 shrink-0">Receipt</span>
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View File
                      </a>
                    </div>
                  ) : (
                    !phone && !method ? null : (
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <Receipt className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span className="text-xs text-slate-400 w-32 shrink-0">Receipt</span>
                        <span className="text-xs text-slate-400 italic">No receipt uploaded</span>
                      </div>
                    )
                  )}
                </div>
              )
            })}

            {addonsTotal > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 px-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Add-ons Total</p>
                <p className="text-base font-bold text-slate-900">${addonsTotal.toFixed(2)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center">
            <p className="text-sm text-slate-500">No add-ons selected for this order</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
