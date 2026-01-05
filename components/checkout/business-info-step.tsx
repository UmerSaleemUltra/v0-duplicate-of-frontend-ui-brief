"use client"

import type React from "react"
import { useState } from "react"
import { ArrowRight, ArrowLeft, Building, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CheckoutData } from "@/app/checkout/page"

type BusinessInfoStepProps = {
  data: CheckoutData
  updateData: (updates: Partial<CheckoutData>) => void
  onNext: () => void
  onBack: () => void
}

const BUSINESS_CATEGORIES = [
  "E-Commerce / Shopify",
  "E-Commerce / Amazon",
  "Dropshipping",
  "Digital Marketing",
  "Software / SaaS",
  "IT Services",
  "Web Development",
  "Mobile Apps",
  "AI Services",
  "Content Creation",
  "Online Education",
  "Consulting",
  "Accounting",
  "Medical Billing",
  "Healthcare Services",
  "Real Estate",
  "Construction",
  "Logistics",
  "Truck Dispatch",
  "Import / Export",
  "Manufacturing",
  "Wholesale",
  "Retail",
  "Fashion / Apparel",
  "Health & Beauty",
  "Fitness",
  "Finance",
  "Crypto / Blockchain",
  "Travel",
  "Hospitality",
  "Food & Beverage",
  "Automotive",
  "Electronics",
  "Home & Kitchen",
  "Furniture",
  "Cleaning Services",
  "Events",
  "Media Production",
  "Recruitment",
  "BPO / Call Center",
  "Security Services",
  "Non-Profit",
  "Other",
]

export function BusinessInfoStep({ data, updateData, onNext, onBack }: BusinessInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!data.businessName) newErrors.businessName = "Business name is required"

    if (data.businessWebsite && data.businessWebsite.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
      if (!urlPattern.test(data.businessWebsite.trim())) {
        newErrors.businessWebsite = "Please enter a valid website URL"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onNext()
    }
  }

  const handleAddReseller = () => {
    updateData({ needsResellerCertificate: true })
  }

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="space-y-2 md:space-y-3">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-950 tracking-tight">
          Business Information
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
          Tell us about your business. This information will appear on your formation documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="businessName" className="text-sm font-semibold text-slate-900">
            Business Name
          </Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="businessName"
              placeholder="Acme Corporation LLC"
              value={data.businessName}
              onChange={(e) => updateData({ businessName: e.target.value })}
              className="pl-10 h-11 md:h-12 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm md:text-base"
            />
          </div>
          {errors.businessName && <p className="text-xs text-red-600 mt-1">{errors.businessName}</p>}
          <p className="text-xs md:text-sm text-slate-500">Include LLC or Inc in business name </p>
        </div>

        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="businessWebsite" className="text-sm font-semibold text-slate-900">
            Business Website <span className="text-slate-400 font-normal">(Optional)</span>
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="businessWebsite"
              type="url"
              placeholder="www.example.com"
              value={data.businessWebsite || ""}
              onChange={(e) => updateData({ businessWebsite: e.target.value })}
              className="pl-10 h-11 md:h-12 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm md:text-base"
            />
          </div>
          {errors.businessWebsite && <p className="text-xs text-red-600 mt-1">{errors.businessWebsite}</p>}
          <p className="text-xs md:text-sm text-slate-500">Your business website or online presence</p>
        </div>

        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="businessCategory" className="text-sm font-semibold text-slate-900">
            Business Category
          </Label>
          <Select value={data.businessCategory} onValueChange={(value) => updateData({ businessCategory: value })}>
            <SelectTrigger className="h-11 md:h-12 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm md:text-base">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="businessDescription" className="text-sm font-semibold text-slate-900">
            Business Description
          </Label>
          <Textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={data.businessDescription || ""}
            onChange={(e) => updateData({ businessDescription: e.target.value })}
            className="min-h-[100px] md:min-h-[120px] border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg text-sm md:text-base resize-none"
          />
          <p className="text-xs md:text-sm text-slate-500">Provide a brief overview of your business activities</p>
        </div>
      </form>

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full sm:w-auto px-6 h-11 md:h-12 border border-slate-200 bg-white text-slate-900 font-medium text-sm md:text-base rounded-lg cursor-pointer"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="w-full sm:w-auto flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white h-11 md:h-12 text-sm md:text-base font-medium rounded-lg px-5 flex items-center justify-center cursor-pointer"
        >
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
