"use client"

import { useState, useEffect } from "react"
import { CheckoutShell } from "@/components/checkout/checkout-shell"
import { AccountStep } from "@/components/checkout/account-step"
import { StatePackageStep } from "@/components/checkout/state-package-step"
import { BusinessInfoStep } from "@/components/checkout/business-info-step"
import { OwnerInfoStep } from "@/components/checkout/owner-info-step"
import { ReviewStep } from "@/components/checkout/review-step"
import { PaymentStep } from "@/components/checkout/payment-step"
import {
  saveCheckoutData,
  getCheckoutData,
  initCheckoutData,
  saveCheckoutStep,
  getSavedStep,
} from "@/lib/checkout-storage"
import { authService } from "@/lib/auth"

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
  country?: string
  zip?: string
  dateOfBirth?: string
  ssn?: string
  isResponsiblePerson?: boolean
  needsItin?: boolean
  itinAdded?: boolean
  passportFile?: File | null
  passportKey?: string
  passportUrl?: string
  passportId?: string
  passportIndexedDBId?: string // Added IndexedDB ID field
  // Legacy fields
  name?: string
}

export type CheckoutData = {
  // Account
  email: string
  password: string
  phone: string
  name: string
  userId?: string
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
  addons: any[] // Changed from string[] to any[] to support full addon objects
  // Upsells
  upsells: string[]
  // Pricing
  totalAmount?: number
  packagePrice?: number
  stateFilingFee?: number
  addonsTotal?: number
}

