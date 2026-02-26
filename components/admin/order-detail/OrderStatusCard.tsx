"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"

interface OrderStatusCardProps {
  order: any
  newStatus: string
  statusUpdating: boolean
  onStatusChange: (value: string) => void
  onStatusUpdate: () => void
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "processing": return "bg-blue-50 text-blue-700 border-blue-200"
    case "pending":    return "bg-amber-50 text-amber-700 border-amber-200"
    default:           return "bg-slate-50 text-slate-700 border-slate-200"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="w-4 h-4" />
    case "processing": return <Clock className="w-4 h-4" />
    case "pending":   return <AlertCircle className="w-4 h-4" />
    default: return null
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
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-600" />
          Order Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-slate-500 font-medium uppercase tracking-wide">Current Status</Label>
          <div className="mt-2">
            <Badge
              className={`${getStatusColor(order.status)} px-3 py-1 text-sm flex items-center gap-2 w-fit border`}
            >
              {getStatusIcon(order.status)}
              <span className="capitalize">{order.status}</span>
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={newStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={onStatusUpdate}
            disabled={statusUpdating || !newStatus || newStatus === order.status}
            className="bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
          >
            {statusUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
