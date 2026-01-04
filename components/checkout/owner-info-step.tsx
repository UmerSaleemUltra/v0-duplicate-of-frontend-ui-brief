"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  ArrowRight,
  ArrowLeft,
  User,
  Plus,
  Trash2,
  Shield,
  Check,
  DollarSign,
  FileText,
  Upload,
  X,
  Globe,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Country } from "country-state-city"
import type { CheckoutData, Member } from "@/app/checkout/page"

type OwnerInfoStepProps = {
  data: CheckoutData
  updateData: (updates: Partial<CheckoutData>) => void
  onNext: () => void
  onBack: () => void
}

export function OwnerInfoStep({ data, updateData, onNext, onBack }: OwnerInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passportPreviews, setPassportPreviews] = useState<Record<string, string>>({})
  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const addMember = () => {
    const newMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "US",
      zip: "",
      ssn: "",
      dateOfBirth: "",
      isResponsiblePerson: (data.members || []).length === 0,
      itinAdded: false,
      passportFile: null,
      passportKey: undefined,
      passportUrl: undefined,
    }
    updateData({ members: [...(data.members || []), newMember] })
  }

  const removeMember = (id: string) => {
    if (data.members?.length > 1) {
      updateData({ members: (data.members || []).filter((m) => m.id !== id) })
    }
  }

  const updateMember = (id: string, updates: Partial<Member>) => {
    updateData({
      members: (data.members || []).map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })
  }

  const toggleResponsiblePerson = (id: string, checked: boolean) => {
    updateData({
      members: (data.members || []).map((m) => ({
        ...m,
        isResponsiblePerson: m.id === id ? checked : m.isResponsiblePerson,
      })),
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    const hasResponsiblePerson = (data.members || []).some((m) => m.isResponsiblePerson)
    if (!hasResponsiblePerson) {
      newErrors.responsiblePerson = "At least one member must be designated as Responsible Person"
    }
    ;(data.members || []).forEach((member, index) => {
      if (!member.name) newErrors[`member${index}Name`] = "Name is required"
      if (!member.address) newErrors[`member${index}Address`] = "Address is required"
      if (!member.city) newErrors[`member${index}City`] = "City is required"
      if (!member.state) newErrors[`member${index}State`] = "State/Province is required"
      if (!member.country) newErrors[`member${index}Country`] = "Country is required"
      if (!member.zip) newErrors[`member${index}Zip`] = "ZIP code is required"
      if (!member.passportFile) newErrors[`member${index}Passport`] = "Passport is required"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onNext()
  }

  const handleAddItinForMember = (memberId: string) => {
    updateMember(memberId, { itinAdded: true })
  }

  const handlePassportUpload = async (memberId: string, file: File | null) => {
    if (!file) {
      if (passportPreviews[memberId]) URL.revokeObjectURL(passportPreviews[memberId])
      setPassportPreviews((prev) => {
        const n = { ...prev }
        delete n[memberId]
        return n
      })
      updateMember(memberId, { passportFile: null, passportKey: undefined, passportUrl: undefined })
      return
    }

    const blobUrl = URL.createObjectURL(file)
    setPassportPreviews((prev) => ({ ...prev, [memberId]: blobUrl }))

    updateMember(memberId, {
      passportFile: file,
      passportKey: undefined,
      passportUrl: blobUrl,
    })
  }

  const handleRemovePassport = (memberId: string) => {
    if (passportPreviews[memberId]) URL.revokeObjectURL(passportPreviews[memberId])
    setPassportPreviews((prev) => {
      const n = { ...prev }
      delete n[memberId]
      return n
    })
    updateMember(memberId, { passportFile: null, passportKey: undefined, passportUrl: undefined })

    const fileInput = document.getElementById(`passport-${memberId}`) as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const getCountryName = (isoCode: string) => {
    return countries.find((c) => c.isoCode === isoCode)?.name || "Select a country"
  }

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">Member Information</h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
          Add all members or owners of the business. At least one must be designated as the Responsible Person.
        </p>

        {errors.responsiblePerson && (
          <p className="text-xs text-red-600 mt-3 font-medium">{errors.responsiblePerson}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(data.members || [])
          .filter((m) => m)
          .map((member, index) => (
            <div key={member.id} className="space-y-4">
              <div className="p-4 md:p-6 rounded-lg border border-slate-200 bg-white space-y-4 md:space-y-6">
                {/* Member Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900">Member {index + 1}</h3>

                  {data.members.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3 text-sm rounded-md"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Responsible Person */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`responsible-${member.id}`}
                      checked={member.isResponsiblePerson}
                      onCheckedChange={(c) => toggleResponsiblePerson(member.id, c as boolean)}
                      disabled={data.members?.length === 1}
                    />
                    <label
                      htmlFor={`responsible-${member.id}`}
                      className="text-xs md:text-sm font-medium text-slate-900 cursor-pointer"
                    >
                      Responsible Person / Authorized Person
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {data.members?.length === 1
                      ? "As the only member, you are automatically the responsible person."
                      : "Person authorized to represent the company"}
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-900">Full Legal Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="John Smith"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, { name: e.target.value })}
                      className="pl-10 h-11"
                    />
                  </div>
                  {errors[`member${index}Name`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Name`]}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-900">Home Address</Label>
                  <Input
                    placeholder="456 Oak Avenue"
                    value={member.address}
                    onChange={(e) => updateMember(member.id, { address: e.target.value })}
                    className="h-11"
                  />
                  {errors[`member${index}Address`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Address`]}</p>
                  )}
                </div>

                {/* City / State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-900">City</Label>
                    <Input
                      placeholder="San Francisco"
                      value={member.city}
                      onChange={(e) => updateMember(member.id, { city: e.target.value })}
                      className="h-11"
                    />
                    {errors[`member${index}City`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}City`]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-900">State / Province</Label>
                    <Input
                      placeholder="California"
                      value={member.state}
                      onChange={(e) => updateMember(member.id, { state: e.target.value })}
                      className="h-11"
                    />
                    {errors[`member${index}State`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}State`]}</p>
                    )}
                  </div>
                </div>

                {/* Country / ZIP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-900">Country</Label>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between pl-10 h-11 relative bg-transparent">
                          <Globe className="absolute left-3 w-5 h-5 text-slate-400" />
                          <span>{getCountryName(member.country)}</span>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                        {countries.map((c) => (
                          <DropdownMenuItem
                            key={c.isoCode}
                            onClick={() => updateMember(member.id, { country: c.isoCode })}
                          >
                            {c.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {errors[`member${index}Country`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}Country`]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-900">ZIP Code</Label>
                    <Input
                      placeholder="94102"
                      value={member.zip}
                      onChange={(e) => updateMember(member.id, { zip: e.target.value })}
                      className="h-11"
                    />
                    {errors[`member${index}Zip`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}Zip`]}</p>
                    )}
                  </div>
                </div>

                {/* SSN / ITIN */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-900">SSN or ITIN (optional)</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 w-5 h-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="XXX-XX-XXXX"
                      value={member.ssn}
                      onChange={(e) => updateMember(member.id, { ssn: e.target.value })}
                      className="pl-10 h-11"
                    />
                  </div>
                  <p className="text-xs text-slate-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-red-600" />
                    Your information is encrypted & secure.
                  </p>
                </div>

                {/* Passport Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-900">
                    Passport <span className="text-red-600">*</span>
                  </Label>

                  <div className="relative">
                    <Upload className="absolute left-3 w-5 h-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id={`passport-${member.id}`}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handlePassportUpload(member.id, e.target.files?.[0] || null)}
                      className="pl-10 h-11 file:text-sm file:font-medium"
                    />
                  </div>

                  {/* Uploaded File */}
                  {member.passportFile && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-700 truncate">{member.passportFile.name}</span>
                        <span className="text-xs text-green-600">Ready to upload after company creation</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePassport(member.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}

                  {errors[`member${index}Passport`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Passport`]}</p>
                  )}
                </div>

                {/* ITIN Card */}
                {!member.ssn && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
                    <div className="p-4 md:p-6 space-y-4">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            ITIN Application for {member.name || `Member ${index + 1}`}
                          </h3>

                          <p className="text-sm text-slate-600">
                            Need an ITIN to open bank accounts or file taxes? We handle the complete process for you.
                          </p>

                          <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-600" />
                              Document checklist & review
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-600" />
                              Form W-7 preparation
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-600" />
                              Application guidance & submission
                            </li>
                          </ul>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">$149.00</div>
                            <div className="text-xs text-slate-500">per application</div>
                          </div>

                          {member.itinAdded ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-300 text-red-600 bg-transparent"
                              onClick={() => updateMember(member.id, { itinAdded: false })}
                            >
                              <X className="w-4 h-4 mr-2" /> Remove
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
                              onClick={() => handleAddItinForMember(member.id)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Add to Order
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Processing time: 6–8 weeks after IRS receives your file
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Add Member Button */}
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={addMember} className="w-full sm:w-auto bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Member
          </Button>
        </div>
      </form>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button onClick={onBack} variant="outline" className="w-full sm:w-auto bg-transparent">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <Button
          onClick={handleSubmit}
          className="w-full sm:w-auto bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white"
        >
          Next
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
