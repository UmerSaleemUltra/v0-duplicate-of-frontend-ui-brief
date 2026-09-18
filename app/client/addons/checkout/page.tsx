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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, CreditCard, MessageCircle, Check, Package, DollarSign, Lock, Shield } from "lucide-react"
import { addonStorage, companyStorage, orderStorage, currentUserStorage, type Addon } from "@/lib/local-storage"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"

function AddonCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { selectedCompanyId } = useSelectedCompany()
  const [addon, setAddon] = useState<Addon | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "whatsapp" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardholderName, setCardholderName] = useState("")

  const [transactionId, setTransactionId] = useState("")

  useEffect(() => {
    const addonId = searchParams.get("addonId")
    if (addonId) {
      const foundAddon = addonStorage.getById(addonId)
      if (foundAddon) {
        setAddon(foundAddon)
      } else {
        toast({
          title: "Error",
          description: "Addon not found",
          variant: "destructive",
        })
        router.push("/client/addons")
      }
    }
  }, [searchParams, router, toast])

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addon || !selectedCompanyId) {
      toast({
        title: "Error",
        description: "Please select a company first",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "stripe") {
      if (!cardNumber || !expiry || !cvc || !cardholderName) {
        toast({
          title: "Error",
          description: "Please fill in all card details",
          variant: "destructive",
        })
        return
      }
    } else if (paymentMethod === "whatsapp") {
      if (!transactionId) {
        toast({
          title: "Error",
          description: "Please enter your transaction ID",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)

    try {
      // Get current company
      const company = companyStorage.getById(selectedCompanyId)
      if (!company) {
        throw new Error("Company not found")
      }

      const updatedPurchasedAddons = [...(company.purchasedAddons || []), addon.id]
      await companyStorage.update(selectedCompanyId, {
        purchasedAddons: updatedPurchasedAddons,
      })

      console.log("[v0] Added addon to company:", addon.id)

      const allOrders = orderStorage.getAll()
      const existingOrder = allOrders.find((order) => order.companyId === selectedCompanyId)

      if (existingOrder) {
        // Update existing order with addon
        const updatedItems = [
          ...(existingOrder.items || []),
          {
            id: addon.id,
            name: addon.name,
            description: addon.description,
            price: addon.price,
            quantity: 1,
          },
        ]

        const updatedTotal = existingOrder.total + addon.price
        const updatedPurchasedAddons = [...(existingOrder.purchasedAddons || []), addon.id]

        await orderStorage.update(existingOrder.id, {
          items: updatedItems,
          total: updatedTotal,
          purchasedAddons: updatedPurchasedAddons,
          updatedAt: new Date().toISOString(),
        })

        console.log("[v0] Updated existing order:", existingOrder.id)
        console.log("[v0] New order total:", updatedTotal)
        console.log("[v0] Updated purchased addons:", updatedPurchasedAddons)
      } else {
        // If no existing order, create a new one (fallback)
        const currentUser = currentUserStorage.get()
        const newOrder = {
          id: `order_${Date.now()}`,
          companyId: selectedCompanyId,
          userId: currentUser?.id || "",
          userEmail: currentUser?.email || "",
          companyName: company.name,
          service: `Addon Purchase - ${addon.name}`,
          items: [
            {
              id: addon.id,
              name: addon.name,
              description: addon.description,
              price: addon.price,
              quantity: 1,
            },
          ],
          amount: addon.price,
          total: addon.price,
          status: paymentMethod === "stripe" ? "paid" : "pending",
          paymentMethod: paymentMethod,
          purchasedAddons: [addon.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        orderStorage.create(newOrder)
        console.log("[v0] Created new order for addon:", newOrder.id)
      }

      if (paymentMethod === "stripe") {
        toast({
          title: "Purchase Successful!",
          description: `${addon.name} has been added to your company`,
        })
        router.push("/client/company")
      } else {
        // WhatsApp payment flow
        toast({
          title: "Payment Pending",
          description: "Your addon will be activated after payment confirmation.",
        })
        router.push("/client/company")
      }
    } catch (error) {
      console.error("[v0] Error purchasing addon:", error)
      toast({
        title: "Error",
        description: "Failed to purchase addon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentMethodChange = useCallback((value: "stripe" | "whatsapp") => {
    setPaymentMethod(value)
    setShowPaymentForm(true)
  }, [])

  const handleBackToPaymentMethods = useCallback(() => {
    setPaymentMethod(null)
    setShowPaymentForm(false)
  }, [])

  const stripePaymentForm = useMemo(() => {
    if (!showPaymentForm || paymentMethod !== "stripe") return null

    return (
      <form onSubmit={handlePurchase} className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#ff0d13]" />
            Card Details
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackToPaymentMethods}
            className="text-slate-600"
          >
            Change Method
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              maxLength={4}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardholderName">Cardholder Name</Label>
          <Input
            id="cardholderName"
            placeholder="John Smith"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
          />
        </div>

        <div className="p-4 rounded-lg bg-[#ff0d13]/5 border border-[#ff0d13]/20 flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#ff0d13] flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[#ff0d13] mb-1">256-bit SSL Encryption</p>
            <p className="text-slate-600">Your payment information is encrypted and secure.</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">${addon?.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Processing Fee</span>
            <span className="font-medium">$0</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-xl text-slate-900">${addon?.price}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToPaymentMethods}
            className="flex-1 bg-transparent"
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button type="submit" disabled={isProcessing} className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            {isProcessing ? "Processing..." : `Pay $${addon?.price}`}
          </Button>
        </div>
      </form>
    )
  }, [
    showPaymentForm,
    paymentMethod,
    cardNumber,
    expiry,
    cvc,
    cardholderName,
    isProcessing,
    addon,
    handleBackToPaymentMethods,
  ])

  const whatsappPaymentForm = useMemo(() => {
    if (!showPaymentForm || paymentMethod !== "whatsapp") return null

    return (
      <form onSubmit={handlePurchase} className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Payment
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackToPaymentMethods}
            className="text-slate-600"
          >
            Change Method
          </Button>
        </div>

        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-start gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 mb-2">Payment Instructions</p>
              <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                <li>Contact us on WhatsApp to receive payment details</li>
                <li>Complete your payment via WhatsApp</li>
                <li>Enter your transaction reference below</li>
                <li>Submit to complete your order</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
          <Input
            id="transactionId"
            placeholder="Enter your transaction ID or reference number"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            required
          />
          <p className="text-sm text-slate-600">
            Please enter the transaction ID or reference number from your WhatsApp payment
          </p>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 mb-1">Payment Verification</p>
            <p className="text-slate-700">
              Your order will be processed once we verify your payment. This usually takes 1-2 business hours.
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">${addon?.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Processing Fee</span>
            <span className="font-medium">$0</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-xl text-slate-900">${addon?.price}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToPaymentMethods}
            className="flex-1 bg-transparent"
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isProcessing || !transactionId}
            className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13]"
          >
            {isProcessing ? "Submitting..." : "Submit Reference"}
          </Button>
        </div>
      </form>
    )
  }, [showPaymentForm, paymentMethod, transactionId, isProcessing, addon, handleBackToPaymentMethods])

  if (!addon) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Loading addon details...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  return (
    <ClientShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Addons
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Addon Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>{addon.name}</CardTitle>
                  <CardDescription>{addon.category}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">{addon.description}</p>

              {addon.features && addon.features.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="font-medium text-slate-900">What's included:</p>
                  <ul className="space-y-2">
                    {addon.features.map((feature, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-slate-900">Total</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5 text-slate-500" />
                    <span className="text-3xl font-bold text-slate-900">{addon.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose how you'd like to pay</CardDescription>
            </CardHeader>
            <CardContent>
              {!showPaymentForm && (
                <div className="space-y-4">
                  <RadioGroup value={paymentMethod || ""} onValueChange={handlePaymentMethodChange}>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-[#ff0d13] transition-colors cursor-pointer">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-slate-600">Pay securely with Stripe</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-[#ff0d13] transition-colors cursor-pointer">
                      <RadioGroupItem value="whatsapp" id="whatsapp" />
                      <Label htmlFor="whatsapp" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">WhatsApp Payment</div>
                          <div className="text-sm text-slate-600">Pay via WhatsApp transfer</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {stripePaymentForm}
              {whatsappPaymentForm}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientShell>
  )
}

export default function AddonCheckoutPage() {
  return (
    <Suspense
      fallback={
        <ClientShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        </ClientShell>
      }
    >
      <AddonCheckoutContent />
    </Suspense>
  )
}
