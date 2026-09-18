"use client"

import { useState, useEffect } from "react"
import { CheckoutShell } from "@/components/checkout/checkout-shell"
import { AccountStep } from "@/components/checkout/account-step"
import { StatePackageStep } from "@/components/checkout/state-package-step"
import { BusinessInfoStep } from "@/components/checkout/business-info-step"
import { OwnerInfoStep } from "@/components/checkout/owner-info-step"
import { ReviewStep } from "@/components/checkout/review-step"
import { PaymentStep } from "@/components/checkout/payment-step"
import { saveCheckoutData, getCheckoutData, initCheckoutData } from "@/lib/checkout-storage"

export type Member = {
  id: string
  firstName?: string
  middleName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  dateOfBirth?: string
  ssn?: string
  ownershipPercentage?: number
  isResponsiblePerson?: boolean
  needsItin?: boolean
  itinAdded?: boolean
  passportFile?: File | null
  // Legacy fields
  name?: string
}

export type CheckoutData = {
  // Account
  email: string
  password: string
  phone: string
  name: string
  // State & Package
  state: string
  entityType: string
  packageType: string
  // Business Info
  businessName: string
  businessAddress: string
  businessCity: string
  businessZip: string
  businessWebsite?: string
  businessCategory?: string
  businessDescription?: string // Added business description field
  needsResellerCertificate?: boolean
  members: Member[]
  // Add-ons
  addons: string[]
  // Upsells
  upsells: string[]
}

const STEPS = ["Account", "State & Package", "Business Info", "Owner Info", "Review", "Payment"]

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [data, setData] = useState<CheckoutData>({
    email: "",
    password: "",
    phone: "",
    name: "",
    state: "",
    entityType: "",
    packageType: "",
    businessName: "",
    businessAddress: "",
    businessCity: "",
    businessZip: "",
    businessWebsite: "",
    businessCategory: "",
    businessDescription: "",
    needsResellerCertificate: false,
    members: [
      {
        id: crypto.randomUUID(),
        name: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        ssn: "",
        dateOfBirth: "",
        isResponsiblePerson: true,
        needsItin: false,
        itinAdded: false,
        passportFile: null,
        ownershipPercentage: 100,
      },
    ],
    addons: [],
    upsells: [],
  })

  useEffect(() => {
    console.log("[v0] Checkout - initializing data")
    initCheckoutData()
    const savedData = getCheckoutData()
    if (savedData) {
      console.log("[v0] Checkout - found saved data:", savedData)
      setData({
        email: savedData.account.email || "",
        password: savedData.account.password || "",
        phone: savedData.account.phone || "",
        name: savedData.account.name || "",
        state: savedData.state.state || "",
        entityType: savedData.state.entityType || "",
        packageType: savedData.state.packageType || "",
        businessName: savedData.businessInfo.businessName || "",
        businessAddress: "",
        businessCity: "",
        businessZip: "",
        businessWebsite: "",
        businessCategory: savedData.businessInfo.businessCategory || "",
        businessDescription: savedData.businessInfo.businessDescription || "",
        needsResellerCertificate: savedData.businessInfo.needsResellerCertificate || false,
        members: (savedData.members || [])
          .filter((m) => m != null)
          .map((m) => ({
            id: crypto.randomUUID(),
            name: m.name || "",
            firstName: m.firstName || "",
            middleName: m.middleName || "",
            lastName: m.lastName || "",
            email: m.email || "",
            phone: m.phone || "",
            address: m.address || "",
            city: m.city || "",
            state: m.state || "",
            zip: m.zip || "",
            ssn: m.ssn || "",
            dateOfBirth: m.dateOfBirth || "",
            isResponsiblePerson: m.isResponsiblePerson || false,
            needsItin: false,
            itinAdded: m.itinAdded || false,
            ownershipPercentage: m.ownershipPercentage || 0,
            passportFile: null,
          })),
        addons: [],
        upsells: [],
      })
    }
    console.log("[v0] Checkout - data initialized")
    setIsInitialized(true)
  }, [])

  const updateData = (updates: Partial<CheckoutData>) => {
    setData((prev) => {
      const newData = { ...prev, ...updates }

      saveCheckoutData({
        account: {
          email: newData.email,
          password: newData.password,
          phone: newData.phone || "",
          name: newData.name || "",
        },
        state: {
          state: newData.state,
          entityType: newData.entityType as "llc" | "s-corp",
          packageType: newData.packageType as "starter" | "advanced",
        },
        businessInfo: {
          businessName: newData.businessName,
          businessCategory: newData.businessCategory || "",
          businessDescription: newData.businessDescription || "",
          needsResellerCertificate: newData.needsResellerCertificate || false,
        },
        members: (newData.members || [])
          .filter((m) => m != null) // Remove null/undefined entries
          .map((m) => ({
            name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim(),
            address: m.address || "",
            city: m.city || "",
            state: m.state || "",
            country: "US",
            zip: m.zip || "",
            ssn: m.ssn || "",
            dateOfBirth: m.dateOfBirth || "",
            isResponsiblePerson: m.isResponsiblePerson || false,
            itinAdded: m.itinAdded || false,
            ownershipPercentage: m.ownershipPercentage || 0,
          })),
        orderId: getCheckoutData()?.orderId || `ORD-${Date.now()}`,
        createdAt: getCheckoutData()?.createdAt || new Date().toISOString(),
        status: "draft",
        payment: {
          method: "bank-transfer",
          status: "pending",
        },
      })

      return newData
    })
  }

  const nextStep = () => {
    console.log("[v0] Checkout - nextStep called, current step:", currentStep)
    if (currentStep < STEPS.length - 1) {
      console.log("[v0] Checkout - moving to step:", currentStep + 1)
      setCurrentStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const renderStep = () => {
    console.log("[v0] Checkout - renderStep called, current step:", currentStep)
    if (!data || !isInitialized) {
      console.log("[v0] Checkout - data not ready, showing loading")
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#880000] mx-auto mb-4"></div>
            <p className="text-slate-600">Loading checkout...</p>
          </div>
        </div>
      )
    }

    switch (currentStep) {
      case 0:
        return <AccountStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 1:
        return <StatePackageStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 2:
        return <BusinessInfoStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 3:
        console.log("[v0] Checkout - rendering OwnerInfoStep")
        return <OwnerInfoStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 4:
        console.log("[v0] Checkout - rendering ReviewStep")
        console.log("[v0] Checkout - ReviewStep props - data:", data)
        console.log("[v0] Checkout - ReviewStep props - updateData type:", typeof updateData)
        return <ReviewStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 5:
        return <PaymentStep data={data} onBack={prevStep} />
      default:
        return null
    }
  }

  return (
    <CheckoutShell steps={STEPS} currentStep={currentStep} data={data}>
      {renderStep()}
    </CheckoutShell>
  )
}
