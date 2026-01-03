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
  "E-commerce",
  "Consulting",
  "Real Estate",
  "Technology",
  "Healthcare",
  "Food & Beverage",
  "Retail",
  "Manufacturing",
  "Professional Services",
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
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">Business Information</h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
          Tell us about your business. This information will appear on your formation documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
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
              className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
            />
          </div>
          {errors.businessName && <p className="text-xs text-red-600 mt-1">{errors.businessName}</p>}
          <p className="text-xs text-slate-500">Include LLC or Corp designation</p>
        </div>

        <div className="space-y-3">
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
              className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
            />
          </div>
          {errors.businessWebsite && <p className="text-xs text-red-600 mt-1">{errors.businessWebsite}</p>}
          <p className="text-xs text-slate-500">Your business website or online presence</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="businessCategory" className="text-sm font-semibold text-slate-900">
            Business Category
          </Label>
          <Select value={data.businessCategory} onValueChange={(value) => updateData({ businessCategory: value })}>
            <SelectTrigger className="h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm">
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

        <div className="space-y-3">
          <Label htmlFor="businessDescription" className="text-sm font-semibold text-slate-900">
            Business Description
          </Label>
          <Textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={data.businessDescription || ""}
            onChange={(e) => updateData({ businessDescription: e.target.value })}
            className="min-h-[120px] border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg text-sm resize-none"
          />
          <p className="text-xs text-slate-500">Provide a brief overview of your business activities</p>
        </div>
      </form>

      {/* {data.businessCategory === "E-commerce" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div className="space-y-3 flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">Reseller Certificate</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">
                      Tax Exempt
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">
                      E-commerce
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">
                      Wholesale
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Purchase inventory and goods for resale without paying sales tax. Essential for e-commerce and retail
                  businesses buying wholesale products.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                    <span>State reseller permit application</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                    <span>Sales tax exemption certificate</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                    <span>Compliance guidance & support</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full lg:w-auto lg:flex-shrink-0">
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold text-[#ff0d13]">$99.00</div>
                  <div className="text-xs text-slate-500">one-time fee</div>
                </div>

                {data.needsResellerCertificate ? (
                  <Button
                    type="button"
                    onClick={() => updateData({ needsResellerCertificate: false })}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 h-10 px-5 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleAddReseller}
                    className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white h-10 px-5 text-sm font-medium rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Add to Order
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileCheck className="w-4 h-4 flex-shrink-0" />
                <span>Processing time: 2-4 weeks depending on state requirements</span>
              </div>
            </div>
          </div>
        </div>
      )} */}

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full sm:w-auto px-6 h-10 border border-slate-200 bg-white text-slate-900 font-medium text-sm rounded-lg cursor-pointer"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="w-full sm:w-auto bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white h-10 text-sm font-medium rounded-lg px-5 flex items-center justify-center cursor-pointer"
        >
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
