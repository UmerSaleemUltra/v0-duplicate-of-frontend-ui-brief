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

    if (!data.businessCategory) newErrors.businessCategory = "Business category is required"

    if (!data.businessDescription || !data.businessDescription.trim()) {
      newErrors.businessDescription = "Business description is required"
    } else if (data.businessDescription.trim().length < 20) {
      newErrors.businessDescription = "Please provide at least 20 characters"
    }

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
    <div className="space-y-6 overflow-hidden max-w-full">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-950 break-words">Business Information</h1>
        <p className="text-sm text-slate-600 break-words leading-relaxed">
          Tell us about your business. This information will appear on your formation documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 overflow-hidden">
        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="businessName" className="text-sm font-medium text-slate-900">
            Business Name
          </Label>
          <div className="relative overflow-hidden">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="businessName"
              placeholder="Acme Corporation LLC"
              value={data.businessName}
              onChange={(e) => updateData({ businessName: e.target.value })}
              className="pl-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full"
            />
          </div>
          {errors.businessName && <p className="text-xs text-red-600 break-words">{errors.businessName}</p>}
          <p className="text-xs text-slate-500 break-words">Include LLC or Inc in business name</p>
        </div>

        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="businessWebsite" className="text-sm font-medium text-slate-900">
            Business Website <span className="text-slate-400 font-normal">(Optional)</span>
          </Label>
          <div className="relative overflow-hidden">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="businessWebsite"
              type="url"
              placeholder="www.example.com"
              value={data.businessWebsite || ""}
              onChange={(e) => updateData({ businessWebsite: e.target.value })}
              className="pl-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full"
            />
          </div>
          {errors.businessWebsite && <p className="text-xs text-red-600 break-words">{errors.businessWebsite}</p>}
          <p className="text-xs text-slate-500 break-words">Your business website or online presence</p>
        </div>

        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="businessCategory" className="text-sm font-medium text-slate-900">
            Business Category
          </Label>
          <Select value={data.businessCategory} onValueChange={(value) => updateData({ businessCategory: value })}>
            <SelectTrigger className="h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full overflow-hidden">
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
          {errors.businessCategory && <p className="text-xs text-red-600 break-words">{errors.businessCategory}</p>}
        </div>

        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="businessDescription" className="text-sm font-medium text-slate-900">
            Business Description
          </Label>
          <Textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={data.businessDescription || ""}
            onChange={(e) => updateData({ businessDescription: e.target.value })}
            className="w-full min-h-[100px] max-h-[250px] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg resize-y overflow-y-auto text-sm md:text-base"
          />
          {errors.businessDescription && (
            <p className="text-xs text-red-600 break-words">{errors.businessDescription}</p>
          )}
          <p className="text-xs text-slate-500 break-words leading-relaxed">
            Provide a brief overview of your business activities (minimum 20 characters)
          </p>
        </div>
      </form>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-slate-300 hover:bg-slate-50 bg-white text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="w-full sm:w-auto h-12 px-10 text-base bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#990000] hover:to-[#ff1a1a] text-white font-semibold cursor-pointer"
        >
          Next <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
