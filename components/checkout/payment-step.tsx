"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, CheckCircle2, MessageCircle, Upload, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { packagePricing, stateFees } from "@/lib/pricing"

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
  const [whatsappReference, setWhatsappReference] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string>("")
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

    if (isSubmitting || loading) {
      console.log("[v0] Order creation already in progress, ignoring duplicate request")
      return
    }

    setLoading(true)
    setIsSubmitting(true)

    try {
      console.log("[v0] Starting checkout submission via API...")
      console.log("[v0] Payment step - data object:", data)

      const accountEmail = data.email || data.accountInfo?.email
      const accountPassword = data.password || data.accountInfo?.password
      const accountName = data.name || data.accountInfo?.name

      console.log(
        "[v0] Payment validation - email:",
        accountEmail,
        "name:",
        accountName,
        "hasPassword:",
        !!accountPassword,
      )

      if (!accountEmail || !accountPassword || !accountName) {
        console.error(
          "[v0] Missing account info - email:",
          !!accountEmail,
          "password:",
          !!accountPassword,
          "name:",
          !!accountName,
        )
        alert("Please complete the account information.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      if (!data.businessName || !data.state || !data.entityType) {
        console.error(
          "[v0] Missing business info - businessName:",
          !!data.businessName,
          "state:",
          !!data.state,
          "entityType:",
          !!data.entityType,
        )
        alert("Please complete the business information.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      if (!data.members || data.members.length === 0) {
        alert("Please add at least one member.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      console.log("[v0] Creating/logging in user...")
      let token = ""
      let userId = ""

      try {
        const signupResponse = await ApiClient.auth.signup({
          email: accountEmail,
          password: accountPassword,
          name: accountName,
          phone: data.phone || "",
          role: "client",
        })

        console.log("[v0] Signup response received:", JSON.stringify(signupResponse))

        const responseData = signupResponse.data || signupResponse

        if (!responseData.token) {
          throw new Error("Unable to create your account. Please try again.")
        }

        if (!responseData.user || !responseData.user.id) {
          throw new Error("Unable to create your account. Please try again.")
        }

        token = responseData.token
        userId = responseData.user.id
        console.log("[v0] New user created:", userId)
      } catch (signupError: any) {
        if (signupError.message?.includes("409") || signupError.message?.includes("exists")) {
          console.log("[v0] User exists (409), logging in instead...")
          try {
            const loginResponse = await ApiClient.auth.login({
              email: accountEmail,
              password: accountPassword,
            })

            console.log("[v0] Login response received:", JSON.stringify(loginResponse))

            const loginData = loginResponse.data || loginResponse

            if (!loginData.token || !loginData.user || !loginData.user.id) {
              throw new Error("Unable to log you in. Please check your password.")
            }

            token = loginData.token
            userId = loginData.user.id
            console.log("[v0] User logged in successfully:", userId)
          } catch (loginError: any) {
            console.error("[v0] Login error after 409:", loginError)
            alert(`We couldn't log you in. ${loginError.message || "Please check your password and try again."}`)
            setIsSubmitting(false)
            setLoading(false)
            return
          }
        } else {
          console.error("[v0] Signup error:", signupError)
          alert(`Unable to create account: ${signupError.message || "Please try again."}`)
          setIsSubmitting(false)
          setLoading(false)
          return
        }
      }

      if (!token || !userId) {
        alert("Authentication failed. Please try again.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      const authUser = {
        id: userId,
        email: accountEmail,
        name: accountName,
        role: "client" as const,
      }
      authService.setAuth(token, authUser)

      console.log("[v0] Creating company via API...")

      const validMembers = Array.isArray(data.members)
        ? data.members
            .filter((m) => {
              if (!m || typeof m !== "object" || !m.id) return false
              return true
            })
            .map((m) => {
              const memberId =
                m.id && typeof m.id === "string" && m.id.length > 0 ? m.id : globalThis.crypto.randomUUID()

              return {
                ...m,
                id: memberId,
                name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Member",
                firstName: m.firstName || m.name?.split(" ")[0] || "",
                lastName: m.lastName || m.name?.split(" ").slice(1).join(" ") || "",
                email: m.email || data.email,
                phone: m.phone || data.phone || "",
                address: m.address || "",
                city: m.city || "",
                state: m.state || data.state,
                country: m.country || "US",
                zip: m.zip || "",
                ssn: m.ssn || "",
                dateOfBirth: m.dateOfBirth || "",
                isResponsiblePerson: m.isResponsiblePerson || false,
                needsItin: m.needsItin || false,
              }
            })
        : []

      console.log("[v0] Valid members count:", validMembers.length)
      console.log(
        "[v0] Valid members with IDs:",
        validMembers.map((m) => ({ id: m.id, name: m.name })),
      )

      if (validMembers.length === 0) {
        alert("No valid members found. Please add at least one member.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      const firstMember = validMembers[0]
      if (!firstMember || !firstMember.id) {
        alert("Invalid member data. Please try again.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      const companyResponse = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.businessName,
          type: data.entityType,
          state: data.state,
          status: "processing",
          address: {
            street: firstMember.address || "",
            city: firstMember.city || "",
            state: firstMember.state || data.state,
            zip: firstMember.zip || "",
          },
          businessCategory: data.businessCategory,
          businessDescription: data.businessDescription,
          businessWebsite: data.businessWebsite,
          packageType: data.packageType,
          transactionReference: whatsappReference, // Save reference number
          members: validMembers.map((m) => ({
            firstName: m.firstName || "",
            middleName: m.middleName || "",
            lastName: m.lastName || "",
            email: m.email || data.email,
            phone: m.phone || data.phone || "",
            address: m.address || "",
            city: m.city || "",
            state: m.state || data.state,
            zip: m.zip || "",
            dateOfBirth: m.dateOfBirth || "",
            ssn: m.ssn || "",
            isResponsiblePerson: m.isResponsiblePerson || false,
            needsItin: m.needsItin || false,
          })),
          milestones: {
            orderProcessed: false,
            registeredAgentAssigned: false,
            mailingAddressIssued: false,
            formationCompleted: false,
            einProcessed: false,
            boiReportFiled: false,
          },
          purchasedAddons: data.addons || [],
        }),
      })

      const companyData = await companyResponse.json()
      console.log("[v0] Company created:", companyData.data.id)

      try {
        console.log("[v0] Starting passport uploads with companyId:", companyData.data.id)

        const passportUploadPromises = validMembers
          .filter((m) => {
            const originalMember = data.members?.find((dm) => dm.id === m.id)
            const hasPassport = originalMember?.passportFile instanceof File
            console.log(`[v0] Member ${m.name}: has passport = ${hasPassport}`)
            return hasPassport
          })
          .map(async (member, memberIndex) => {
            const originalMember = data.members?.find((dm) => dm.id === member.id)
            if (!originalMember?.passportFile) return null

            const formData = new FormData()
            formData.append("file", originalMember.passportFile)
            formData.append("userId", userId)
            formData.append("companyId", companyData.data.id)
            formData.append("memberId", memberIndex.toString())
            formData.append("memberName", member.name)

            console.log(`[v0] Uploading passport for: ${member.name}, companyId: ${companyData.data.id}`)

            const response = await fetch("/api/passports/upload", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              const errorText = await response.text()
              console.error(`[v0] Failed to upload passport for ${member.name}:`, errorText)
              return null
            }

            const result = await response.json()
            console.log(`[v0] Passport uploaded successfully for ${member.name}:`, result.data)
            return result.data
          })

        const uploadResults = await Promise.all(passportUploadPromises)
        const successCount = uploadResults.filter((r) => r !== null).length
        console.log(`[v0] Passport upload complete: ${successCount}/${passportUploadPromises.length} successful`)
      } catch (passportError) {
        console.error("[v0] Error uploading passports:", passportError)
      }

      console.log("[v0] Creating order via API...")
      const packagePrice = packagePricing[data.packageType] || 149
      const stateFilingFee = stateFees[data.state] || 100
      const addonsTotal = data.addonsTotal || 0
      const totalAmount = packagePrice + stateFilingFee + addonsTotal

      const orderData = {
        companyId: companyData.data.id,
        companyName: data.businessName,
        type: `${data.entityType.toUpperCase()} Formation`,
        amount: totalAmount,
        total: totalAmount,
        packagePrice: packagePrice,
        stateFilingFee: stateFilingFee,
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
        transactionReference: whatsappReference,
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
      setIsSubmitting(false)
      setLoading(false)
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

  const packagePrice = packagePricing[data.packageType] || 149
  const stateFilingFee = stateFees[data.state] || 100
  const addonsTotal = data.addonsTotal || 0
  const totalAmount = packagePrice + stateFilingFee + addonsTotal

  console.log("[v0] Payment step - addons data:", data.addons)
  console.log("[v0] Payment step - addonsTotal:", addonsTotal)

  const isSubmitDisabled = !receiptUrl || !whatsappReference.trim() || loading || isSubmitting

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
                <AlertCircle className="w-6 h-6 text-white" />
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
                  <AlertCircle className="w-4 h-4" />
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

          <div className="p-5 rounded-xl bg-success/5 border border-success/20 space-y-3">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-success mb-3">Payment Instructions</p>
                <ol className="text-sm text-muted space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Contact us on WhatsApp to receive payment details</li>
                  <li>Complete your payment via WhatsApp</li>
                  <li>Enter your transaction reference below</li>
                  <li>Submit to complete your order</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone" className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="whatsapp-phone"
              type="tel"
              placeholder="+1 302 209 8440"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-12 bg-white/60 border-glass-border focus:border-success/50 transition-smooth"
            />
            <p className="text-sm text-muted leading-relaxed">
              If you can share a screenshot on WhatsApp to our representative, add your phone number and we'll contact
              you
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-ref" className="text-sm font-semibold">
              Transaction Reference / Group Code *
            </Label>
            <Input
              id="whatsapp-ref"
              placeholder="Enter your transaction ID or reference number"
              value={whatsappReference}
              onChange={(e) => setWhatsappReference(e.target.value)}
              className="h-12 bg-white/60 border-glass-border focus:border-success/50 transition-smooth"
              required
            />
            <p className="text-sm text-muted leading-relaxed">
              Please enter the transaction ID, reference number, or group code from your WhatsApp payment
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

          {isSubmitDisabled && (receiptUrl || whatsappReference.trim()) && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="text-sm text-error">
                <p className="font-semibold mb-1">Missing Required Information</p>
                <ul className="list-disc list-inside space-y-1">
                  {!receiptUrl && <li>Please upload your payment receipt screenshot</li>}
                  {!whatsappReference.trim() && <li>Please enter your transaction reference number</li>}
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              size="lg"
              className="flex-1 bg-white/50 hover:bg-white/80 border-glass-border transition-smooth"
              disabled={loading || isSubmitting}
            >
              <ArrowLeft className="mr-2 w-5 h-5" /> Back to Review
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/20 transition-smooth"
              disabled={isSubmitDisabled}
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Order <CheckCircle2 className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  )
}
