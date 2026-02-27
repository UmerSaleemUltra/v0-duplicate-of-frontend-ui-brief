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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
          <div className="bg-white p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Package Price</p>
            <p className="text-2xl font-semibold text-gray-900">${packagePrice.toFixed(2)}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">State Filing Fee</p>
            <p className="text-2xl font-semibold text-gray-900">${stateFee.toFixed(2)}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Add-ons Total</p>
            <p className="text-2xl font-semibold text-gray-900">${addonsTotal.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Amount</p>
            <p className="text-2xl font-semibold text-white">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="grid sm:grid-cols-2 gap-6 pt-2">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Payment Method</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {order?.paymentInfo?.method || order?.paymentMethod || "Not specified"}
            </p>
            {(order?.paymentInfo?.method?.toLowerCase() === "whatsapp" ||
              order?.paymentInfo?.method?.toLowerCase() === "whatsapp phone") &&
              order?.paymentInfo?.phone && (
                <p className="text-xs text-gray-400 mt-1">
                  Phone:{" "}
                  <span className="font-mono text-gray-700">{order.paymentInfo.phone}</span>
                </p>
              )}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Payment Status</p>
            <Badge variant={order?.paymentInfo?.status === "paid" ? "default" : "secondary"} className="capitalize">
              {order?.paymentInfo?.status || "Pending"}
            </Badge>
          </div>
          {order?.paymentInfo?.receiptUrl && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Payment Receipt</p>
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

        {/* Order Date */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <Calendar className="w-4 h-4 text-gray-300 shrink-0" />
          <div>
            <span className="text-xs text-gray-400">Order Date: </span>
            <span className="text-sm font-medium text-gray-700">
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
      </CardContent>
    </Card>
  )
}
