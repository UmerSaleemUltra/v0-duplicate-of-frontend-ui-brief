"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Package, CreditCard, MessageCircle, Building2 } from "lucide-react"
import { getCheckoutData } from "@/lib/checkout-storage"
import { currentUserStorage } from "@/lib/local-storage"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const data = getCheckoutData()
    const currentUser = currentUserStorage.get()

    if (!data || !currentUser) {
      router.push("/checkout")
      return
    }

    setCheckoutData(data)
    setUser(currentUser)

    const isWhatsAppPayment = data.payment?.method === "whatsapp"

    toast({
      title: "Order Received!",
      description: "We've received your order. Redirecting to dashboard...",
      duration: 3000,
    })

    setTimeout(() => {
      router.push("/client/dashboard")
    }, 2000)
  }, [router, toast])

  if (!checkoutData || !user) {
    return null
  }

  const packagePrice = checkoutData.state?.packageType === "advanced" ? 399 : 199
  const isWhatsAppPayment = checkoutData.payment?.method === "whatsapp"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <Image
            src="/images/buzz-filing-logo.png"
            alt="BuzzFiling"
            width={200}
            height={125}
            className="w-[180px] sm:w-[200px] md:w-[220px] h-auto mx-auto mb-6"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Received!</h1>
            <p className="text-white/90 text-lg">We've received your order and payment details</p>
          </div>

          {/* Order Receipt */}
          <div className="p-8 space-y-6">
            {/* Order Details */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-[#ff0d13]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-red-200">
                      <span className="text-red-700">Order ID:</span>
                      <span className="font-medium text-red-900">{checkoutData.orderId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-red-200">
                      <span className="text-red-700">Business Name:</span>
                      <span className="font-medium text-red-900">{checkoutData.businessInfo?.businessName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-red-200">
                      <span className="text-red-700">Entity Type:</span>
                      <span className="font-medium text-red-900">{checkoutData.state?.entityType?.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-red-200">
                      <span className="text-red-700">Package:</span>
                      <span className="font-medium text-red-900 capitalize">{checkoutData.state?.packageType}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-red-200">
                      <span className="text-red-700">State:</span>
                      <span className="font-medium text-red-900">{checkoutData.state?.state}</span>
                    </div>
                    {checkoutData.businessInfo?.mailingAddress && (
                      <div className="flex justify-between py-2 border-b border-red-200">
                        <span className="text-red-700">Mailing Address:</span>
                        <span className="font-medium text-red-900 text-right">
                          {checkoutData.businessInfo.mailingAddress.street},{" "}
                          {checkoutData.businessInfo.mailingAddress.city},{" "}
                          {checkoutData.businessInfo.mailingAddress.state}{" "}
                          {checkoutData.businessInfo.mailingAddress.zip}
                        </span>
                      </div>
                    )}
                    {/* End of mailing address display */}
                    <div className="flex justify-between py-2">
                      <span className="text-red-700 font-semibold">Total Amount:</span>
                      <span className="font-bold text-red-900 text-lg">${packagePrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  {isWhatsAppPayment ? (
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-4">Payment Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700">Payment Method:</span>
                      <span className="font-medium text-green-900 capitalize">{checkoutData.payment?.method}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700">Transaction ID:</span>
                      <span className="font-medium text-green-900">{checkoutData.payment?.transactionId}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-green-700">Status:</span>
                      <span className="font-medium text-green-900">
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Pending Verification
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[#ff0d13]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-3">What Happens Next?</h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#ff0d13]" />
                      <span>We'll verify your payment within 1-2 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#ff0d13]" />
                      <span>You'll receive confirmation via WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#ff0d13]" />
                      <span>Once confirmed, we'll begin processing your formation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#ff0d13]" />
                      <span>Access your dashboard to track progress</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {/* Removed action buttons as they are no longer needed with immediate redirect */}

            {/* Auto-redirect notice */}
            {/* Removed auto-redirect notice as immediate redirect is handled */}
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Order Date: {new Date(checkoutData.createdAt).toLocaleDateString()} at{" "}
          {new Date(checkoutData.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
