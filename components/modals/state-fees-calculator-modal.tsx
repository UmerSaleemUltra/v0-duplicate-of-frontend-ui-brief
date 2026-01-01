"use client"

import { useState } from "react"
import { X, MapPin, Rocket, ArrowRight } from "lucide-react"
import { US_STATES, STATE_FEES } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StateFeesCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StateFeesCalculatorModal({ isOpen, onClose }: StateFeesCalculatorModalProps) {
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedPackage, setSelectedPackage] = useState<"starter" | "advanced">("starter")
  const router = useRouter()

  if (!isOpen) return null

  const handleStartBusiness = () => {
    router.push("/checkout")
  }

  const stateFee = selectedState ? STATE_FEES[selectedState] || 0 : 0
  const starterPackageFee = 150 + stateFee
  const advancedPackageFee = 249 + stateFee

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-[#880000] to-[#ff0d13] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">State Pricing</h2>
              <p className="text-xs sm:text-sm text-white/90">Select your state to see pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <label htmlFor="state-select" className="block text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Choose Your State
            </label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full h-12 text-sm sm:text-base cursor-pointer">
                <SelectValue placeholder="Select a state..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state} className="cursor-pointer">
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedState && (
            <div className="space-y-3 sm:space-y-4 mb-6">
              {/* Starter Package */}
              <button
                onClick={() => setSelectedPackage("starter")}
                className={`w-full bg-white border-2 rounded-xl p-4 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  selectedPackage === "starter" ? "border-red-600 bg-red-50" : "border-gray-200"
                }`}
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-600 mb-1">Starter Package</div>
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{selectedState}</div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
                    ${starterPackageFee}
                  </div>
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                      selectedPackage === "starter" ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : "bg-gray-200"
                    }`}
                  >
                    <ArrowRight
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedPackage === "starter" ? "text-white" : "text-gray-500"}`}
                    />
                  </div>
                </div>
              </button>

              {/* Advanced Package */}
              <button
                onClick={() => setSelectedPackage("advanced")}
                className={`w-full bg-white border-2 rounded-xl p-4 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  selectedPackage === "advanced" ? "border-red-600 bg-red-50" : "border-gray-200"
                }`}
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-600 mb-1">Advanced Package</div>
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{selectedState}</div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
                    ${advancedPackageFee}
                  </div>
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                      selectedPackage === "advanced" ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : "bg-gray-200"
                    }`}
                  >
                    <ArrowRight
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedPackage === "advanced" ? "text-white" : "text-gray-500"}`}
                    />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Start Business Button */}
          <button
            onClick={handleStartBusiness}
            disabled={!selectedState}
            className="w-full bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white rounded-full py-3 sm:py-4 px-6 text-base sm:text-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Start Your Business</span>
          </button>

          {/* Footer Note */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p>No hidden fees • Transparent pricing</p>
          </div>
        </div>
      </div>
    </div>
  )
}
