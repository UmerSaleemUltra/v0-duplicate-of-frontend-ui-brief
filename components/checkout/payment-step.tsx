"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Upload } from "lucide-react"
import { packagePricing } from "@/lib/pricing"
import { STATE_FEES } from "@/lib/constants"

interface PaymentStepProps {
  data: any
  onBack: () => void
  onSubmit: (orderData: any) => Promise<void>
}

function calculateRenewalDate(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString()
}

export default function PaymentStep({ data, onBack, onSubmit }: PaymentStepProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "already_paid">("already_paid")
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string>("")
  const [pkrRate, setPkrRate] = useState<number | null>(null)
  const [isLoadingRate, setIsLoadingRate] = useState(true)
  const [showValidationError, setShowValidationError] = useState(false)

  useEffect(() => {
    async function convertUSDtoPKR() {
      try {
        const response = await fetch("/api/exchange-rate")
        const data = await response.json()

        if (data.success && data.rate) {
          return data.rate
        } else {
          throw new Error("Currency conversion failed")
        }
      } catch (error) {
        console.log("Error converting USD to PKR:", error)
        return null
      }
    }

    convertUSDtoPKR()
      .then((rate) => {
        if (rate) {
          setPkrRate(rate)
        }
        setIsLoadingRate(false)
      })
      .catch(() => {
        setIsLoadingRate(false)
      })
  }, [])

  const getAddonName = (addon: any) => {
    if (!addon) return "Unknown Add-on"

    // For ITIN applications with member info
    if (addon.serviceId === "itin" && addon.memberName) {
      return `ITIN Application - ${addon.memberName}`
    }

    // Use addon name if available, otherwise fallback to service name
    return addon.name || addon.serviceName || "Add-on"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] handleSubmit called")

    if (paymentMethod === "already_paid") {
      if (!whatsappPhone.trim()) {
        setShowValidationError(true)
        return
      }
    } else {
      if (!receiptUrl) {
        setShowValidationError(true)
        return
      }
    }

    setShowValidationError(false)

    console.log("[v0] Starting payment submission...")
    console.log("[v0] whatsappPhone:", whatsappPhone)
    console.log("[v0] receiptUrl:", receiptUrl)

    // Get company data from session storage
    const companyDataStr = localStorage.getItem("companyData")
    console.log("[v0] companyDataStr:", companyDataStr)

    if (!companyDataStr) {
      console.error("[v0] No company data found in session storage")
      alert("Company data not found. Please complete the previous steps.")
      return
    }

    const companyData = JSON.parse(companyDataStr)
    console.log("[v0] companyData:", companyData)

    if (!companyData.data?.id) {
      console.error("[v0] No company ID found in company data")
      alert("Company ID not found. Please complete the previous steps.")
      return
    }

    const packagePrice = packagePricing[data.packageType as keyof typeof packagePricing] || 149
    const stateFilingFee = STATE_FEES[data.state as keyof typeof STATE_FEES] || 0
    const packageWithStateFee = packagePrice + stateFilingFee
    const addonsTotal = data.addonsTotal || 0
    const totalAmount = packageWithStateFee + addonsTotal

    console.log("[v0] Payment step - state:", data.state)
    console.log("[v0] Payment step - packagePrice:", packagePrice)
    console.log("[v0] Payment step - stateFilingFee:", stateFilingFee)
    console.log("[v0] Payment step - packageWithStateFee:", packageWithStateFee)
    console.log("[v0] Payment step - totalAmount:", totalAmount)
    console.log("[v0] Payment step - addons data:", data.addons)
    console.log("[v0] Payment step - addonsTotal:", addonsTotal)

    setIsSubmitting(true)

    const orderData = {
      companyId: companyData.data.id,
      companyName: data.businessName,
      type: `${data.entityType.toUpperCase()} Formation`,
      amount: totalAmount,
      total: totalAmount,
      packagePrice: packagePrice,
      addonsTotal: addonsTotal,
      items: [
        {
          name: `${data.state} ${data.packageType === "starter" ? "Starter" : "Advanced"} Package`,
          price: packageWithStateFee,
          quantity: 1,
        },
      ],
      purchasedAddons: data.addons || [],
      paymentMethod: paymentMethod,
      whatsappPhone: whatsappPhone || null,
      receiptUrl: receiptUrl || null,
    }

    console.log("[v0] Order data:", orderData)

    try {
      await onSubmit(orderData)

      console.log("[v0] Checkout completed successfully, redirecting to dashboard...")

      setTimeout(() => {
        router.push("/client/dashboard")
      }, 1000)
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      alert("Failed to process checkout. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappPhone(e.target.value)
    setShowValidationError(false)
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only image files (JPEG, PNG, WEBP) are allowed")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB")
      return
    }

    setReceiptFile(file)
    setUploadError("")

    setIsUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append("receipt", file)
      formData.append("orderId", "temp-" + Date.now())

      const response = await fetch("/api/payment-receipt/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setReceiptUrl(result.data.url)
        alert("Receipt uploaded successfully!")
      } else {
        setUploadError(result.error || "Failed to upload receipt")
      }
    } catch (error) {
      console.error("Receipt upload error:", error)
      setUploadError("Failed to upload receipt. Please try again.")
    } finally {
      setIsUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptUrl(null)
    setUploadError("")
  }

  const packagePrice = packagePricing[data.packageType as keyof typeof packagePricing] || 149
  const stateFilingFee = STATE_FEES[data.state as keyof typeof STATE_FEES] || 0
  const packageWithStateFee = packagePrice + stateFilingFee
  const addonsTotal = data.addonsTotal || 0
  const totalAmount = packageWithStateFee + addonsTotal

  console.log("[v0] Payment step - addons data:", data.addons)
  console.log("[v0] Payment step - addonsTotal:", addonsTotal)

  const isPaymentValid = paymentMethod === "already_paid" ? whatsappPhone.trim() !== "" : receiptUrl !== ""

  const getValidationMessage = () => {
    if (paymentMethod === "already_paid") {
      if (!whatsappPhone.trim()) {
        return "Please provide your phone number to proceed"
      }
    } else {
      if (!receiptUrl) {
        return "Please upload a payment receipt to proceed"
      }
    }
    return ""
  }

  const totalAmountPKR = pkrRate ? totalAmount * pkrRate : null
  const packageWithStateFeePKR = pkrRate ? packageWithStateFee * pkrRate : null

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Secure Payment</h1>
        <p className="text-slate-700">Complete your payment via WhatsApp to finalize your business formation order.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("already_paid")}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              paymentMethod === "already_paid"
                ? "border-[#ff0d13] bg-red-50/50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {paymentMethod === "already_paid" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Already Paid</h4>
                <p className="text-sm text-slate-600">Payment made via WhatsApp or representative</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              paymentMethod === "bank_transfer"
                ? "border-[#ff0d13] bg-red-50/50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {paymentMethod === "bank_transfer" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Make Payment</h4>
                <p className="text-sm text-slate-600">View bank details, make payment, and upload receipt</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">
              {data.state} {data.packageType === "starter" ? "Starter" : "Advanced"} Package
            </span>
            <div className="text-right">
              <span className="text-sm font-medium text-slate-900">${packageWithStateFee.toFixed(2)}</span>
              {packageWithStateFeePKR && (
                <p className="text-xs text-slate-500 mt-0.5">{formatPKR(packageWithStateFeePKR)} PKR</p>
              )}
            </div>
          </div>

          {data.addons && data.addons.length > 0 ? (
            data.addons.map((addon, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{getAddonName(addon)}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-900">${addon.price || 0}</span>
                  {pkrRate && addon.price && (
                    <p className="text-xs text-slate-500 mt-0.5">{formatPKR(addon.price * pkrRate)} PKR</p>
                  )}
                </div>
              </div>
            ))
          ) : addonsTotal > 0 ? (
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Add-ons</span>
              <div className="text-right">
                <span className="text-sm font-medium text-slate-900">${addonsTotal.toFixed(2)}</span>
                {pkrRate && (
                  <p className="text-lg font-semibold text-slate-600 mt-1">{formatPKR(addonsTotal * pkrRate)} PKR</p>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-3 border-t-2 border-slate-300">
            <div>
              <p className="text-lg font-semibold text-slate-900">Total Amount</p>
              <p className="text-xs text-slate-600 mt-0.5">One-time payment</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
              {isLoadingRate ? (
                <p className="text-sm text-slate-500 mt-1">Loading PKR rate...</p>
              ) : totalAmountPKR ? (
                <p className="text-lg font-semibold text-slate-600 mt-1">{formatPKR(totalAmountPKR)} PKR</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">PKR conversion unavailable</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {paymentMethod === "bank_transfer" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-1 text-slate-900">Payment Bank Account Details</h4>
              <p className="text-sm text-slate-700">For the payment, please find the details below:</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Bank Name</span>
              <span className="text-sm font-medium text-slate-900">United Bank Limited (UBL)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Account Title</span>
              <span className="text-sm font-medium text-slate-900">BUZZ FILING</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Account Number</span>
              <span className="text-sm font-medium text-slate-900">1176314943776</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">IBAN</span>
              <span className="text-sm font-medium text-slate-900 break-all">PK22UNIL0109000314943776</span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <Upload className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-red-900">
                <span className="font-semibold">Important:</span> After making the payment, kindly send a screenshot
                with details of your payment. Thank you.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="receipt-upload" className="text-sm font-semibold text-slate-900">
              Upload Payment Receipt
            </Label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReceiptUpload}
                  disabled={isUploadingReceipt || !!receiptFile}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-upload"
                  className={`flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                    isUploadingReceipt || receiptFile
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:from-[#6b0000] hover:to-[#d81c20]"
                  }`}
                >
                  {isUploadingReceipt ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      Uploading...
                    </>
                  ) : receiptFile ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      File Selected
                    </>
                  ) : (
                    "Choose file"
                  )}
                </label>
              </div>

              {uploadError && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploadError}
                </p>
              )}

              {receiptFile && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">{receiptFile.name}</span>
                    <span className="text-xs text-slate-600">({(receiptFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceipt}
                    className="h-8 w-8 p-0 hover:bg-red-100"
                  >
                    <Upload className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-600">Click to upload or drag and drop PNG, JPG or WEBP (max. 5MB)</p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "already_paid" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone" className="text-sm font-semibold text-slate-900">
              WhatsApp Phone Number
            </Label>
            <Input
              id="whatsapp-phone"
              type="tel"
              placeholder="Enter your WhatsApp phone number"
              value={whatsappPhone}
              onChange={handlePhoneChange}
              className="h-11"
            />
            <p className="text-xs text-slate-600">
              We&apos;ll contact you via WhatsApp at this number to confirm your payment
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="h-11 gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!isPaymentValid || isSubmitting}
          className="flex-1 h-11 gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:from-[#6b0000] hover:to-[#d81c20] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              Processing...
            </>
          ) : (
            <>
              Complete Payment
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {showValidationError && getValidationMessage() && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-900">{getValidationMessage()}</p>
        </div>
      )}
    </form>
  )
}

export { PaymentStep }
