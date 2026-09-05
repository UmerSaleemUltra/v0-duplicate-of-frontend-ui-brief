"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, CheckCircle2, MessageCircle, Sparkles } from "lucide-react"
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
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | null>(null)
  const [whatsappReference, setWhatsappReference] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Starting checkout submission via API...")

      if (!data.email || !data.password || !data.name) {
        alert("Please complete the account information")
        setLoading(false)
        return
      }

      if (!data.businessName || !data.state || !data.entityType) {
        alert("Please complete the business information")
        setLoading(false)
        return
      }

      console.log("[v0] Creating/logging in user...")
      let token = ""
      let userId = ""

      try {
        // Try to signup first
        const signupResponse = await ApiClient.auth.signup({
          email: data.email,
          password: data.password,
          name: data.name || "User",
          phone: data.phone || "",
          role: "client",
        })

        token = signupResponse.token
        userId = signupResponse.user.id
        console.log("[v0] New user created:", userId)
      } catch (signupError: any) {
        // If user exists, login instead
        if (signupError.message?.includes("exists")) {
          console.log("[v0] User exists, logging in...")
          const loginResponse = await ApiClient.auth.login({
            email: data.email,
            password: data.password,
          })

          token = loginResponse.token
          userId = loginResponse.user.id
          console.log("[v0] User logged in:", userId)
        } else {
          throw signupError
        }
      }

      if (!token || !userId) {
        throw new Error("Authentication failed")
      }

      authService.setToken(token)

      // Create company via API
      console.log("[v0] Creating company via API...")
      const firstMember = data.members && data.members.length > 0 && data.members[0] ? data.members[0] : null

      const companyResponse = await ApiClient.companies.create(
        {
          name: data.businessName,
          type: data.entityType,
          state: data.state,
          status: "processing",
          address: {
            street: firstMember?.address || "",
            city: firstMember?.city || "",
            state: firstMember?.state || data.state,
            zip: firstMember?.zip || "",
          },
          businessCategory: data.businessCategory,
          businessDescription: data.businessDescription,
          businessWebsite: data.businessWebsite,
          packageType: data.packageType,
          members: (data.members || [])
            .filter((m) => m != null) // Remove null/undefined entries
            .map((m) => ({
              firstName: m.firstName || m.name?.split(" ")[0] || "",
              middleName: m.middleName || "",
              lastName: m.lastName || m.name?.split(" ").slice(1).join(" ") || "",
              email: m.email || data.email, // Use account email as fallback
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

      // Create order via API
      console.log("[v0] Creating order via API...")
      const totalAmount = data.totalAmount || (data.packageType === "advanced" ? 399 : 199)

      const orderResponse = await ApiClient.orders.create(
        {
          companyId: companyResponse.data.id,
          companyName: data.businessName,
          type: `${data.entityType.toUpperCase()} Formation`,
          amount: totalAmount,
          total: totalAmount,
          packagePrice: data.packagePrice || (data.packageType === "advanced" ? 249 : 149),
          stateFilingFee: data.stateFilingFee || 50,
          addonsTotal: data.addonsTotal || 0,
          items: [
            {
              name: `${data.packageType} Package`,
              price: data.packagePrice || (data.packageType === "advanced" ? 249 : 149),
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

      // Create welcome notification
      await ApiClient.notifications.create(
        {
          userId: userId,
          type: "system",
          title: "Welcome to BuzzFiling!",
          message: `Your ${data.entityType.toUpperCase()} formation order has been received and is being processed.`,
          read: false,
        },
        token,
      )

      console.log("[v0] Checkout completed successfully, redirecting...")

      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/order-confirmation?orderId=${orderResponse.data.id}`)
      }, 1000)
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      alert("Failed to process checkout. Please try again.")
      setLoading(false)
    }
  }

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

        {!paymentMethod && (
          <div className="space-y-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              Payment Method
            </h3>
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setPaymentMethod("whatsapp")}
                className="group w-full p-8 rounded-2xl border-2 border-glass-border bg-white/40 hover:border-success/50 hover:bg-white/60 transition-smooth text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Pay with WhatsApp</div>
                    <div className="text-sm text-muted">Manual Payment</div>
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Complete payment via WhatsApp and submit your transaction reference for quick verification.
                </p>
                <div className="flex items-center gap-2 text-xs text-warning">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Verified within 1-2 hours</span>
                </div>
              </button>
            </div>

            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="w-full bg-white/50 hover:bg-white/80 border-glass-border transition-smooth"
            >
              <ArrowLeft className="mr-2 w-5 h-5" /> Back to Review
            </Button>
          </div>
        )}

        {paymentMethod === "whatsapp" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-glass-border">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-success" />
                WhatsApp Payment
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPaymentMethod(null)}
                className="text-muted hover:text-foreground"
              >
                Change Method
              </Button>
            </div>

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
                onClick={() => setPaymentMethod(null)}
                variant="outline"
                size="lg"
                className="flex-1 bg-white/50 hover:bg-white/80 border-glass-border transition-smooth"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 w-5 h-5" /> Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white shadow-lg shadow-success/20 transition-smooth"
                size="lg"
                disabled={loading || !whatsappReference}
              >
                {loading ? (
                  "Processing Order..."
                ) : (
                  <>
                    Submit Order <CheckCircle2 className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
