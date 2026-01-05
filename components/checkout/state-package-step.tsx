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
      { name: "Articles of Organization", included: true },
      { name: "Registered Agent (1 year)", included: true },
      { name: "Operating Agreement", included: true },
      { name: "EIN Application", included: true },
      { name: "Expedited Filing", included: false },
      { name: "Banking Resolution", included: false },
      { name: "Compliance Calendar", included: false },
      { name: "Priority Support", included: false },
      { name: "Annual Report Service", included: false },
      { name: "Reseller Certificate", included: false },
    ],
    includesResellerCert: false,
  },
  {
    id: "advanced",
    name: "Advanced",
    price: 249,
    features: [
      { name: "Articles of Organization", included: true },
      { name: "Registered Agent (1 year)", included: true },
      { name: "Operating Agreement", included: true },
      { name: "EIN Application", included: true },
      { name: "Expedited Filing", included: true },
      { name: "Banking Resolution", included: true },
      { name: "Compliance Calendar", included: true },
      { name: "Priority Support", included: true },
      { name: "Annual Report Service", included: true },
      { name: "Reseller Certificate", included: true },
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
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Select your company formation</h1>
        <p className="text-base text-slate-700 leading-relaxed">
          Choose the legal entity structure that aligns with your business goals.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="state" className="text-sm font-semibold text-slate-900">
          Formation State
        </Label>
        <Select value={data.state} onValueChange={(value) => updateData({ state: value })}>
          <SelectTrigger className="w-full h-11 text-sm border-slate-200 bg-white text-slate-900 rounded-lg shadow-sm">
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
        {errors.state && <p className="text-sm text-[#ff0d13] mt-1.5">{errors.state}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Entity Type</h2>
        <div className="space-y-4">
          {ENTITY_TYPES.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => updateData({ entityType: entity.id })}
              className={`w-full text-left p-6 rounded-lg border-2 transition-all shadow-sm hover:shadow-md ${
                data.entityType === entity.id
                  ? "border-[#ff0d13] bg-[#fff5f5]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  checked={data.entityType === entity.id}
                  onChange={() => updateData({ entityType: entity.id })}
                  className="w-5 h-5 text-[#ff0d13] accent-[#ff0d13] mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold text-slate-900">{entity.name}</h3>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {entity.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          badge === "POPULAR"
                            ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-2 mb-4">
                    {entity.features.map((feature, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-slate-700 pt-4 border-t border-slate-100">
                    <span className="font-medium text-slate-900">Best for:</span> {entity.bestFor}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.entityType && <p className="text-sm text-[#ff0d13] mt-1.5">{errors.entityType}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Choose Your Package</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {PACKAGES.map((pkg) => {
            const total = data.state ? pkg.price + stateFee : pkg.price
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => updateData({ packageType: pkg.id })}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all text-left shadow-sm hover:shadow-md ${
                  data.packageType === pkg.id
                    ? "border-[#ff0d13] bg-[#fff5f5]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-base font-semibold text-slate-900">{pkg.name}</h3>
                  {data.packageType === pkg.id && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="mb-5">
                  <div className="text-3xl font-bold text-[#ff0d13]">${total}</div>
                  <div className="text-sm text-slate-700 mt-1">
                    {data.state ? "Total (includes state fees)" : "Base price + state fees"}
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {pkg.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`text-sm flex items-start gap-2 ${
                        feature.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          feature.included ? "text-[#ff0d13]" : "text-slate-300"
                        }`}
                      />
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
        {errors.packageType && <p className="text-sm text-[#ff0d13] mt-1.5">{errors.packageType}</p>}
      </div>

      <div className="flex gap-3 pt-8 border-t border-slate-100">
        <Button onClick={onBack} variant="outline" className="h-11 cursor-pointer bg-transparent">
          <ArrowLeft className="mr-2 w-4 h-4" /> Previous
        </Button>
        <Button onClick={handleSubmit} className="h-11 bg-gradient-to-r from-[#880000] to-[#ff0d13] cursor-pointer">
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
