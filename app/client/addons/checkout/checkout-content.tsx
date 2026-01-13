export const dynamic = "force-dynamic"
;("use client")
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Addon } from "@/lib/local-storage"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

export default function AddonCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { selectedCompanyId } = useSelectedCompany()
  const [addon, setAddon] = useState<Addon | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "whatsapp" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardholderName, setCardholderName] = useState("")

  const [transactionId, setTransactionId] = useState("")

  useEffect(() => {
    const addonId = searchParams.get("addon")
    if (!addonId) {
      router.push("/client/addons")
      return
    }

    try {
      const addonsData = localStorage.getItem("addons")
      if (addonsData) {
        const addons: Addon[] = JSON.parse(addonsData)
        const selectedAddon = addons.find((a) => a.id === addonId)
        if (selectedAddon) {
          setAddon(selectedAddon)
        }
      }
    } catch (error) {
      console.error("Error loading addon:", error)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, router])

  const handlePaymentMethodSelect = (method: "stripe" | "whatsapp") => {
    setPaymentMethod(method)
    setShowPaymentForm(true)
  }

  const handleStripePayment = async () => {
    if (!selectedCompanyId || !addon) {
      toast({
        title: "Error",
        description: "Company or addon information missing",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addonId: addon.id,
          addonName: addon.name,
          price: addon.price,
          companyId: selectedCompanyId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = await response.json()
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWhatsAppPayment = () => {
    if (!addon) return

    const message = `Hello, I would like to purchase the ${addon.name} add-on for $${addon.price}. My Company ID is ${selectedCompanyId}.`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/1234567890?text=${encodedMessage}`, "_blank")

    toast({
      title: "WhatsApp Opened",
      description: "Complete your payment via WhatsApp",
    })
  }

  const handleCardPayment = async () => {
    if (!cardNumber || !expiry || !cvc || !cardholderName) {
      toast({
        title: "Error",
        description: "Please fill in all card details",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const txId = `TX-${Date.now()}`
      setTransactionId(txId)

      const response = await fetch("/api/payments/process-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          addonId: addon?.id,
          amount: addon?.price,
          cardLast4: cardNumber.slice(-4),
          transactionId: txId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process card payment")
      }

      toast({
        title: "Success!",
        description: `Payment of $${addon?.price} processed successfully. Transaction ID: ${txId}`,
      })

      setTimeout(() => {
        router.push("/client/addons")
      }, 2000)
    } catch (error) {
      console.error("Card payment error:", error)
      toast({
        title: "Payment Error",
        description: "Failed to process card payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading checkout...</p>
      </div>
    )
  }

  if (!addon) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Addon not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{addon.name}</CardTitle>
              <CardDescription>{addon.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold">${addon.price}</span>
                  {addon.popular && <Badge>Popular</Badge>}
                </div>

                {addon.features && addon.features.length > 0 && (
                  <ul className="space-y-2">
                    {addon.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {!showPaymentForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => handlePaymentMethodSelect("stripe")}
                  className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="font-medium">Stripe</div>
                  <div className="text-sm text-muted-foreground">Credit/Debit Card</div>
                </button>

                <button
                  onClick={() => handlePaymentMethodSelect("whatsapp")}
                  className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-sm text-muted-foreground">Chat with us</div>
                </button>
              </CardContent>
            </Card>
          ) : null}

          {showPaymentForm && paymentMethod === "stripe" && (
            <Card>
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                  <Input
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Card Number</label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\s/g, "")
                      value = value.replace(/(\d{4})/g, "$1 ").trim()
                      setCardNumber(value)
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry Date</label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "")
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4)
                        }
                        setExpiry(value)
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CVC</label>
                    <Input
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    />
                  </div>
                </div>

                <Button onClick={handleCardPayment} disabled={isProcessing} className="w-full">
                  {isProcessing ? "Processing..." : `Pay $${addon.price}`}
                </Button>

                <Button variant="outline" onClick={() => setShowPaymentForm(false)} className="w-full">
                  Change Payment Method
                </Button>
              </CardContent>
            </Card>
          )}

          {transactionId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Transaction ID: {transactionId}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
