"use client"

import { useState } from "react"
import { useCompany } from "@/components/client/company-provider"
import { CheckoutShell } from "@/components/checkout/checkout-shell"
import { AccountStep } from "@/components/checkout/steps/account-step"
import { StatePackageStep } from "@/components/checkout/steps/state-package-step"
import { BusinessInfoStep } from "@/components/checkout/steps/business-info-step"
import { OwnerInfoStep } from "@/components/checkout/steps/owner-info-step"
import { ReviewStep } from "@/components/checkout/steps/review-step"
import { PaymentStep } from "@/components/checkout/steps/payment-step"

const STEPS = ["Account", "State Package", "Business Info", "Owner Info", "Review", "Payment"]

interface CheckoutData {
  email: string
  password: string
  state: string
  businessName: string
  businessType: string
  businessAddress: string
  businessCity: string
  businessState: string
  businessZip: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  ownerAddress: string
  ownerCity: string
  ownerState: string
  ownerZip: string
  additionalData?: Record<string, unknown>
}

interface PaymentSubmitData {
  amount: number
  paymentMethod: string
}

const initialCheckoutData: CheckoutData = {
  email: "",
  password: "",
  state: "",
  businessName: "",
  businessType: "",
  businessAddress: "",
  businessCity: "",
  businessState: "",
  businessZip: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerAddress: "",
  ownerCity: "",
  ownerState: "",
  ownerZip: "",
}

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<CheckoutData>(initialCheckoutData)
  const { isAuthenticated, checkoutEmail } = useCompany()

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step)
    }
  }

  const updateData = (newData: Partial<CheckoutData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  const handlePaymentSubmit = async (paymentData: PaymentSubmitData) => {
    try {
      const submitData = {
        ...data,
        email: data.email || checkoutEmail || "",
      }

      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        window.location.href = "/success"
      }
    } catch (error) {
      console.error("[v0] Payment submission error:", error)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <AccountStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 1:
        return <StatePackageStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 2:
        return <BusinessInfoStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 3:
        return <OwnerInfoStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 4:
        return <ReviewStep formData={data} updateData={updateData} onNext={nextStep} onBack={prevStep} goToStep={goToStep} />
      case 5:
        return <PaymentStep data={data} onBack={prevStep} onSubmit={handlePaymentSubmit} />
      default:
        return null
    }
  }

  return (
    <CheckoutShell
      steps={STEPS}
      currentStep={currentStep}
      data={data}
      isAuthenticated={isAuthenticated}
      originalStep={currentStep}
    >
      {renderStep()}
    </CheckoutShell>
  )
}
