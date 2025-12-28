"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATE_FEES: Record<string, number> = {
  Alabama: 200,
  Alaska: 250,
  Arizona: 85,
  Arkansas: 45,
  California: 70,
  Colorado: 50,
  Connecticut: 120,
  Delaware: 90,
  Florida: 125,
  Georgia: 100,
  Hawaii: 50,
  Idaho: 100,
  Illinois: 150,
  Indiana: 95,
  Iowa: 50,
  Kansas: 160,
  Kentucky: 40,
  Louisiana: 100,
  Maine: 175,
  Maryland: 100,
  Massachusetts: 500,
  Michigan: 50,
  Minnesota: 135,
  Mississippi: 50,
  Missouri: 50,
  Montana: 35,
  Nebraska: 100,
  Nevada: 425,
  "New Hampshire": 100,
  "New Jersey": 125,
  "New Mexico": 50,
  "New York": 200,
  "North Carolina": 125,
  "North Dakota": 135,
  Ohio: 99,
  Oklahoma: 100,
  Oregon: 100,
  Pennsylvania: 125,
  "Rhode Island": 150,
  "South Carolina": 110,
  "South Dakota": 150,
  Tennessee: 300,
  Texas: 300,
  Utah: 70,
  Vermont: 125,
  Virginia: 100,
  Washington: 200,
  "West Virginia": 100,
  Wisconsin: 130,
  Wyoming: 100,
}

const US_STATES = Object.keys(STATE_FEES).sort()

export default function StateFeesCalculator() {
  const [selectedState, setSelectedState] = useState<string>("Wyoming")

  const FILING_FEE = 150
  const stateFee = selectedState ? STATE_FEES[selectedState] : 0
  const totalFee = FILING_FEE + stateFee

  return (
    <section className="w-full bg-gradient-to-r from-[#880000] to-[#ff0d13] py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10">
      {/* Section Heading */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
          Instantly know your LLC setup cost.
        </h1>
        <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
          Transparency meets simplicity — calculate your state's formation cost in seconds.
        </p>
      </div>

      {/* Calculator Card */}
      <div className="mx-auto max-w-3xl p-6 sm:p-8 md:p-10 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        {/* State Selection */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold uppercase tracking-wide text-white">
            Select Your State
          </label>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-11 sm:h-12 md:h-14 w-full border-2 border-white/30 bg-white/5 text-base sm:text-lg font-medium text-white hover:border-white/50 focus:ring-2 focus:ring-white focus:border-white">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-72 sm:max-h-80">
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state} className="text-sm sm:text-base">
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <h2 className="mb-6 sm:mb-8 md:mb-10 text-center text-xl sm:text-2xl md:text-3xl font-semibold text-white">
          {selectedState} One-Stop LLC Formation
        </h2>

        {/* Pricing Display */}
        <div className="mb-8 sm:mb-9 md:mb-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-6 sm:gap-8 border-b border-white/20 pb-8 sm:pb-9 md:pb-10">
          {/* State Fee */}
          <div className="text-center">
            <div className="mb-1 sm:mb-2 text-4xl sm:text-5xl md:text-6xl font-bold text-white">${stateFee}</div>
            <div className="text-xs sm:text-sm font-medium text-white/80">State Fee</div>
          </div>

          {/* Divider (hidden on mobile) */}
          <div className="hidden md:block h-20 w-px bg-white/20" />

          {/* Total Fee */}
          <div className="text-center">
            <div className="mb-1 sm:mb-2 text-4xl sm:text-5xl md:text-6xl font-bold text-white">${totalFee}</div>
            <div className="text-xs sm:text-sm font-medium text-white/80">Total Formation Fee</div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            size="lg"
            className="mb-3 sm:mb-4 h-12 sm:h-13 md:h-14 rounded-full bg-white text-[#880000] px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-lg hover:bg-white/90 hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
          >
            Start My LLC In {selectedState}
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          <p className="text-xs sm:text-sm text-white/80">Starts at ${FILING_FEE} + State Fees</p>
        </div>
      </div>
    </section>
  )
}
