"use client"

import type React from "react"
import { Check, Menu, X, Save } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { CheckoutData } from "@/app/checkout/page"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { saveProgress } from "@/lib/checkout-storage"

type CheckoutShellProps = {
  steps: string[]
  currentStep: number
  data: CheckoutData
  children: React.ReactNode
  isAuthenticated?: boolean
  originalStep?: number
}

export function CheckoutShell({
  steps,
  currentStep,
  data,
  children,
  isAuthenticated = false,
  originalStep = 0,
}: CheckoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>("")

  const stepDescriptions = [
    "Create Your Account",
    "Choose Your State & Package",
    "Peace of Mind From Formation to Filing",
    "Who's Behind the Business?",
    "Review Your Order",
    "Complete Your Payment",
  ]

  const handleSaveProgress = () => {
    const result = saveProgress()
    setSaveMessage(result.message)

    setTimeout(() => {
      setSaveMessage("")
    }, 3000)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen z-50
          w-72 lg:w-80 xl:w-96 flex-shrink-0
          bg-gradient-to-r from-[#880000] to-[#ff0d13]
          text-white shadow-2xl
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 lg:p-8">
          <Link href="/" className="block mb-10">
            <Image
              src="/images/buzz-filing-logo-white.png"
              alt="BuzzFiling"
              width={300}
              height={120}
              className="w-48 lg:w-56 xl:w-64 h-auto"
              priority
            />
          </Link>

          <div className="space-y-5 lg:space-y-6">
            {steps.map((step, index) => {
              const isCurrentStep = index === currentStep
              const isPastStep = index < currentStep

              return (
                <div
                  key={step}
                  className={`transition-all duration-300 ${
                    isCurrentStep
                      ? "opacity-100 scale-100"
                      : isPastStep
                        ? "opacity-90 scale-[0.98]"
                        : "opacity-60 scale-95"
                  }`}
                >
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div
                      className={`w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base transition-all duration-300 ${
                        isPastStep
                          ? "bg-white/25 text-white backdrop-blur-sm"
                          : isCurrentStep
                            ? "bg-white text-[#ff0d13] ring-4 ring-white/40 shadow-xl scale-110"
                            : "bg-white/10 text-white/60 backdrop-blur-sm"
                      }`}
                      aria-current={isCurrentStep ? "step" : undefined}
                    >
                      {isPastStep ? <Check className="w-5 h-5 lg:w-6 lg:h-6 text-white" /> : index + 1}
                    </div>

                    <div className="flex-1 pt-0.5 min-w-0">
                      <h3
                        className={`font-semibold text-base lg:text-lg mb-1 transition-colors duration-300 ${
                          isCurrentStep ? "text-white" : isPastStep ? "text-white/95" : "text-white/60"
                        }`}
                      >
                        {step}
                      </h3>
                      <p
                        className={`text-sm lg:text-base leading-relaxed transition-colors duration-300 ${
                          isCurrentStep ? "text-white/95" : "text-white/75"
                        }`}
                      >
                        {stepDescriptions[index]}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto">
        <div
          className="lg:hidden sticky top-0 z-30 
            h-16 px-4
            flex items-center justify-between 
            bg-white border-b border-gray-200"
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center w-11 h-11 rounded-xl 
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
              className="w-36 sm:w-40 h-auto"
              priority
            />
          </Link>

          <div className="w-11" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full">
          <div className="max-w-6xl mx-auto w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
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
          </div>
        </main>
      </div>
    </div>
  )
}
