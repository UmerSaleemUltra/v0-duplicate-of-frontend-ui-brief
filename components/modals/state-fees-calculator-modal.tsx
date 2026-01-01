"use client"

import { useState } from "react"
import { X, MapPin, Rocket } from "lucide-react"
import { US_STATES, STATE_FEES } from "@/lib/constants"
import { useRouter } from "next/navigation"

interface StateFeesCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StateFeesCalculatorModal({ isOpen, onClose }: StateFeesCalculatorModalProps) {
  const [selectedState, setSelectedState] = useState<string>("")
  const router = useRouter()

  if (!isOpen) return null

  const stateFee = selectedState ? STATE_FEES[selectedState] : 0

  const handleStartBusiness = () => {
    router.push("/checkout")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#880000] to-[#ff0d13] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">State Pricing</h2>
              <p className="text-sm text-white/90">Select your state to see pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* State Selection */}
          <div className="mb-6">
            <label htmlFor="state-select" className="block text-lg font-semibold text-gray-900 mb-3">
              Choose Your State
            </label>
            <div className="relative">
              <select
                id="state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-4 text-base text-gray-900 bg-white border-2 border-gray-200 rounded-xl appearance-none cursor-pointer hover:border-[#ff0d13] focus:border-[#ff0d13] focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20 transition-all"
              >
                <option value="">Select a state...</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* State Fee Display */}
          {selectedState && (
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">State Fee</p>
                  <p className="text-lg text-gray-700">{selectedState}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-4xl font-bold text-blue-600">${stateFee}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start Business Button */}
          <button
            onClick={handleStartBusiness}
            disabled={!selectedState}
            className="w-full bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white rounded-full py-4 px-6 text-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Rocket className="w-5 h-5" />
            <span>Start Your Business</span>
          </button>

          {/* Footer Note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p>No hidden fees • Transparent pricing</p>
          </div>
        </div>
      </div>
    </div>
  )
}
