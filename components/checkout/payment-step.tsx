"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, CheckCircle2, MessageCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CheckoutData } from "@/app/checkout/page"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

type PaymentStepProps = {
  data: CheckoutData
  onBack: () => void
}

function calculateRenewalDate(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString()
}

export function PaymentStep({ data, onBack }: PaymentStepProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [whatsappReference, setWhatsappReference] = useState("")

  const getAddonName = (addon: any) => {
    if (!addon) return "Unknown Add-on"
    
    // For ITIN applications with member info
    if (addon.serviceId === 'itin' && addon.memberName) {
      return `ITIN Application - ${addon.memberName}`
    }
    
    // Use addon name if available, otherwise fallback to service name
    return addon.name || addon.serviceName || "Add-on"
  }
  // </CHANGE>

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

      if (!data.email || !data.password || !data.name) {
        alert("Please complete the account information.")
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      if (!data.businessName || !data.state || !data.entityType) {
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
          email: data.email,
          password: data.password,
          name: data.name || "User",
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
              email: data.email,
              password: data.password,
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
        email: data.email,
        name: data.name || "User",
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
                ownershipPercentage: m.ownershipPercentage || 0,
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

      const companyResponse = await ApiClient.companies.create(
        {
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
            ownershipPercentage: m.ownershipPercentage || 0,
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
        },
        token,
      )

      console.log("[v0] Company created:", companyResponse.data.id)

      try {
        console.log("[v0] Starting passport uploads with companyId:", companyResponse.data.id)
        
        const passportUploadPromises = validMembers
          .filter(m => {
            const originalMember = data.members?.find(dm => dm.id === m.id)
            const hasPassport = originalMember?.passportFile instanceof File
            console.log(`[v0] Member ${m.name}: has passport = ${hasPassport}`)
            return hasPassport
          })
          .map(async (member, memberIndex) => {
            const originalMember = data.members?.find(dm => dm.id === member.id)
            if (!originalMember?.passportFile) return null
            
            const formData = new FormData()
            formData.append("file", originalMember.passportFile)
            formData.append("userId", userId)
            formData.append("companyId", companyResponse.data.id)
            formData.append("memberId", memberIndex.toString())
            formData.append("memberName", member.name)
            
            console.log(`[v0] Uploading passport for: ${member.name}, companyId: ${companyResponse.data.id}`)
            
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
        const successCount = uploadResults.filter(r => r !== null).length
        console.log(`[v0] Passport upload complete: ${successCount}/${passportUploadPromises.length} successful`)
      } catch (passportError) {
        console.error("[v0] Error uploading passports:", passportError)
      }

      console.log("[v0] Creating order via API...")
      const packagePrice = data.packagePrice || (data.packageType === "advanced" ? 249 : 149)
      const stateFilingFee = data.stateFilingFee || 100
      const addonsTotal = data.addonsTotal || 0
      const totalAmount = packagePrice + stateFilingFee + addonsTotal

      const orderResponse = await ApiClient.orders.create(
        {
          companyId: companyResponse.data.id,
          companyName: data.businessName,
          type: `${data.entityType.toUpperCase()} Formation`,
          amount: totalAmount,
          total: totalAmount,
          packagePrice: packagePrice,
          stateFilingFee: stateFilingFee,
          addonsTotal: addonsTotal,
          items: [
            {
              name: `${data.state} ${data.packageType === 'starter' ? 'Starter' : 'Advanced'} Package`,
              price: packagePrice,
              quantity: 1,
            },
          ],
          purchasedAddons: data.addons || [],
          paymentMethod: "whatsapp",
          transactionReference: whatsappReference,
        },
        token,
      )

      console.log("[v0] Order created:", orderResponse.data.id)

      console.log("[v0] Notifications will be created by backend APIs")

      const savedCheckoutData = localStorage.getItem('checkoutData')
      if (savedCheckoutData) {
        try {
          const parsed = JSON.parse(savedCheckoutData)
          // Keep only the saved progress data structure, remove completed order data
          localStorage.setItem('checkoutData', JSON.stringify({
            savedAt: parsed.savedAt,
            expiresAt: parsed.expiresAt,
            currentStep: 0 // Reset to first step
          }))
        } catch (e) {
          // If parsing fails, just clear everything
          localStorage.removeItem('checkoutData')
        }
      }

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

  const packagePrice = data.packagePrice || (data.packageType === "advanced" ? 249 : 149)
  const stateFilingFee = data.stateFilingFee || 100
  const addonsTotal = data.addonsTotal || 0
  const totalAmount = packagePrice + stateFilingFee + addonsTotal

  console.log("[v0] Payment step - addons data:", data.addons)
  console.log("[v0] Payment step - addonsTotal:", addonsTotal)
  // </CHANGE>

  return (
    <div className="space-y-6">
      <div className="glass-surface rounded-3xl p-8 lg:p-10">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-balance">Secure Payment</h1>
            <p className="text-muted text-lg leading-relaxed">
              Complete your payment via WhatsApp to finalize your business formation order.
            </p>
          </div>
        </div>

        <div className="mb-6 p-6 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            {/* Package + State Fee Combined */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">
                {data.state} {data.packageType === 'starter' ? 'Starter' : 'Advanced'} Package
              </span>
              <span className="text-sm font-medium text-slate-900">${packagePrice + stateFilingFee}</span>
            </div>
            
            {/* Individual Addons */}
            {data.addons && data.addons.length > 0 ? (
              data.addons.map((addon, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{getAddonName(addon)}</span>
                  <span className="text-sm font-medium text-slate-900">${addon.price || 0}</span>
                </div>
              ))
            ) : addonsTotal > 0 ? (
              // Fallback if addons array is missing but addonsTotal exists
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Add-ons</span>
                <span className="text-sm font-medium text-slate-900">${addonsTotal}</span>
              </div>
            ) : null}
            
            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-300">
              <span className="text-base font-semibold text-slate-900">Total Amount</span>
              <span className="text-2xl font-bold text-slate-900">${totalAmount}</span>
            </div>
          </div>
        </div>
        {/* </CHANGE> */}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-success" />
              </div>
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
            <Label htmlFor="whatsapp-ref" className="text-sm font-semibold">
              Transaction Reference / Group Code
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
              className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white shadow-lg shadow-success/20 transition-smooth"
              size="lg"
              disabled={loading || isSubmitting || !whatsappReference}
            >
              {(loading || isSubmitting) ? (
                "Processing Order..."
              ) : (
                <>
                  Submit Order <CheckCircle2 className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
