"use client"

import type React from "react"
import { Check, Menu, X, Save } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { CheckoutData } from "@/app/checkout/page"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { saveProgress } from "@/lib/checkout-storage"
import { enableCheckoutPush } from "@/lib/push-notifications"

type CheckoutShellProps = {
  steps: string[]
  currentStep: number
  data: CheckoutData
  children: React.ReactNode
  isAuthenticated?: boolean
  originalStep?: number
}

// Generate or retrieve session ID for tracking
const getSessionId = (): string => {
  if (typeof window === "undefined") return ""
  let sessionId = sessionStorage.getItem("checkout_session_id")
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    sessionStorage.setItem("checkout_session_id", sessionId)
  }
  return sessionId
}

export function CheckoutShell({ steps, currentStep, data, children }: CheckoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>("")

  // Track abandoned checkout progress
  useEffect(() => {
    const trackAbandonedCheckout = async () => {
      // Only track if user has entered some data
      if (!data.email && !data.state && !data.businessName) return
      
      const sessionId = getSessionId()
      if (!sessionId) return

      try {
        await fetch("/api/abandoned-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            email: data.email || null,
            name: data.name || null,
            phone: data.phone || null,
            lastStep: currentStep,
            state: data.state || null,
            packageType: data.packageType || null,
            businessName: data.businessName || null,
            estimatedTotal: data.totalAmount || 0,
            packagePrice: data.packagePrice || 0,
            addons: data.addons || []
          })
        })
      } catch (error) {
        // Silent fail - don't interrupt checkout
        console.error("Failed to track checkout progress:", error)
      }
    }

    // Debounce tracking to avoid too many requests
    const timeoutId = setTimeout(trackAbandonedCheckout, 2000)
    return () => clearTimeout(timeoutId)
  }, [currentStep, data.email, data.state, data.businessName, data.totalAmount, data.packagePrice, data.name, data.phone, data.packageType, data.addons])

  useEffect(() => {
    // Clear save message when step changes
    if (saveMessage) {
      setSaveMessage("")
    }
  }, [currentStep, data, saveMessage])

  const stepDescriptions = [
    "Create Your Account",
    "Choose Your State & Package",
    "Peace of Mind From Formation to Filing",
    "Who's Behind the Business?",
    "Review Your Order",
    "Complete Your Payment",
  ]

  const handleSaveProgress = () => {
    console.log(" Checkout: Saving progress at step:", currentStep)
    const result = saveProgress()
    setSaveMessage(result.message)

    setTimeout(() => {
      setSaveMessage("")
    }, 3000)
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar — made narrower */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50
          w-64 sm:w-72 lg:w-64 xl:w-72
          bg-gradient-to-r from-[#880000] to-[#ff0d13]
          text-white shadow-2xl
          transition-transform duration-300 ease-in-out overflow-y-auto scrollbar-hide
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="p-5 sm:p-6 lg:p-7">
          <Link href="/" className="block mb-8 lg:mb-10">
            <Image
              src="/images/buzz-filing-logo-white.png"
              alt="BuzzFiling"
              width={180}
              height={72}
              className="w-[150px] sm:w-[170px] lg:w-[180px] h-auto"
              priority
            />
          </Link>

          <div className="space-y-4 lg:space-y-5">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`transition-all duration-300 ${
                  index === currentStep
                    ? "opacity-100 scale-100"
                    : index < currentStep
                      ? "opacity-90 scale-[0.98]"
                      : "opacity-60 scale-95"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm lg:text-base transition-all duration-300 ${
                      index < currentStep
                        ? "bg-white/25 text-white backdrop-blur-sm"
                        : index === currentStep
                          ? "bg-white text-[#ff0d13] ring-4 ring-white/40 shadow-xl scale-110"
                          : "bg-white/10 text-white/60 backdrop-blur-sm"
                    }`}
                    aria-current={index === currentStep ? "step" : undefined}
                  >
                    {index < currentStep ? <Check className="w-5 h-5 text-white" /> : index + 1}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <h3
                      className={`font-semibold text-sm lg:text-base mb-0.5 transition-colors duration-300 ${
                        index === currentStep ? "text-white" : index < currentStep ? "text-white/95" : "text-white/60"
                      }`}
                    >
                      {step}
                    </h3>
                    <p
                      className={`text-xs lg:text-sm leading-relaxed transition-colors duration-300 ${
                        index === currentStep ? "text-white/95" : "text-white/75"
                      }`}
                    >
                      {stepDescriptions[index]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div
          className="lg:hidden sticky top-0 z-30 
            h-14 sm:h-16 px-4 sm:px-5
            flex items-center justify-between 
            bg-white border-b border-gray-200
            transition-all duration-300 ease-in-out"
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl 
              bg-gradient-to-r from-[#880000] to-[#ff0d13] 
              hover:shadow-lg hover:scale-105 active:scale-95
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-[#ff0d13] focus:ring-offset-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>

          <Link href="/" className="flex items-center" aria-label="Home">
            <Image
              src="/images/buzz-filing-logo.png"
              alt="BuzzFiling"
              width={160}
              height={100}
              className="w-[130px] sm:w-[150px] md:w-[160px] h-auto"
              priority
            />
          </Link>

          <div className="w-10 sm:w-11" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl w-full mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-7 lg:p-8">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSaveProgress} variant="outline" className="gap-2 text-sm bg-transparent">
                <Save className="w-4 h-4" />
                Save Progress
              </Button>
            </div>

            {saveMessage && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">{saveMessage}</p>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
