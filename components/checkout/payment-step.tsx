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
      const phoneDigits = whatsappPhone.replace(/\D/g, "")
      if (phoneDigits.length < 10) {
        alert("Please enter a valid phone number with at least 10 digits")
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

    const companyDataStr = localStorage.getItem("companyData")
    console.log("[v0] companyDataStr:", companyDataStr)

    if (!companyDataStr) {
      console.error("[v0] No company data found in localStorage")
      alert("Company data not found. Please go back and complete the review step.")
      return
    }

    const companyData = JSON.parse(companyDataStr)
    console.log("[v0] companyData:", companyData)

    if (!companyData.data?.id) {
      console.error("[v0] No company ID found in company data")
      alert("Company ID not found. Please go back and complete the review step.")
      return
    }

    const packagePrice = packagePricing[data.packageType as keyof typeof packagePricing] || 149
    const stateFilingFee = STATE_FEES[data.state as keyof typeof STATE_FEES] || 0
    const packageWithStateFee = packagePrice + stateFilingFee

    const addonsTotal =
      data.addonsTotal ||
      (Array.isArray(data.addons) ? data.addons.reduce((sum, addon) => sum + (addon.price || 0), 0) : 0)
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
      whatsappPhone: whatsappPhone ? (whatsappPhone.startsWith("+") ? whatsappPhone : `+${whatsappPhone}`) : null,
      receiptUrl: receiptUrl || null,
    }

    console.log("[v0] Order data:", orderData)

    try {
      await onSubmit(orderData)
      // Success - user will be redirected by handlePaymentSubmit in checkout page
    } catch (error) {
      console.error("[v0] Payment submission error:", error)
      alert(error instanceof Error ? error.message : "Failed to process payment. Please try again.")
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
  const addonsTotal =
    data.addonsTotal ||
    (Array.isArray(data.addons) ? data.addons.reduce((sum, addon) => sum + (addon.price || 0), 0) : 0)
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
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-8 pb-10">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Secure Payment</h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Complete your payment via WhatsApp to finalize your business formation order.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-slate-900">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={() => setPaymentMethod("already_paid")}
            className={`group relative p-7 rounded-2xl border-2 transition-all duration-200 text-left ${
              paymentMethod === "already_paid"
                ? "border-[#ff0d13] bg-gradient-to-br from-red-50 to-red-100/50 shadow-lg shadow-red-500/10"
                : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md"
            }`}
          >
            {paymentMethod === "already_paid" && (
              <div className="absolute top-5 right-5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0 shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-1.5 text-lg">Already Paid</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Payment made via WhatsApp or representative</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`group relative p-7 rounded-2xl border-2 transition-all duration-200 text-left ${
              paymentMethod === "bank_transfer"
                ? "border-[#ff0d13] bg-gradient-to-br from-red-50 to-red-100/50 shadow-lg shadow-red-500/10"
                : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md"
            }`}
          >
            {paymentMethod === "bank_transfer" && (
              <div className="absolute top-5 right-5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-1.5 text-lg">Make Payment</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  View bank details, make payment, and upload receipt
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-slate-900">Payment Summary</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <span className="text-base text-slate-700 font-medium">
              {data.state} {data.packageType === "starter" ? "Starter" : "Advanced"} Package
            </span>
            <div className="text-right">
              <span className="text-base font-bold text-slate-900">${packageWithStateFee.toFixed(2)}</span>
              {packageWithStateFeePKR && (
                <p className="text-sm text-slate-500 mt-1">PKR {formatPKR(packageWithStateFeePKR)}</p>
              )}
            </div>
          </div>

          {data.addons && data.addons.length > 0 ? (
            data.addons.map((addon, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-base text-slate-700 font-medium">{getAddonName(addon)}</span>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900">${addon.price || 0}</span>
                  {pkrRate && addon.price && (
                    <p className="text-sm text-slate-500 mt-1">PKR {formatPKR(addon.price * pkrRate)}</p>
                  )}
                </div>
              </div>
            ))
          ) : addonsTotal > 0 ? (
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-base text-slate-700 font-medium">Add-ons</span>
              <div className="text-right">
                <span className="text-base font-bold text-slate-900">${addonsTotal.toFixed(2)}</span>
                {pkrRate && <p className="text-sm text-slate-500 mt-1">PKR {formatPKR(addonsTotal * pkrRate)}</p>}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-6 mt-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 -mx-8 -mb-8">
            <div>
              <p className="text-xl font-bold text-white">Total Amount</p>
              <p className="text-sm text-slate-300 mt-1">One-time payment</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-white">${totalAmount.toFixed(2)}</span>
              {isLoadingRate ? (
                <p className="text-sm text-slate-300 mt-2">Loading PKR rate...</p>
              ) : totalAmountPKR ? (
                <p className="text-xl font-semibold text-red-400 mt-2">PKR {formatPKR(totalAmountPKR)}</p>
              ) : (
                <p className="text-sm text-slate-300 mt-2">PKR conversion unavailable</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {paymentMethod === "bank_transfer" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0 shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold mb-2 text-slate-900">Bank Account Details</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Please use these details to complete your payment
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-600">Bank Name</span>
              <span className="text-base font-bold text-slate-900">United Bank Limited (UBL)</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-600">Account Title</span>
              <span className="text-base font-bold text-slate-900">BUZZ FILING</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-600">Account Number</span>
              <span className="text-base font-bold text-slate-900">1176314943776</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-slate-600">IBAN</span>
              <span className="text-base font-bold text-slate-900">PK22UNIL0109000314943776</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm flex-1">
              <p className="text-red-900 font-medium leading-relaxed">
                <span className="font-bold">Important:</span> After making the payment, please upload a screenshot with
                transaction details. This helps us process your order faster.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="receipt-upload" className="text-base font-bold text-slate-900">
              Upload Payment Receipt
            </Label>
            <div className="space-y-4">
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
                  className={`flex items-center justify-center gap-3 h-14 px-8 rounded-xl font-bold text-base transition-all cursor-pointer shadow-md ${
                    isUploadingReceipt || receiptFile
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:from-[#6b0000] hover:to-[#d81c20] hover:shadow-lg"
                  }`}
                >
                  {isUploadingReceipt ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                      Uploading...
                    </>
                  ) : receiptFile ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Receipt Uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose Receipt File
                    </>
                  )}
                </label>
              </div>

              {uploadError && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
                  <Upload className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900 font-medium">{uploadError}</p>
                </div>
              )}

              {receiptFile && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-green-900 block">{receiptFile.name}</span>
                      <span className="text-xs text-slate-600">({(receiptFile.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceipt}
                    className="h-10 w-10 p-0 hover:bg-red-100 rounded-full"
                  >
                    <Upload className="w-5 h-5 text-red-600" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-slate-500">Supported formats: PNG, JPG, WEBP (max. 5MB)</p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "already_paid" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="space-y-3">
            <Label htmlFor="whatsapp-phone" className="text-base font-bold text-slate-900">
              WhatsApp Phone Number
            </Label>
            <Input
              id="whatsapp-phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={whatsappPhone}
              onChange={handlePhoneChange}
              className="h-14 text-base border-slate-300 focus:border-[#ff0d13] focus:ring-[#ff0d13]"
            />
            <p className="text-sm text-slate-600 leading-relaxed">
              We'll contact you via WhatsApp to confirm your payment and provide order updates
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-14 gap-3 border-2 border-slate-300 hover:bg-slate-50 font-bold text-base bg-transparent"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!isPaymentValid || isSubmitting}
          className="flex-1 h-14 gap-3 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:from-[#6b0000] hover:to-[#d81c20] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-bold text-base transition-all"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
              Processing Payment...
            </>
          ) : (
            <>
              Complete Payment
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>

      {showValidationError && getValidationMessage() && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 shadow-md">
          <p className="text-base text-red-900 font-semibold">{getValidationMessage()}</p>
        </div>
      )}
    </form>
  )
}

export { PaymentStep }
