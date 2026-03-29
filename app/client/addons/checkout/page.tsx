"use client"

import type React from "react"

import { useState, useEffect, Suspense, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ClientShell } from "@/components/client/client-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MessageCircle, Check, Package, DollarSign, Lock, Shield, Upload, Phone } from "lucide-react"
import type { Addon } from "@/lib/local-storage"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { ApiClient } from "@/lib/api-client"

function AddonCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { selectedCompanyId } = useSelectedCompany()
  const [addon, setAddon] = useState<Addon | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp">("whatsapp")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("")
  const [whatsappReceiptFile, setWhatsappReceiptFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchAddon = async () => {
      const addonId = searchParams.get("addonId")
      if (!addonId) {
        toast({
          title: "Error",
          description: "No addon selected",
          variant: "destructive",
        })
        router.push("/client/addons")
        return
      }

      setIsLoading(true)

      try {
        const token = authService.getToken()
        if (!token) {
          throw new Error("Not authenticated")
        }

        const response = await fetch("/api/addons", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch addons: ${response.status}`)
        }

        const data = await response.json()
        const addonsList = Array.isArray(data) ? data : (data.data?.addons || data.addons || [])
        
        if (!Array.isArray(addonsList)) {
          throw new Error("Invalid addons data format")
        }

        const foundAddon = addonsList.find((a: Addon) => a.id === addonId)

        if (foundAddon) {
          setAddon(foundAddon)
        } else {
          toast({
            title: "Error",
            description: `Addon with ID ${addonId} not found. Please select a valid addon.`,
            variant: "destructive",
          })
          router.push("/client/addons")
        }
      } catch (error) {
        console.error("[v0] Error fetching addon:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load addon",
          variant: "destructive",
        })
        router.push("/client/addons")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddon()
  }, [searchParams, router, toast])

  const handlePurchase = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addon) {
      toast({
        title: "Error",
        description: "Addon details are not loaded yet. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCompanyId) {
      toast({
        title: "Error",
        description: "No company selected. Please go back and select a company first.",
        variant: "destructive",
      })
      router.push("/client/company")
      return
    }

    if (paymentMethod === "whatsapp") {
      const hasPhone = whatsappPhoneNumber?.trim().length > 0
      const hasFile = whatsappReceiptFile !== null

      if (!hasPhone && !hasFile) {
        toast({
          title: "Required Information Missing",
          description: "Please provide either your phone number or upload a payment receipt to continue.",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)

    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error("Not authenticated")
      }

      // Phone number validation - ensure it's a valid string
      const validPhoneNumber = whatsappPhoneNumber?.trim() || ""

      // Create FormData to send file and other data
      const formData = new FormData()
      formData.append("addonId", addon.id)
      formData.append("companyId", selectedCompanyId)

      // Only append phone number if it's provided and not empty
      if (validPhoneNumber) {
        formData.append("phoneNumber", validPhoneNumber)
      }

      // Only append receipt file if it exists
      if (whatsappReceiptFile) {
        formData.append("receiptFile", whatsappReceiptFile)
      }

      // Submit WhatsApp payment
      const paymentResponse = await fetch("/api/addons/purchase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || "Failed to submit payment details")
      }

      const paymentData = await paymentResponse.json()

      // Get user data for notifications
      const userResponse = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        const user = userData.data

        try {
          await fetch("/api/email/addon-purchase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: user.email,
              name: user.name,
              addonDetails: [
                {
                  serviceId: addon.id,
                  name: addon.name,
                  price: `$${addon.price.toFixed(2)}`,
                },
              ],
              paymentMethod: "whatsapp",
              phoneNumber: validPhoneNumber || "Not provided",
            }),
          })
        } catch (emailError) {
          console.error("[v0] Failed to send email:", emailError)
        }

        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: user.id,
              type: "addon_purchased",
              title: "Add-on Purchased",
              message: "You have successfully purchased a new add-on. It's now available in your dashboard.",
              actionUrl: "/client/company",
              metadata: {
                companyId: selectedCompanyId,
                addonId: addon.id,
                addonName: addon.name,
                addonPrice: addon.price,
                paymentRecordId: paymentData.data?.paymentId,
              },
            }),
          })
        } catch (notifError) {
          console.error("[v0] Failed to create notification:", notifError)
        }
      }

      toast({
        title: "Payment Submitted!",
        description: `Your payment details for ${addon.name} have been submitted. We'll verify and process your order shortly.`,
      })

      router.push("/client/company")
    } catch (error) {
      console.error("[v0] Error purchasing addon:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [addon, selectedCompanyId, paymentMethod, whatsappPhoneNumber, whatsappReceiptFile, toast, router])

  const whatsappPaymentForm = useMemo(() => {
    if (paymentMethod !== "whatsapp") return null

      const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value || ""
        // Trim and store the phone number as string
        setWhatsappPhoneNumber(value.trim())
      }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setWhatsappReceiptFile(file)
      }
    }

    return (
      <form onSubmit={handlePurchase} className="space-y-5">
        <div className="pb-3 border-b">
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Payment
          </h3>
        </div>

        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-start gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 mb-2">Payment Instructions</p>
              <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                <li>Contact us on WhatsApp to receive payment details</li>
                <li>Complete your payment via WhatsApp</li>
                <li>Enter your phone number and upload the payment receipt</li>
                <li>Submit to complete your order</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 mb-1">Payment Verification</p>
            <p className="text-slate-700">
              Your order will be processed once we verify your payment and receipt. This usually takes 1-2 business hours.
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label htmlFor="whatsapp-phone" className="text-slate-700 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            WhatsApp Phone Number (Optional)
          </Label>
          <Input
            id="whatsapp-phone"
            type="tel"
            placeholder="Enter your WhatsApp phone number"
            value={whatsappPhoneNumber}
            onChange={handlePhoneChange}
            className="bg-white"
          />
          <p className="text-xs text-slate-500">Include country code (e.g., +1234567890)</p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="receipt-file" className="text-slate-700 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Payment Receipt (Optional)
          </Label>
          <div className="relative">
            <Input
              id="receipt-file"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="bg-white cursor-pointer"
            />
            {whatsappReceiptFile && (
              <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {whatsappReceiptFile.name}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">Accepted: Images (PNG, JPG) or PDF</p>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">${addon?.price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Processing Fee</span>
            <span className="font-medium">$0</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between pt-1">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-base text-slate-900">${addon?.price?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isProcessing || (!whatsappPhoneNumber && !whatsappReceiptFile)}
            className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] cursor-pointer"
          >
            {isProcessing ? "Submitting..." : `Submit Payment`}
          </Button>
        </div>
      </form>
    )
    }, [paymentMethod, whatsappPhoneNumber, whatsappReceiptFile, isProcessing, addon, selectedCompanyId, handlePurchase])

  if (isLoading) {
    return (
      <ClientShell>
        <AddonCheckoutSkeleton />
      </ClientShell>
    )
  }

  if (!addon) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-slate-600">Addon not found</p>
            <Button onClick={() => router.push("/client/addons")} className="mt-4 cursor-pointer">
              Back to Addons
            </Button>
          </div>
        </div>
      </ClientShell>
    )
  }

  return (
    <ClientShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 cursor-pointer -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Addons
        </Button>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Addon Details — compact left card */}
          <Card className="h-fit">
            <CardContent className="pt-6 space-y-0">
              {/* Icon + name row */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-base leading-tight">{addon.name}</p>
                  <p className="text-sm text-slate-500">{addon.category}</p>
                </div>
              </div>

              {/* Description */}
              {addon.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{addon.description}</p>
              )}
              </div>

              {/* Features list — compact, scrollable if many items */}
              {addon.features && addon.features.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-slate-700 mb-2">{addon.name}</p>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {addon.features.map((feature, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Total row */}
              <div className="pt-4 border-t flex items-center justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-slate-500 text-sm">$</span>
                  <span className="text-4xl font-bold text-slate-900 leading-none">{addon.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Payment Form */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="w-4 h-4 text-green-600" />
                Payment Information
              </CardTitle>
              <CardDescription>Enter your phone number or upload a payment receipt</CardDescription>
            </CardHeader>
            <CardContent>
              {whatsappPaymentForm}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientShell>
  )
}

function AddonCheckoutSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="h-9 w-36 bg-slate-200 rounded-md animate-pulse" />

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left card — addon details */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
          {/* Icon + name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${65 + (i % 3) * 10}%` }} />
              </div>
            ))}
          </div>

          {/* Total row */}
          <div className="pt-4 border-t flex items-center justify-between">
            <div className="h-5 w-12 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Right card — payment form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
          {/* Card header */}
          <div className="space-y-2 pb-3 border-b">
            <div className="h-5 w-44 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
          </div>

          {/* Payment method header */}
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />

          {/* Instruction box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: `${80 - i * 8}%` }} />
            ))}
          </div>

          {/* Notice box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-3.5 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-3.5 w-3/4 bg-slate-100 rounded animate-pulse" />
          </div>

          <div className="h-px bg-slate-200" />

          {/* Phone input */}
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-100 rounded-md animate-pulse" />
            <div className="h-3 w-52 bg-slate-100 rounded animate-pulse" />
          </div>

          {/* File input */}
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-100 rounded-md animate-pulse" />
            <div className="h-3 w-44 bg-slate-100 rounded animate-pulse" />
          </div>

          <div className="h-px bg-slate-200" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-6 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between pt-1">
              <div className="h-5 w-10 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-14 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Submit button */}
          <div className="h-10 w-full bg-slate-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function AddonCheckoutPage() {
  return (
    <Suspense
      fallback={
        <ClientShell>
          <AddonCheckoutSkeleton />
        </ClientShell>
      }
    >
      <AddonCheckoutContent />
    </Suspense>
  )
}
