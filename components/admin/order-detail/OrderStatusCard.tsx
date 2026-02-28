"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Loader2 } from "lucide-react"

interface OrderStatusCardProps {
  order: any
  newStatus: string
  statusUpdating: boolean
  onStatusChange: (value: string) => void
  onStatusUpdate: () => void
}

function statusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-stone-100 text-stone-600 border-stone-200"
  }
}

export function OrderStatusCard({
  order,
  newStatus,
  statusUpdating,
  onStatusChange,
  onStatusUpdate,
}: OrderStatusCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-100">
        <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
          <Package className="w-3.5 h-3.5 text-stone-500" />
        </div>
        <span className="text-sm font-semibold text-stone-800 tracking-tight">Order Status</span>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Current status */}
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">Current</p>
          <Badge className={`capitalize px-3 py-1 text-xs font-medium border rounded-full ${statusStyle(order?.status)}`}>
            {order?.status || "pending"}
          </Badge>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-100" />

        {/* Change status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">Update</p>
          <div className="flex gap-2">
            <Select value={newStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 text-sm border-stone-200 rounded-lg flex-1 focus:ring-stone-300">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={onStatusUpdate}
              disabled={statusUpdating || !newStatus || newStatus === order?.status}
              className="h-8 text-xs px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shrink-0"
            >
              {statusUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
