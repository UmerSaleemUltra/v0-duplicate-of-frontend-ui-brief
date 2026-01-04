"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Upload, X, CheckCircle2, PhoneIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { packagePricing } from "@/lib/pricing"

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
      const addonsTotal = data.addonsTotal || 0
      const totalAmount = packagePrice + addonsTotal

      console.log("[v0] Payment step - state:", data.state)
      console.log("[v0] Payment step - packagePrice:", packagePrice)
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
            price: packagePrice,
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
  const addonsTotal = data.addonsTotal || 0
  const totalAmount = packagePrice + addonsTotal

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
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-8 pb-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">Secure Payment</h2>
            <p className="text-muted mt-1">
              Complete your payment via WhatsApp to finalize your business formation order.
            </p>
          </div>
        </div>

        <Card className="p-6 sm:p-8 bg-white/40 backdrop-blur-md border-glass-border shadow-glow rounded-2xl space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-glass-border">
                <span className="text-muted">
                  {data.state} {data.packageType === "starter" ? "Starter" : "Advanced"} Package
                </span>
                <span className="font-semibold text-foreground">${packagePrice.toFixed(2)}</span>
              </div>

              {data.addons && data.addons.length > 0 ? (
                data.addons.map((addon, index) => (
                  <div key={index} className="flex items-center justify-between py-3">
                    <span className="text-muted">{getAddonName(addon)}</span>
                    <span className="font-semibold text-foreground">${addon.price || 0}</span>
                  </div>
                ))
              ) : addonsTotal > 0 ? (
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted">Add-ons</span>
                  <span className="font-semibold text-foreground">${addonsTotal.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between py-3 border-t border-glass-border">
                <span className="text-sm font-semibold text-foreground">Total Amount</span>
                <span className="text-xl font-bold text-foreground">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-error/5 border border-error/20 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-foreground mb-2">Payment Bank Account Details</h4>
                <p className="text-sm text-muted mb-4">For the payment, please find the details below:</p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                    <CheckCircle2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted mb-1">Bank Name</p>
                      <p className="font-bold text-foreground">United Bank Limited (UBL)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                    <CheckCircle2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted mb-1">Account Title</p>
                      <p className="font-bold text-foreground">BUZZ FILING</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                    <CheckCircle2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted mb-1">Account Number</p>
                      <p className="font-bold text-foreground">1176314943776</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                    <CheckCircle2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted mb-1">IBAN</p>
                      <p className="font-bold text-foreground break-all">PK22UNIL0109000314943776</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30">
                  <p className="text-sm text-error">
                    <span className="font-bold">Important:</span> After making the payment, kindly send a screenshot
                    with details of your payment. Thank you.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt-upload" className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Payment Receipt
              </Label>
              <div className="relative">
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReceiptUpload}
                  disabled={isUploadingReceipt || !!receiptFile}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>
              {uploadError && (
                <p className="text-sm text-error flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {uploadError}
                </p>
              )}
              {receiptFile && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-success">{receiptFile.name}</span>
                    <span className="text-xs text-muted">({(receiptFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceipt}
                    className="h-8 w-8 p-0 hover:bg-error/10"
                  >
                    <X className="w-4 h-4 text-error" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted">
                Click to upload or drag and drop
                <br />
                PNG, JPG or WEBP (max. 5MB)
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-glass-panel backdrop-blur-glass border border-glass-border p-6 space-y-6 shadow-glass">
            <div className="flex items-start gap-3">
              <PhoneIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-success mb-3">Payment Instructions</p>
                <ol className="text-sm text-muted space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Contact us on WhatsApp to receive payment details</li>
                  <li>Complete your payment via WhatsApp</li>
                  <li>Provide your phone number or upload payment receipt</li>
                  <li>Submit to complete your order</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone" className="text-sm font-semibold flex items-center gap-2">
              Phone Number
              <span className="text-xs text-muted font-normal">(Optional)</span>
            </Label>
            <Input
              id="whatsapp-phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              className="h-12 bg-white/60 border-glass-border focus:border-success/50 transition-smooth"
            />
            <p className="text-sm text-muted leading-relaxed">
              If you can share a screenshot on WhatsApp to our representative, add your phone number and we'll contact
              you
            </p>
          </div>

          <div className="p-5 rounded-xl bg-warning/5 border border-warning/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-warning" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-warning mb-1">Payment Verification</p>
              <p className="text-muted leading-relaxed">
                Your order will be processed once we verify your payment. This usually takes 1-2 business hours during
                office hours.
              </p>
            </div>
          </div>

          {!isPaymentValid && <p className="text-sm text-destructive text-center mt-2">{getValidationMessage()}</p>}

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="h-14 px-8 text-lg font-semibold border-2 hover:bg-muted/50 transition-smooth bg-transparent"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isPaymentValid}
              className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-smooth shadow-glass disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Order
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  )
}
