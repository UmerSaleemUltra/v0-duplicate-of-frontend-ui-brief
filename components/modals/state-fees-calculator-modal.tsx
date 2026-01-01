"use client"

import { useState } from "react"
import { X, MapPin, Rocket } from "lucide-react"
import { US_STATES } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StateFeesCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StateFeesCalculatorModal({ isOpen, onClose }: StateFeesCalculatorModalProps) {
  const [selectedState, setSelectedState] = useState<string>("")
  const router = useRouter()

  if (!isOpen) return null

  const handleStartBusiness = () => {
    router.push("/checkout")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
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
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <label htmlFor="state-select" className="block text-lg font-semibold text-gray-900 mb-3">
              Choose Your State
            </label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full h-12 text-base">
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

          {/* Start Business Button */}
          <button
            onClick={handleStartBusiness}
            disabled={!selectedState}
            className="w-full bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white rounded-full py-4 px-6 text-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
