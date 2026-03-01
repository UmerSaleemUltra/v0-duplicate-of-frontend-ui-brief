"use client"

import { Receipt, Calendar, CheckCircle, Clock, Phone, ExternalLink } from "lucide-react"

interface OrderPricingCardProps {
  order: any
}

export function OrderPricingCard({ order }: OrderPricingCardProps) {
  const packagePrice = order?.pricing?.packagePrice || order?.packagePrice || 0
  const stateFee = order?.pricing?.stateFilingFee || order?.stateFilingFee || 0
  const addonsTotal = order?.pricing?.addonsTotal || order?.addonsTotal || 0
  const total = order?.pricing?.total || order?.pricing?.totalAmount || order?.amount || 0
  const isPaid = order?.paymentInfo?.status === "paid"

  const whatsappPhone = order?.whatsappPhone || order?.paymentInfo?.whatsappPhone
  const receiptUrl = order?.receiptUrl || order?.paymentInfo?.receiptUrl

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-gray-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Order & Pricing Details</h2>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Pricing breakdown — Apple-style grid */}
        <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-xl overflow-hidden">
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Package Price</p>
            <p className="text-xl font-semibold text-gray-900">${packagePrice.toFixed(2)}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-400 font-medium mb-1">State Filing Fee</p>
            <p className="text-xl font-semibold text-gray-900">${stateFee.toFixed(2)}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Add-ons Total</p>
            <p className="text-xl font-semibold text-gray-900">${addonsTotal.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Amount</p>
            <p className="text-xl font-semibold text-white">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment details — bordered rows */}
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
