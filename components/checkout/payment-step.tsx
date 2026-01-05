"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Upload, Building2, MessageSquare } from "lucide-react"
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

function truncateFilename(filename: string, maxLength = 20): string {
  const words = filename.split(" ")
  let truncatedFilename = ""
  let currentLength = 0

  for (const word of words) {
    if (currentLength + word.length + 1 > maxLength) {
      break
    }
    truncatedFilename += word + " "
    currentLength += word.length + 1
  }

  return truncatedFilename.trim() + (truncatedFilename !== filename ? "..." : "")
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
  const [errors, setErrors] = useState({ whatsappNumber: "" })

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
        setErrors({ whatsappNumber: "Please provide your phone number to proceed" })
        setShowValidationError(true)
        return
      }
      const phoneDigits = whatsappPhone.replace(/\D/g, "")
      if (phoneDigits.length < 10) {
        setErrors({ whatsappNumber: "Please enter a valid phone number with at least 10 digits" })
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

    const companyDataStr = localStorage.getItem("companyData")
    console.log("[v0] companyDataStr:", companyDataStr)

    if (!companyDataStr) {
      console.error("[v0] No company data found in localStorage")
      return
    }

    const companyData = JSON.parse(companyDataStr)
    console.log("[v0] companyData:", companyData)

    if (!companyData.data?.id) {
      console.error("[v0] No company ID found in company data")
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
          name: `${data.state} ${data.packageType === "starter" ? "Starter" : "Advance"} Package`,
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappPhone(e.target.value)
    setErrors({ whatsappNumber: "" })
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

  const calculateTotal = () => {
    return totalAmount.toFixed(2)
  }

  const PKR_RATE = pkrRate || 1

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 pb-6 md:pb-10">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Secure Payment</h1>
        <p className="text-sm md:text-base text-slate-700 leading-relaxed">
          Complete your payment via WhatsApp to finalize your business formation order.
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        <h2 className="text-sm md:text-base font-semibold text-slate-900">Select Payment Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("already_paid")}
            className={`relative p-4 md:p-5 rounded-lg border-2 transition-all text-left cursor-pointer ${
              paymentMethod === "already_paid"
                ? "border-[#ff0d13] bg-red-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {paymentMethod === "already_paid" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Already Paid</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  Partial Payment Made or Will be made on WhatsApp
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`relative p-4 md:p-5 rounded-lg border-2 transition-all text-left cursor-pointer ${
              paymentMethod === "bank_transfer"
                ? "border-[#ff0d13] bg-red-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {paymentMethod === "bank_transfer" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Make Payment</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  View bank details, make payment, and upload receipt
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">Payment Summary</h3>
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-4 py-2 md:py-2.5 border-b border-slate-200">
            <span className="text-sm md:text-base text-slate-700 leading-relaxed">
              {data.state} {data.packageType === "starter" ? "Starter" : "Advance"} Package
            </span>
            <div className="text-right flex-shrink-0">
              <span className="font-semibold text-slate-900 text-sm md:text-base">
                ${packageWithStateFee.toFixed(2)}
              </span>
              {pkrRate && (
                <p className="text-xs md:text-sm text-slate-500">
                  {Math.round(packageWithStateFee * pkrRate).toLocaleString()} PKR
                </p>
              )}
            </div>
          </div>

          {data.addons && data.addons.length > 0 ? (
            data.addons.map((addon, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 py-2 md:py-2.5 border-b border-slate-200"
              >
                <span className="text-sm md:text-base text-slate-700 leading-relaxed break-words">
                  {getAddonName(addon)}
                </span>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-slate-900 text-sm md:text-base">${addon.price || 0}</span>
                  {pkrRate && addon.price && (
                    <p className="text-xs md:text-sm text-slate-500">
                      {Math.round(addon.price * pkrRate).toLocaleString()} PKR
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : addonsTotal > 0 ? (
            <div className="flex items-center justify-between gap-4 py-2 md:py-2.5 border-b border-slate-200">
              <span className="text-sm md:text-base text-slate-700">Add-ons</span>
              <div className="text-right flex-shrink-0">
                <span className="font-semibold text-slate-900 text-sm md:text-base">${addonsTotal.toFixed(2)}</span>
                {pkrRate && (
                  <p className="text-xs md:text-sm text-slate-500">
                    {Math.round(addonsTotal * pkrRate).toLocaleString()} PKR
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm md:text-base font-semibold text-slate-900">Total Amount</p>
                <p className="text-xs md:text-sm text-slate-600 mt-0.5">One-time payment</p>
              </div>
              <div className="text-right">
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">${calculateTotal()}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                  {Math.round(Number.parseFloat(calculateTotal()) * PKR_RATE).toLocaleString()} PKR
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {paymentMethod === "bank_transfer" && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 mb-1 text-sm md:text-base">Bank Account Details</h4>
              <p className="text-xs md:text-sm text-slate-600 break-words">
                Please use these details to complete your payment
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 md:p-5 border border-slate-200 space-y-3 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200">
              <span className="text-xs md:text-sm text-slate-600">Bank Name</span>
              <span className="font-semibold text-slate-900 text-sm md:text-base break-words">
                United Bank Limited (UBL)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200">
              <span className="text-xs md:text-sm text-slate-600">Account Title</span>
              <span className="font-semibold text-slate-900 text-sm md:text-base break-words">BUZZ FILING</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200">
              <span className="text-xs md:text-sm text-slate-600">Account Number</span>
              <span className="font-semibold text-slate-900 text-sm md:text-base break-all">1176314943776</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2">
              <span className="text-xs md:text-sm text-slate-600 flex-shrink-0">IBAN</span>
              <span className="font-semibold text-slate-900 text-sm md:text-base break-all">
                PK22UNIL0109000314943776
              </span>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div className="text-xs md:text-sm flex-1 min-w-0">
              <p className="text-red-900 break-words leading-relaxed">
                <span className="font-semibold">Important:</span> After making the payment, please upload a screenshot
                with transaction details. This helps us process your order faster.
              </p>
            </div>
          </div>

          <div className="space-y-2">
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
                  className={`flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-semibold transition-all ${
                    isUploadingReceipt || receiptFile
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:opacity-90 cursor-pointer"
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
                      Receipt Uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Choose Receipt File
                    </>
                  )}
                </label>
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{uploadError}</p>
                </div>
              )}

              {receiptFile && (
                <div className="flex items-center justify-between gap-2 md:gap-3 p-3 rounded-lg bg-green-50 border border-green-200 overflow-hidden min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <span
                        className="text-xs sm:text-sm font-semibold text-green-900 block break-words line-clamp-1"
                        title={receiptFile.name}
                      >
                        {truncateFilename(receiptFile.name)}
                      </span>
                      <span className="text-xs text-slate-600">({(receiptFile.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceipt}
                    className="h-8 w-8 sm:h-8 sm:w-8 p-0 hover:bg-red-100 rounded-full cursor-pointer flex-shrink-0"
                  >
                    <Upload className="w-4 h-4 sm:w-4 sm:h-4 text-red-600" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">Supported formats: PNG, JPG, WEBP (max. 5MB)</p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "already_paid" && (
        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="whatsapp-phone" className="text-sm md:text-base font-semibold text-slate-900">
            WhatsApp Number (Used to Contact Us)
          </Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            <Input
              id="whatsapp-phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={whatsappPhone}
              onChange={handlePhoneChange}
              className="pl-10 md:pl-11 h-11 md:h-12 text-sm md:text-base"
            />
          </div>
          {errors.whatsappNumber && <p className="text-xs md:text-sm text-red-600">{errors.whatsappNumber}</p>}
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Enter the WhatsApp number you used to discuss payment with our team
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 md:pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto h-11 md:h-12 px-6 md:px-8 border-slate-300 hover:bg-slate-50 text-sm md:text-base order-2 sm:order-1 bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || !isPaymentValid}
          className="w-full sm:w-auto sm:px-8 h-11 md:h-12 px-6 md:px-8 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 text-white font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
              Processing...
            </>
          ) : (
            <>
              Complete Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {showValidationError && !isPaymentValid && (
        <div className="p-3 md:p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs md:text-sm text-red-900 leading-relaxed">{getValidationMessage()}</p>
        </div>
      )}
    </form>
  )
}

export { PaymentStep }