const STEPS = ["Account", "State & Package", "Business Info", "Owner Info", "Review", "Payment"]

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState<CheckoutData>({
    email: "",
    password: "",
    phone: "",
    name: "",
    userId: undefined,
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
        country: "US",
        zip: "",
        ssn: "",
        dateOfBirth: "",
        isResponsiblePerson: true,
        needsItin: false,
        itinAdded: false,
        passportFile: null,
        passportKey: undefined,
        passportUrl: undefined,
        passportId: undefined,
        passportIndexedDBId: undefined,
      },
    ],
    addons: [],
    upsells: [],
    totalAmount: undefined,
    packagePrice: undefined,
    stateFilingFee: undefined,
    addonsTotal: undefined,
  })

  useEffect(() => {
    initCheckoutData()
    const savedData = getCheckoutData()
    const savedStep = getSavedStep()

    const isAuthenticated = authService.isAuthenticated()
    const currentUser = authService.getCurrentUser()

    setIsAuthenticated(isAuthenticated)

    if (savedStep !== null && savedStep >= 0) {
      setCurrentStep(savedStep)
    } else {
      setCurrentStep(0)
      saveCheckoutStep(0)
    }

    if (isAuthenticated && currentUser) {
      // Pre-fill user data from authenticated session
      if (savedData) {
        const savedMembers = Array.isArray(savedData.members)
          ? savedData.members.filter((m): m is NonNullable<typeof m> => m != null && typeof m === "object")
          : []

        setData({
          email: savedData.account?.email || currentUser.email,
          password: savedData.account?.password || "",
          phone: savedData.account?.phone || "",
          name: savedData.account?.name || currentUser.name,
          userId: savedData.account?.userId || currentUser.id,
          state: savedData.state?.state || "",
          entityType: savedData.state?.entityType || "",
          packageType: savedData.state?.packageType || "",
          businessName: savedData.businessInfo?.businessName || "",
          businessAddress: "",
          businessCity: "",
          businessZip: "",
          businessWebsite: "",
          businessCategory: savedData.businessInfo?.businessCategory || "",
          businessDescription: savedData.businessInfo?.businessDescription || "",
          needsResellerCertificate: savedData.businessInfo?.needsResellerCertificate || false,
          members:
            savedMembers.length > 0
              ? savedMembers.map((m) => ({
                  id: m.id || crypto.randomUUID(),
                  name: m.name || "",
                  firstName: m.firstName || "",
                  middleName: m.middleName || "",
                  lastName: m.lastName || "",
                  email: m.email || "",
                  phone: m.phone || "",
                  address: m.address || "",
                  city: m.city || "",
                  state: m.state || "",
                  country: m.country || "US",
                  zip: m.zip || "",
                  ssn: m.ssn || "",
                  dateOfBirth: m.dateOfBirth || "",
                  isResponsiblePerson: m.isResponsiblePerson || false,
                  needsItin: false,
                  itinAdded: m.itinAdded || false,
                  passportFile: null,
                  passportKey: m.passportKey,
                  passportUrl: m.passportUrl,
                  passportId: m.passportId,
                  passportIndexedDBId: m.passportIndexedDBId,
                }))
              : [
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
                    country: "US",
                    zip: "",
                    ssn: "",
                    dateOfBirth: "",
                    isResponsiblePerson: true,
                    needsItin: false,
                    itinAdded: false,
                    passportFile: null,
                    passportKey: undefined,
                    passportUrl: undefined,
                    passportId: undefined,
                    passportIndexedDBId: undefined,
                  },
                ],
          addons: savedData.addons || [],
          upsells: [],
          totalAmount: savedData.totalAmount,
          packagePrice: savedData.packagePrice,
          stateFilingFee: savedData.stateFilingFee,
          addonsTotal: savedData.addonsTotal,
        })
      } else {
        setData((prev) => ({
          ...prev,
          email: currentUser.email,
          name: currentUser.name,
          userId: currentUser.id,
        }))
      }
    } else {
      if (savedData) {
        const savedMembers = Array.isArray(savedData.members)
          ? savedData.members.filter((m): m is NonNullable<typeof m> => m != null && typeof m === "object")
          : []

        setData({
          email: savedData.account?.email || "",
          password: savedData.account?.password || "",
          phone: savedData.account?.phone || "",
          name: savedData.account?.name || "",
          userId: savedData.account?.userId,
          state: savedData.state?.state || "",
          entityType: savedData.state?.entityType || "",
          packageType: savedData.state?.packageType || "",
          businessName: savedData.businessInfo?.businessName || "",
          businessAddress: "",
          businessCity: "",
          businessZip: "",
          businessWebsite: "",
          businessCategory: savedData.businessInfo?.businessCategory || "",
          businessDescription: savedData.businessInfo?.businessDescription || "",
          needsResellerCertificate: savedData.businessInfo?.needsResellerCertificate || false,
          members:
            savedMembers.length > 0
              ? savedMembers.map((m) => ({
                  ...m,
                  id: m.id || crypto.randomUUID(),
                }))
              : [
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
                    country: "US",
                    zip: "",
                    ssn: "",
                    dateOfBirth: "",
                    isResponsiblePerson: true,
                    needsItin: false,
                    itinAdded: false,
                    passportFile: null,
                    passportKey: undefined,
                    passportUrl: undefined,
                    passportId: undefined,
                    passportIndexedDBId: undefined,
                  },
                ],
          addons: savedData.addons || [],
          upsells: [],
          totalAmount: savedData.totalAmount,
          packagePrice: savedData.packagePrice,
          stateFilingFee: savedData.stateFilingFee,
          addonsTotal: savedData.addonsTotal,
        })
      }
    }
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated()
      setIsAuthenticated(isAuth)
    }

    // Initial check
    checkAuth()

    // Listen for storage events (if user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        checkAuth()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, []) // Removed race condition: useEffect with currentStep dependency caused stale state

  const updateData = (updates: Partial<CheckoutData>) => {
    setData((prev) => {
      const newData = { ...prev, ...updates }

      const validMembers = Array.isArray(newData.members)
        ? newData.members
            .filter((m): m is NonNullable<typeof m> => m != null && typeof m === "object")
            .map((m) => ({
              ...m,
              id: m.id || crypto.randomUUID(),
            }))
        : []

      // Ensure at least one member exists
      const finalMembers =
        validMembers.length > 0
          ? validMembers
          : [
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
                country: "US",
                zip: "",
                ssn: "",
                dateOfBirth: "",
                isResponsiblePerson: true,
                needsItin: false,
                itinAdded: false,
                passportFile: null,
                passportKey: undefined,
                passportUrl: undefined,
                passportId: undefined,
                passportIndexedDBId: undefined,
              },
            ]

      try {
        saveCheckoutData({
          account: {
            email: newData.email,
            password: newData.password,
            phone: newData.phone || "",
            name: newData.name || "",
            userId: newData.userId,
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
          members: finalMembers.map((m) => ({
            id: m.id,
            name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim(),
            firstName: m.firstName || "",
            middleName: m.middleName || "",
            lastName: m.lastName || "",
            email: m.email || "",
            phone: m.phone || "",
            address: m.address || "",
            city: m.city || "",
            state: m.state || "",
            country: m.country || "US",
            zip: m.zip || "",
            ssn: m.ssn || "",
            dateOfBirth: m.dateOfBirth || "",
            isResponsiblePerson: m.isResponsiblePerson || false,
            itinAdded: m.itinAdded || false,
            passportKey: m.passportKey,
            passportUrl: m.passportUrl,
            passportId: m.passportId,
            passportIndexedDBId: m.passportIndexedDBId,
          })),
          addons: newData.addons || [],
          orderId: getCheckoutData()?.orderId || `ORD-${Date.now()}`,
          createdAt: getCheckoutData()?.createdAt || new Date().toISOString(),
          status: "draft",
          payment: {
            method: "bank-transfer",
            status: "pending",
          },
          totalAmount: newData.totalAmount,
          packagePrice: newData.packagePrice,
          stateFilingFee: newData.stateFilingFee,
          addonsTotal: newData.addonsTotal,
        })
      } catch (saveError) {
        console.error("Error saving checkout data:", saveError)
      }

      return { ...newData, members: finalMembers }
    })

    if (updates.userId || updates.email) {
      const isAuth = authService.isAuthenticated()
      setIsAuthenticated(isAuth)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step)
      saveCheckoutStep(step)
      window.scrollTo(0, 0)
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      saveCheckoutStep(newStep)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      saveCheckoutStep(newStep)
      window.scrollTo(0, 0)
    }
  }

  const handlePaymentSubmit = async (orderData: any) => {
    // This function is a placeholder - all logic is in PaymentStep component
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
