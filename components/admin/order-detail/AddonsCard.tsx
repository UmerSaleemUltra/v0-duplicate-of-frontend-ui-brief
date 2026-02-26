"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

interface AddonsCardProps {
  order: any
}

export function AddonsCard({ order }: AddonsCardProps) {
  const addons: any[] = order?.addons || []
  const addonsTotal = order?.pricing?.addonsTotal || order?.addonsTotal || 0

  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-600" />
          Add-ons
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">Selected services and add-ons</p>
      </CardHeader>
      <CardContent>
        {addons.length > 0 ? (
          <div className="space-y-2">
            {addons.map((addon: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
              >
                <p className="text-sm font-medium text-slate-900">
                  {addon.name || addon.title || addon}
                </p>
                {addon.price && (
                  <p className="text-sm font-semibold text-slate-700">${addon.price.toFixed(2)}</p>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 px-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Add-ons Total</p>
              <p className="text-base font-bold text-slate-900">${addonsTotal.toFixed(2)}</p>
            </div>
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
