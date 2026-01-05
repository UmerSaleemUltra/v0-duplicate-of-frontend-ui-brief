"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { US_STATES, STATE_FEES } from "@/lib/constants"
import type { StatePackageStepProps } from "./state-package-step-props" // Declare the variable before using it

const ENTITY_TYPES = [
  {
    id: "LLC",
    name: "LLC — Limited Liability Company",
    badges: ["POPULAR", "Cost-effective"],
    features: [
      "Pass-through taxation",
      "Limited liability protection",
      "Flexible ownership",
      "Tax savings & credibility",
    ],
    bestFor: "General purpose, consultants, e-commerce, agencies",
  },
  {
    id: "C-Corp",
    name: "C Corporation",
    badges: ["Growth"],
    features: [
      "Separate taxation",
      "Limited liability protection",
      "Unlimited shareholders",
      "Great for raising capital",
    ],
    bestFor: "Startups seeking investment, businesses planning to go public",
  },
]

const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    price: 149,
    features: [
      { name: "Name Check & Clearance", included: true },
      { name: "Business Address - 1 Year", included: true },
      { name: "Registered Agent - 1 Year", included: true },
      { name: "Govt / State Filing Fee", included: true },
      { name: "Articles of Incorporation", included: true },
      { name: "Business Tax ID (EIN)", included: true },
      { name: "U.S. Phone Number", included: true },
      { name: "Business Bank Account Setup", included: true },
      { name: "Digital Dashboard Access", included: true },
    ],
    includesResellerCert: false,
  },
  {
    id: "advanced",
    name: "Advance",
    price: 249,
    features: [
      { name: "Everything in Starter Package", included: true },
      { name: "Business Address with Unique Suite", included: true },
      { name: "Reseller Certificate / Seller Permit", included: true },
      { name: "Dedicated IP VPS - 1 Month", included: true },
    ],
    includesResellerCert: true,
  },
]

const PRIORITY_STATES = ["Wyoming", "Montana", "Florida", "New Mexico"]

export function StatePackageStep({ data, updateData, onNext, onBack }: StatePackageStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const stateFee = data.state ? STATE_FEES[data.state] || 0 : 0

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!data.state) newErrors.state = "Please select a state"
    if (!data.entityType) newErrors.entityType = "Please select an entity type"
    if (!data.packageType) newErrors.packageType = "Please select a package"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onNext()
    }
  }

  const orderedStates = [...PRIORITY_STATES, ...US_STATES.filter((state) => !PRIORITY_STATES.includes(state))]

  return (
    <div className="space-y-6 overflow-hidden max-w-full">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 break-words">Select your company formation</h1>
        <p className="text-sm text-slate-600 break-words leading-relaxed">
          Choose the legal entity structure that aligns with your business goals.
        </p>
      </div>

      <div className="space-y-2 overflow-hidden">
        <Label htmlFor="state" className="text-sm font-medium text-slate-900">
          Formation State
        </Label>
        <Select value={data.state} onValueChange={(value) => updateData({ state: value })}>
          <SelectTrigger className="w-full h-11 border-slate-200 bg-white text-slate-900 rounded-lg overflow-hidden">
            <SelectValue placeholder="Select a state..." />
          </SelectTrigger>
          <SelectContent>
            {orderedStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.state && <p className="text-sm text-[#ff0d13] break-words">{errors.state}</p>}
      </div>

      <div className="space-y-3 overflow-hidden">
        <h2 className="text-base font-semibold text-slate-900">Entity Type</h2>
        <div className="space-y-3">
          {ENTITY_TYPES.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => updateData({ entityType: entity.id })}
              className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all overflow-hidden ${
                data.entityType === entity.id
                  ? "border-[#ff0d13] bg-[#fff5f5]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <input
                  type="radio"
                  checked={data.entityType === entity.id}
                  onChange={() => updateData({ entityType: entity.id })}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff0d13] accent-[#ff0d13] mt-1 flex-shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 break-words">{entity.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {entity.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${
                          badge === "POPULAR"
                            ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1.5 mb-2">
                    {entity.features.map((feature, i) => (
                      <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                        <span className="break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100 break-words leading-relaxed">
                    <span className="font-medium text-slate-900">Best for:</span> {entity.bestFor}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.entityType && <p className="text-sm text-[#ff0d13] break-words">{errors.entityType}</p>}
      </div>

      <div className="space-y-3 overflow-hidden">
        <h2 className="text-base font-semibold text-slate-900">Choose Your Package</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PACKAGES.map((pkg) => {
            const total = data.state ? pkg.price + stateFee : pkg.price
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => updateData({ packageType: pkg.id })}
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all text-left flex flex-col overflow-hidden min-w-0 ${
                  data.packageType === pkg.id
                    ? "border-[#ff0d13] bg-[#fff5f5]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-words min-w-0">{pkg.name}</h3>
                  {data.packageType === pkg.id && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <div className="text-xl sm:text-2xl font-bold text-[#ff0d13]">${total}</div>
                  <div className="text-xs sm:text-sm text-slate-600 mt-0.5 break-words">
                    {data.state ? "Total (includes state fees)" : "Base price + state fees"}
                  </div>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {pkg.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`text-xs sm:text-sm flex items-start gap-1.5 ${
                        feature.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 ${
                          feature.included ? "text-[#ff0d13]" : "text-slate-300"
                        }`}
                      />
                      <span className="break-words min-w-0">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
        {errors.packageType && <p className="text-sm text-[#ff0d13] break-words">{errors.packageType}</p>}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-slate-100">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full sm:w-auto px-10 h-14 text-base font-semibold border-slate-300 hover:bg-slate-50 bg-white text-slate-900"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="w-full sm:flex-1 h-14 px-10 text-base bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#990000] hover:to-[#ff1a1a] text-white font-semibold"
        >
          Next <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
