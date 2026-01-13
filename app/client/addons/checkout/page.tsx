"use client"
import { Suspense } from "react"
import { ClientShell } from "@/components/client/client-shell"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Addon } from "@/lib/local-storage"
import { useSelectedCompany } from "@/lib/company-context"
import { useToast } from "@/hooks/use-toast"

export default function Page() {
  function AddonCheckoutContent() {
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
  }

  return (
    <ClientShell>
      <Suspense fallback={<div>Loading...</div>}>
        <AddonCheckoutContent />
      </Suspense>
    </ClientShell>
  )
}
