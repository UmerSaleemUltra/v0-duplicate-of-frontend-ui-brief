"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Upload, Building2, MessageSquare, X } from "lucide-react"
import { packagePricing } from "@/lib/pricing"
import { STATE_FEES } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"
import { getCheckoutData, saveCheckoutData } from "@/lib/checkout-storage"
import { authService } from "@/lib/auth"

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

function truncateFilename(filename: string, maxLength = 20): string {
  const words = filename.split(" ")
  let truncatedFilename = ""
  let currentLength = 0

  for (const word of words) {
    if (currentLength + word.length + 1 > maxLength) {
      break
    }
    truncatedFilename += word + " "
    currentLength += word.length + 1
  }

  return truncatedFilename.trim() + (truncatedFilename !== filename ? "..." : "")
}

function PaymentStep({ data, onBack, onSubmit }: PaymentStepProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "already_paid">("already_paid")
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string>("")
  const [pkrRate, setPkrRate] = useState<number | null>(null)
  const [isLoadingRate, setIsLoadingRate] = useState(true)
  const [showValidationError, setShowValidationError] = useState(false)
  const [errors, setErrors] = useState({ whatsappNumber: "", submit: "" })

  useEffect(() => {
    const savedData = getCheckoutData()
    const hasCheckoutData = savedData && savedData.account?.email

    if (!hasCheckoutData) {
      toast({
        title: "Authentication Required",
        description: "Please complete the account step first before proceeding to payment.",
        variant: "destructive",
      })
      setTimeout(() => {
        window.location.href = "/checkout"
      }, 1500)
    }
  }, [toast])

  useEffect(() => {
    async function convertUSDtoPKR() {
      try {
        const response = await fetch("/api/exchange-rate")
        const data = await response.json()

        if (data.success && data.rate) {
          return data.rate
        } else {
          throw new Error("Currency conversion failed")
        }
      } catch (error) {
        console.log("Error converting USD to PKR:", error)
        return null
      }
    }

    convertUSDtoPKR()
      .then((rate) => {
        if (rate) {
          setPkrRate(rate)
        }
        setIsLoadingRate(false)
      })
      .catch(() => {
        setIsLoadingRate(false)
      })
  }, [])

  const getAddonName = (addon: any) => {
    if (!addon) return "Unknown Add-on"

    if (addon.serviceId === "itin" && addon.memberName) {
      return `ITIN Application - ${addon.memberName}`
    }

    return addon.name || addon.serviceName || "Add-on"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({ whatsappNumber: "", submit: "" })
    setIsSubmitting(true)

    try {
      console.log("[v0] === STARTING CHECKOUT FLOW ===")
      console.log("[v0] Step 1: Validating payment information...")

      if (paymentMethod === "already_paid") {
        if (!whatsappPhone.trim()) {
          setErrors({ whatsappNumber: "Please provide your phone number to proceed", submit: "" })
          setShowValidationError(true)
          console.log("❌ Validation failed: WhatsApp phone number is required")
          return
        }
        const phoneDigits = whatsappPhone.replace(/\D/g, "")
        if (phoneDigits.length < 10) {
          setErrors({ whatsappNumber: "Please enter a valid phone number with at least 10 digits", submit: "" })
          setShowValidationError(true)
          console.log("❌ Validation failed: Invalid phone number format")
          return
        }
      } else {
        if (!receiptUrl) {
          setShowValidationError(true)
          console.log("❌ Validation failed: Payment receipt is required")
          return
        }
      }

      console.log("[v0] ✅ Payment information validated")
      setShowValidationError(false)

      console.log("\n[v0] === PAYMENT SUBMISSION START ===")
      console.log("[v0] Checkout data:", data)

      let token = authService.getToken()
      let currentUser = authService.getUser()

      console.log("[v0] Initial auth check - Token exists:", !!token, "User exists:", !!currentUser)

      // Fallback 1: Try to get user from localStorage directly (mobile browsers might have cleared cookies)
      if (!currentUser) {
        console.log("[v0] Attempting fallback 1: Check localStorage for user data...")
        try {
          const storedUserData = localStorage.getItem("auth_user")
          if (storedUserData) {
            const parsedUser = JSON.parse(decodeURIComponent(storedUserData))
            console.log("[v0] ✅ Found user in localStorage:", parsedUser)
            currentUser = parsedUser
          }
        } catch (e) {
          console.log("[v0] Could not parse user from localStorage")
        }
      }

      // Fallback 2: Try to get userId from checkout data
      if (!currentUser && data.userId) {
        console.log("[v0] Attempting fallback 2: Using userId from checkout data:", data.userId)
        currentUser = {
          id: data.userId,
          email: data.email || "",
          name: data.firstName || data.name || "",
          role: "client" as const,
        }
      }

      // Fallback 3: Decode token manually to extract userId (for mobile)
      if (!currentUser && token) {
        console.log("[v0] Attempting fallback 3: Decode token to extract userId...")
        try {
          const tokenParts = token.split(".")
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            console.log("[v0] Decoded token payload:", payload)
            if (payload.userId || payload.id) {
              currentUser = {
                id: payload.userId || payload.id,
                email: payload.email || data.email || "",
                name: payload.name || data.firstName || "",
                role: "client" as const,
              }
              console.log("[v0] ✅ Extracted user from token:", currentUser)
            }
          }
        } catch (e) {
          console.log("[v0] Could not decode token:", e)
        }
      }

      if (!token) {
        console.log("\n[v0] === STEP 1: CREATING ACCOUNT ===")
        console.log("[v0] No existing token found, creating new account...")

        if (!data.email || !data.password) {
          throw new Error("Email and password are required to create an account")
        }

        try {
          const signupResponse = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
              name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.email,
              phone: data.phone || "",
            }),
          })

          const signupResult = await signupResponse.json()

          if (!signupResponse.ok) {
            if (signupResult.error && signupResult.error.toLowerCase().includes("already exists")) {
              console.log("[v0] Email already exists, attempting login...")

              const loginResponse = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: data.email,
                  password: data.password,
                }),
              })

              const loginResult = await loginResponse.json()

              if (!loginResponse.ok) {
                throw new Error("Email already exists. Please use the correct password or reset your password.")
              }

              console.log("[v0] ✅ Logged in successfully with existing account")
              console.log("[v0] User ID:", loginResult.userId || loginResult.data?.userId)
              console.log("[v0] Token received:", loginResult.token || loginResult.data?.token ? "Yes" : "No")

              const userId = loginResult.userId || loginResult.data?.userId
              const userToken = loginResult.token || loginResult.data?.token
              const userEmail = loginResult.email || loginResult.data?.user?.email || data.email
              const userName = loginResult.name || loginResult.data?.user?.name || data.firstName

              authService.setAuth(userToken, {
                id: userId,
                email: userEmail,
                name: userName,
                role: "client",
              })

              localStorage.setItem(
                "auth_user",
                encodeURIComponent(
                  JSON.stringify({
                    id: userId,
                    email: userEmail,
                    name: userName,
                    role: "client",
                  }),
                ),
              )

              data.userId = userId
              token = userToken
              currentUser = authService.getUser()

              saveCheckoutData(data)
            } else {
              console.error("[v0] ❌ Account creation failed:", signupResult)
              throw new Error(signupResult.error || "Failed to create account")
            }
          } else {
            console.log("[v0] ✅ Account created successfully")
            console.log("[v0] User ID:", signupResult.userId)
            console.log("[v0] Token received:", signupResult.token ? "Yes" : "No")

            authService.setAuth(signupResult.token, {
              id: signupResult.userId,
              email: signupResult.email,
              name: signupResult.name,
              role: "client",
            })

            localStorage.setItem(
              "auth_user",
              encodeURIComponent(
                JSON.stringify({
                  id: signupResult.userId,
                  email: signupResult.email,
                  name: signupResult.name,
                  role: "client",
                }),
              ),
            )

            data.userId = signupResult.userId
            token = signupResult.token
            currentUser = authService.getUser()

            saveCheckoutData(data)
          }
        } catch (accountError) {
          console.error("[v0] ❌ Account setup error:", accountError)
          throw accountError
        }
      } else {
        console.log("[v0] ✅ User already authenticated with token")
        if (!data.userId && currentUser?.id) {
          console.log("[v0] Setting userId from authenticated user:", currentUser.id)
          data.userId = currentUser.id
          saveCheckoutData(data)
        }
      }

      if (!data.userId) {
        console.log("[v0] No userId in data, attempting all fallback methods...")

        // Try fallback 1: authService
        if (currentUser?.id) {
          console.log("[v0] ✅ Fallback 1: Using userId from authService:", currentUser.id)
          data.userId = currentUser.id
          saveCheckoutData(data)
        }
        // Try fallback 2: localStorage
        else {
          try {
            const storedUserData = localStorage.getItem("auth_user")
            if (storedUserData) {
              const parsedUser = JSON.parse(decodeURIComponent(storedUserData))
              if (parsedUser?.id) {
                console.log("[v0] ✅ Fallback 2: Using userId from localStorage:", parsedUser.id)
                data.userId = parsedUser.id
                currentUser = parsedUser
                saveCheckoutData(data)
              }
            }
          } catch (e) {
            console.log("[v0] Could not retrieve user from localStorage")
          }
        }

        // Try fallback 3: decode token
        if (!data.userId && token) {
          try {
            const tokenParts = token.split(".")
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]))
              const userId = payload.userId || payload.id
              if (userId) {
                console.log("[v0] ✅ Fallback 3: Using userId from token decode:", userId)
                data.userId = userId
                saveCheckoutData(data)
              }
            }
          } catch (e) {
            console.log("[v0] Could not decode token for userId")
          }
        }

        // Final check
        if (!data.userId) {
          console.error("[v0] ❌ CRITICAL: No userId found after all fallback attempts")
          console.error("[v0] Debug info:")
          console.error("  - data.userId:", data.userId)
          console.error("  - currentUser:", currentUser)
          console.error("  - token exists:", !!token)
          console.error("  - authService.getUser():", authService.getUser())
          console.error("  - localStorage auth_user:", localStorage.getItem("auth_user"))

          throw new Error("User ID is missing - authentication may have failed. Please refresh the page and try again.")
        }
      }

      console.log("[v0] ✅ Proceeding with userId:", data.userId)

      console.log("\n[v0] === STEP 2: UPLOADING PASSPORTS ===")
      console.log(`[v0] Found ${data.members?.length || 0} members to process`)

      const { uploadPassportsFromIndexedDB } = await import("@/lib/upload-passports-from-indexeddb")

      let updatedMembers
      try {
        updatedMembers = await uploadPassportsFromIndexedDB(data.members || [], data.userId, "")
        console.log("[v0] ✅ All passports uploaded successfully")
        console.log("[v0] Updated members with passport URLs:", updatedMembers)
      } catch (uploadError) {
        console.error("[v0] ❌ Passport upload error:", uploadError)
        throw uploadError
      }

      console.log("\n[v0] === STEP 3: CREATING COMPANY ===")
      console.log("[v0] Company details:", {
        name: data.businessName,
        type: data.entityType,
        state: data.state,
        packageType: data.packageType,
        membersCount: updatedMembers.length,
      })

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
          address: {
            street: data.businessAddress,
            city: data.businessCity,
            state: data.state,
            zip: data.businessZip,
          },
          businessCategory: data.businessCategory || "",
          businessDescription: data.businessDescription || "",
          businessWebsite: data.businessWebsite || "",
          packageType: data.packageType,
          members: updatedMembers,
          purchasedAddons: data.addons || [],
        }),
      })

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json()
        console.log("❌ Company creation failed:", errorData.error)
        throw new Error(errorData.error || "Failed to create company")
      }

      const companyResult = await companyResponse.json()
      const companyId = companyResult.data.id
      console.log("✅ Company created successfully with ID:", companyId)

      console.log("Updating members with company ID...")
      const finalMembers = await uploadPassportsFromIndexedDB(data.members || [], data.userId || "", companyId)
      console.log("✅ Members updated with company association")

      console.log("\n=== STEP 4: CREATING ORDER ===")

      const packagePrice = packagePricing[data.packageType as keyof typeof packagePricing] || 149
      const stateFilingFee = STATE_FEES[data.state as keyof typeof STATE_FEES] || 0
      const packageWithStateFee = packagePrice + stateFilingFee
      const addonsTotal =
        data.addonsTotal ||
        (Array.isArray(data.addons) ? data.addons.reduce((sum: number, addon: any) => sum + (addon.price || 0), 0) : 0)
      const totalAmount = packageWithStateFee + addonsTotal

      console.log("Order pricing:", {
        packagePrice,
        stateFilingFee,
        addonsTotal,
        totalAmount,
      })

      const orderData = {
        companyId: companyId,
        companyName: data.businessName,
        type: `${data.entityType.toUpperCase()} Formation`,
        amount: totalAmount,
        total: totalAmount,
        packagePrice: packagePrice,
        packageType: data.packageType,
        stateFilingFee: stateFilingFee,
        addonsTotal: addonsTotal,
        items: [
          {
            name: `${data.state} ${data.packageType === "starter" ? "Starter" : "Advance"} Package`,
            price: packageWithStateFee,
            quantity: 1,
          },
        ],
        purchasedAddons: data.addons || [],
        paymentMethod: paymentMethod,
        whatsappPhone: whatsappPhone ? (whatsappPhone.startsWith("+") ? whatsappPhone : `+${whatsappPhone}`) : null,
        receiptUrl: receiptUrl || null,
        members: finalMembers,
      }

      console.log("Creating order with data:", orderData)

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        console.log("❌ Order creation failed:", errorData.error)
        throw new Error(errorData.error || "Failed to create order")
      }

      const orderResult = await orderResponse.json()
      console.log("✅ Order created successfully:", orderResult)

      console.log("\n=== CLEANING UP ===")
      console.log("Clearing checkout data from localStorage...")
      localStorage.removeItem("checkoutData")
      localStorage.removeItem("checkoutStep")
      console.log("✅ Checkout data cleared")

      console.log("\n=== CHECKOUT COMPLETED SUCCESSFULLY ===")
      console.log("Redirecting to dashboard...")

      window.location.href = "/client/dashboard"
    } catch (error) {
      console.error("[v0] ❌ Payment submission error:", error)
      setErrors({ whatsappNumber: "", submit: error instanceof Error ? error.message : "Failed to process payment" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappPhone(e.target.value)
    setErrors({ whatsappNumber: "", submit: "" })
    setShowValidationError(false)
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
    setReceiptUrl(null)
    setUploadError("")
  }

  const packagePrice = packagePricing[data.packageType as keyof typeof packagePricing] || 149
  const stateFilingFee = STATE_FEES[data.state as keyof typeof STATE_FEES] || 0
  const packageWithStateFee = packagePrice + stateFilingFee
  const addonsTotal =
    data.addonsTotal ||
    (Array.isArray(data.addons) ? data.addons.reduce((sum: number, addon: any) => sum + (addon.price || 0), 0) : 0)
  const totalAmount = packageWithStateFee + addonsTotal

  const isPaymentValid = paymentMethod === "already_paid" ? whatsappPhone.trim() !== "" : receiptUrl !== ""

  const getValidationMessage = () => {
    if (paymentMethod === "already_paid") {
      if (!whatsappPhone.trim()) {
        return "Please provide your phone number to proceed"
      }
    } else {
      if (!receiptUrl) {
        return "Please upload a payment receipt to proceed"
      }
    }
    return ""
  }

  const calculateTotal = () => {
    return totalAmount.toFixed(2)
  }

  const PKR_RATE = pkrRate || 1

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 pb-6 md:pb-10">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Complete Payment</h1>
        <p className="text-sm md:text-base text-slate-700 leading-relaxed">
          Choose a payment option below to continue your business setup.
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        <h2 className="text-sm md:text-base font-semibold text-slate-900">Select Payment Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("already_paid")}
            className={`relative p-4 md:p-5 rounded-lg border-2 transition-all text-left cursor-pointer ${
              paymentMethod === "already_paid"
                ? "border-[#ff0d13] bg-red-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {paymentMethod === "already_paid" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Already Paid</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  Partial payment made / will be made via WhatsApp
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`relative p-4 md:p-5 rounded-lg border-2 transition-all text-left cursor-pointer ${
              paymentMethod === "bank_transfer"
                ? "border-[#ff0d13] bg-red-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {paymentMethod === "bank_transfer" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Make Payment</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  View bank details, make payment, and upload receipt
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">Payment Summary</h3>
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-4 py-2 md:py-2.5 border-b border-slate-200">
            <span className="text-sm md:text-base text-slate-700 leading-relaxed">
              {data.state} {data.packageType === "starter" ? "Starter" : "Advance"} Package
            </span>
            <div className="text-right flex-shrink-0">
              <span className="font-semibold text-slate-900 text-sm md:text-base">
                ${packageWithStateFee.toFixed(2)}
              </span>
              {pkrRate && (
                <p className="text-xs md:text-sm text-slate-500">
                  {Math.round(packageWithStateFee * pkrRate).toLocaleString()} PKR
                </p>
              )}
            </div>
          </div>

          {data.addons && data.addons.length > 0 ? (
            data.addons.map((addon: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 py-2 md:py-2.5 border-b border-slate-200"
              >
                <span className="text-sm md:text-base text-slate-700 leading-relaxed break-words">
                  {getAddonName(addon)}
                </span>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-slate-900 text-sm md:text-base">${addon.price || 0}</span>
                  {pkrRate && addon.price && (
                    <p className="text-xs md:text-sm text-slate-500">
                      {Math.round(addon.price * pkrRate).toLocaleString()} PKR
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : addonsTotal > 0 ? (
            <div className="flex items-center justify-between gap-4 py-2 md:py-2.5 border-b border-slate-200">
              <span className="text-sm md:text-base text-slate-700">Add-ons</span>
              <div className="text-right flex-shrink-0">
                <span className="font-semibold text-slate-900 text-sm md:text-base">${addonsTotal.toFixed(2)}</span>
                {pkrRate && (
                  <p className="text-xs md:text-sm text-slate-500">
                    {Math.round(Number.parseFloat(calculateTotal()) * PKR_RATE).toLocaleString()} PKR
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm md:text-base font-semibold text-slate-900">Total Amount</p>
              </div>
              <div className="text-right">
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">${calculateTotal()}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                  {Math.round(Number.parseFloat(calculateTotal()) * PKR_RATE).toLocaleString()} PKR
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {paymentMethod === "bank_transfer" && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 mb-1 text-sm md:text-base">Bank Account Details</h4>
              <p className="text-xs md:text-sm text-slate-600 break-words">
                Please use these details to complete your payment
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 md:p-5 border border-slate-200 space-y-3 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200 overflow-hidden">
              <span className="text-xs md:text-sm text-slate-600 flex-shrink-0">Bank Name</span>
              <span className="font-semibold text-slate-900 text-sm md:text-base break-words">
                United Bank Limited (UBL)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200 overflow-hidden">
              <span className="text-xs md:text-sm text-slate-600 flex-shrink-0">Account Title</span>
              <span className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base break-all">
                BUZZ FILING
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200 overflow-hidden">
              <span className="text-xs md:text-sm text-slate-600 flex-shrink-0">Account Number</span>
              <span className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base break-all">
                1176314943776
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 overflow-hidden">
              <span className="text-xs md:text-sm text-slate-600 flex-shrink-0">IBAN</span>
              <span className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base break-all">
                PK22UNIL0109000314943776
              </span>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 sm:gap-3 overflow-hidden">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="text-xs sm:text-sm flex-1 min-w-0">
              <p className="text-red-900 break-words leading-relaxed">
                <span className="font-semibold">Important:</span> After making the payment, please upload a screenshot
                with transaction details. This helps us process your order faster.
              </p>
            </div>
          </div>

          <div className="space-y-2 overflow-hidden">
            <Label htmlFor="receipt-upload" className="text-sm font-semibold text-slate-900">
              Upload Payment Receipt
            </Label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReceiptUpload}
                  disabled={isUploadingReceipt || !!receiptFile}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-upload"
                  className={`flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                    isUploadingReceipt || receiptFile
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white cursor-pointer hover:from-[#990000] hover:to-[#ff1a1a]"
                  }`}
                >
                  {isUploadingReceipt ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span className="hidden sm:inline">Uploading...</span>
                      <span className="sm:hidden">Upload...</span>
                    </>
                  ) : receiptFile ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Receipt Uploaded</span>
                      <span className="sm:hidden">Uploaded</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Choose Receipt File</span>
                      <span className="sm:hidden">Choose File</span>
                    </>
                  )}
                </label>
              </div>

              {receiptFile?.name && (
                <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-green-700 truncate" title={receiptFile.name}>
                      {truncateFilename(receiptFile.name, 15)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="text-red-600 hover:text-red-700 flex-shrink-0 p-1"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs sm:text-sm text-red-600 break-words leading-relaxed">{uploadError}</p>
              )}

              <p className="text-xs text-slate-500 break-words leading-relaxed">
                Supported formats: PNG, JPG, WEBP (max. 5MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "already_paid" && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 mb-1 text-sm md:text-base">Contact Information</h4>
              <p className="text-xs md:text-sm text-slate-600 break-words leading-relaxed">
                Please provide your Whatsapp number to confirm your order
              </p>
            </div>
          </div>

          <div className="space-y-2 overflow-hidden">
            <Label htmlFor="whatsapp-phone" className="text-sm font-medium text-slate-900">
              Phone Number (WhatsApp)
            </Label>
            <Input
              id="whatsapp-phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={whatsappPhone}
              onChange={handlePhoneChange}
              className="h-11 text-sm md:text-base w-full"
            />
            {errors.whatsappNumber && (
              <p className="text-xs text-red-600 break-words leading-relaxed">{errors.whatsappNumber}</p>
            )}
            <p className="text-xs text-slate-500 break-words leading-relaxed">
              We'll contact you on WhatsApp to process your order
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-slate-300 hover:bg-slate-50 bg-white text-slate-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || !isPaymentValid}
          className="w-full sm:w-auto h-12 px-10 text-base bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#990000] hover:to-[#ff1a1a] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full mr-2" />
              Processing...
            </>
          ) : (
            <>
              Complete Payment
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {showValidationError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 overflow-hidden">
          <p className="text-sm text-red-600 break-words leading-relaxed">{getValidationMessage()}</p>
        </div>
      )}

      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 overflow-hidden">
          <p className="text-sm text-red-600 break-words leading-relaxed">{errors.submit}</p>
        </div>
      )}
    </form>
  )
}

export default PaymentStep
export { PaymentStep }
