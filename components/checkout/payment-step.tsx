"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, X, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export function PaymentStep({ data, onBack, onSubmit }: PaymentStepProps) {
  const router = useRouter()
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [receiptUrl, setReceiptUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string>("")

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

    try {
      console.log("[v0] handleSubmit called")

      // Validation
      if (!whatsappPhone.trim() && !receiptUrl) {
        alert("Please provide either a phone number or upload a payment receipt")
        return
      }

      console.log("[v0] Starting payment submission...")
      console.log("[v0] whatsappPhone:", whatsappPhone)
      console.log("[v0] receiptUrl:", receiptUrl)

      // Get company data from session storage
      const companyDataStr = sessionStorage.getItem("companyData")
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
        paymentMethod: "bank_transfer",
        whatsappPhone: whatsappPhone || null,
        receiptUrl: receiptUrl || null,
      }

      console.log("[v0] Order data:", orderData)

      await onSubmit(orderData)

      console.log("[v0] Checkout completed successfully, redirecting to dashboard...")

      setTimeout(() => {
        router.push("/client/dashboard")
      }, 1000)
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      alert("Failed to process checkout. Please try again.")
    }
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
    setReceiptUrl("")
    setUploadError("")
  }

  const packagePrice = packagePricing[data.packageType as keyof typeof packagePricing] || 149
  const stateFilingFee = STATE_FEES[data.state as keyof typeof STATE_FEES] || 0
  const packageWithStateFee = packagePrice + stateFilingFee
  const addonsTotal = data.addonsTotal || 0
  const totalAmount = packageWithStateFee + addonsTotal

  console.log("[v0] Payment step - addons data:", data.addons)
  console.log("[v0] Payment step - addonsTotal:", addonsTotal)

  const isPaymentValid = whatsappPhone.trim() !== "" || receiptUrl !== ""

  const getValidationMessage = () => {
    if (!whatsappPhone.trim() && !receiptUrl) {
      return "Please provide either a phone number or upload a payment receipt"
    }
    return ""
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Secure Payment</h1>
        <p className="text-slate-700">Complete your payment via WhatsApp to finalize your business formation order.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">
              {data.state} {data.packageType === "starter" ? "Starter" : "Advanced"} Package
            </span>
            <span className="text-sm font-medium text-slate-900">${packageWithStateFee.toFixed(2)}</span>
          </div>

          {data.addons && data.addons.length > 0 ? (
            data.addons.map((addon, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{getAddonName(addon)}</span>
                <span className="text-sm font-medium text-slate-900">${addon.price || 0}</span>
              </div>
            ))
          ) : addonsTotal > 0 ? (
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Add-ons</span>
              <span className="text-sm font-medium text-slate-900">${addonsTotal.toFixed(2)}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-3 border-t-2 border-slate-300">
            <div>
              <p className="text-lg font-semibold text-slate-900">Total Amount</p>
              <p className="text-xs text-slate-600 mt-0.5">One-time payment</p>
            </div>
            <span className="text-3xl font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-slate-900 mb-1">Payment Bank Account Details</h4>
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
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-red-900">
              <span className="font-semibold">Important:</span> After making the payment, kindly send a screenshot with
              details of your payment. Thank you.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="receipt-upload" className="text-sm font-semibold text-slate-900">
            Upload Payment Receipt
          </Label>
          <div className="relative">
            <Input
              id="receipt-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleReceiptUpload}
              disabled={isUploadingReceipt || !!receiptFile}
              className="file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#880000] file:text-white hover:file:bg-[#A00000] file:cursor-pointer cursor-pointer text-sm"
            />
          </div>
          {uploadError && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <X className="w-4 h-4" />
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
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          )}
          <p className="text-xs text-slate-600">Click to upload or drag and drop PNG, JPG or WEBP (max. 5MB)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">Payment Verification</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              Your order will be processed once we verify your payment. This usually takes 1-2 business hours during
              office hours.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-2">
          <Label htmlFor="whatsapp-phone" className="text-sm font-semibold text-slate-900">
            Phone Number <span className="text-xs text-slate-500 font-normal">(Optional)</span>
          </Label>
          <Input
            id="whatsapp-phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            className="h-11"
          />
          <p className="text-sm text-slate-600 leading-relaxed">
            If you can share a screenshot on WhatsApp to our representative, add your phone number and we'll contact you
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">Payment Verification</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              Your order will be processed once we verify your payment. This usually takes 1-2 business hours during
              office hours.
            </p>
          </div>
        </div>
      </div>

      {!isPaymentValid && (
        <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg p-3">
          {getValidationMessage()}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="w-full sm:w-auto h-11 px-6 text-sm font-medium border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all bg-white flex items-center justify-center gap-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Edit
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isPaymentValid}
          className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-[#880000] to-[#A00000] hover:from-[#A00000] hover:to-[#C00000] text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              Processing...
            </>
          ) : (
            <>
              Proceed to Payment
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
