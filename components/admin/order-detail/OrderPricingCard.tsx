"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Calendar } from "lucide-react"

interface OrderPricingCardProps {
  order: any
}

export function OrderPricingCard({ order }: OrderPricingCardProps) {
  const packagePrice = order?.pricing?.packagePrice || order?.packagePrice || 0
  const stateFee = order?.pricing?.stateFilingFee || order?.stateFilingFee || 0
  const addonsTotal = order?.pricing?.addonsTotal || order?.addonsTotal || 0
  const total = order?.pricing?.total || order?.pricing?.totalAmount || order?.amount || 0

  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-slate-600" />
          Order & Pricing Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Package Price</p>
            <p className="text-xl font-bold text-slate-900">${packagePrice.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">State Filing Fee</p>
            <p className="text-xl font-bold text-slate-900">${stateFee.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Add-ons Total</p>
            <p className="text-xl font-bold text-slate-900">${addonsTotal.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-md">
            <p className="text-xs text-white/80 mb-1 font-medium uppercase tracking-wide">Total Amount</p>
            <p className="text-2xl font-bold text-white">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Payment Method</p>
              <p className="text-sm font-medium text-slate-900 capitalize">
                {order?.paymentInfo?.method || order?.paymentMethod || "Not specified"}
              </p>
              {(order?.paymentInfo?.method?.toLowerCase() === "whatsapp" ||
                order?.paymentInfo?.method?.toLowerCase() === "whatsapp phone") &&
                order?.paymentInfo?.phone && (
                  <p className="text-xs text-slate-500 mt-1">
                    Phone:{" "}
                    <span className="font-mono text-slate-800">{order.paymentInfo.phone}</span>
                  </p>
                )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Payment Status</p>
              <Badge variant={order?.paymentInfo?.status === "paid" ? "default" : "secondary"} className="capitalize">
                {order?.paymentInfo?.status || "Pending"}
              </Badge>
            </div>
            {order?.paymentInfo?.receiptUrl && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Payment Receipt</p>
                <a
                  href={order.paymentInfo.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Receipt className="w-4 h-4" />
                  View Receipt
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Order Date */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Order Date</p>
            <p className="text-sm font-medium text-slate-900">
              {order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
