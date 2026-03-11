"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import StateFeesCalculatorModal from "@/components/modals/state-fees-calculator-modal"
import { useRouter } from "next/navigation"

export default function PricingSection() {
  const [showStarterPlans, setShowStarterPlans] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const router = useRouter()

  const starterFeatures = [
    "Name Check & Clearance",
    "Business Address - 1 Year",
    "Registered Agent - 1 Year",
    "Govt / State Filing Fee",
    "Articles of Incorporation",
    "Business Tax ID (EIN)",
    "U.S. Phone Number",
    "Business Bank Account Setup",
    "Digital Dashboard Access",
  ]

  const advanceUniqueFeatures = [
    "Business Address with Unique Suite",
    "Reseller Certificate / Seller Permit",
    "Dedicated IP VPS - 1 Month",
  ]

  const advanceFeatures = [...advanceUniqueFeatures, ...starterFeatures]

  const handleApplyNowClick = () => {
    setShowCalculator(true)
  }

  return (
    <>
      <section id="pricing" className="w-full flex items-center justify-center px-4 sm:px-6 py-16 md:py-20 lg:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-0 py-2">
                <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Pricing Plans</span>
              </div>
            </div>
            <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-6">
              Transparent plans with no hidden fees or surprises.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
            {/* Starter Package */}
            <div className="flex flex-col">
              {/* Card */}
              <div className="bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8 lg:p-10 mb-6">
                {/* Star Icon */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  >
                    <path
                      d="M24 0L26.8 21.2L48 24L26.8 26.8L24 48L21.2 26.8L0 24L21.2 21.2L24 0Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {/* Title and Price */}
                <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-medium mb-3 sm:mb-4">Starter Package</h3>
                <div className="mb-6 sm:mb-7 md:mb-8">
                  <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">$149</span>
                  <span className="text-white text-lg sm:text-xl md:text-2xl ml-2">+ State Fee</span>
                </div>

                {/* Button */}
                <button
                  onClick={handleApplyNowClick}
                  className="w-full bg-white text-[#ff0d13] rounded-full py-3.5 sm:py-4 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Apply Now
                </button>
              </div>

              {/* Features List */}
              <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
                {starterFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ff0d13] flex items-center justify-center mt-0.5">
                      <svg
                        width="12"
                        height="10"
                        viewBox="0 0 14 11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      >
                        <path
                          d="M1 5.5L5 9.5L13 1.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-[#1A1A1A] text-sm sm:text-base md:text-lg leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advance Package */}
            <div className="flex flex-col">
              {/* Card with curved cutout */}
              <div className="relative bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8 lg:p-10 mb-6 overflow-hidden">
                {/* Asterisk Icon */}
                <div className="mb-4 sm:mb-5 md:mb-6 relative z-10">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  >
                    <path
                      d="M24 0V48M0 24H48M9.37 9.37L38.63 38.63M38.63 9.37L9.37 38.63"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Title and Price */}
                <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-medium mb-3 sm:mb-4 relative z-10">
                  Advance Package
                </h3>
                <div className="mb-6 sm:mb-7 md:mb-8 relative z-10">
                  <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">$249</span>
                  <span className="text-white text-lg sm:text-xl md:text-2xl ml-2">+ State Fee</span>
                </div>

                {/* Button */}
                <button
                  onClick={handleApplyNowClick}
                  className="w-full bg-white text-[#ff0d13] rounded-full py-3.5 sm:py-4 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors relative z-10 cursor-pointer"
                >
                  Apply Now
                </button>
              </div>

              {/* Features List */}
              <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
                {advanceUniqueFeatures.map((feature, index) => (
                  <div key={`unique-${index}`} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ff0d13] flex items-center justify-center mt-0.5">
                      <svg
                        width="12"
                        height="10"
                        viewBox="0 0 14 11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      >
                        <path
                          d="M1 5.5L5 9.5L13 1.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-[#1A1A1A] text-sm sm:text-base md:text-lg leading-relaxed">{feature}</span>
                  </div>
                ))}

                <button
                  onClick={() => setShowStarterPlans(!showStarterPlans)}
                  className="w-full flex items-center justify-between py-4 px-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  <span className="text-[#1A1A1A] text-sm sm:text-base md:text-lg font-medium">
                    Starter Package Included
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#1A1A1A] transition-transform duration-300 ${showStarterPlans ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    showStarterPlans ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-3 sm:space-y-3.5 md:space-y-4 pt-2">
                    {starterFeatures.map((feature, index) => (
                      <div key={`starter-${index}`} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ff0d13] flex items-center justify-center mt-0.5">
                          <svg
                            width="12"
                            height="10"
                            viewBox="0 0 14 11"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                          >
                            <path
                              d="M1 5.5L5 9.5L13 1.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="text-[#1A1A1A] text-sm sm:text-base md:text-lg leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StateFeesCalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </>
  )
}
