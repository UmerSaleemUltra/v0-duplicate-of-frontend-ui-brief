"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
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
import type { CheckoutData, Member } from "@/app/checkout/page"
import { savePassport, deletePassport } from "@/lib/passport-storage"
import { Country } from "country-state-city"

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

  useEffect(() => {
    return () => {
      Object.values(passportPreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [passportPreviews])

  const addMember = () => {
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: "",
      address: "",
      city: "",
      state: "",
      country: "US",
      zip: "",
      ssn: "",
      dateOfBirth: "",
      isResponsiblePerson: false,
      itinAdded: false,
      passportFile: null,
      passportKey: undefined,
    }
    updateData({ members: [...data.members, newMember] })
  }

  const removeMember = (id: string) => {
    if (data.members.length > 1) {
      updateData({ members: data.members.filter((m) => m.id !== id) })
    }
  }

  const updateMember = (id: string, updates: Partial<Member>) => {
    updateData({
      members: data.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })
  }

  const toggleResponsiblePerson = (id: string, checked: boolean) => {
    updateData({
      members: data.members.map((m) => ({
        ...m,
        isResponsiblePerson: m.id === id ? checked : m.isResponsiblePerson,
      })),
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    const hasResponsiblePerson = data.members.some((m) => m.isResponsiblePerson)
    if (!hasResponsiblePerson) {
      newErrors.responsiblePerson = "At least one member must be designated as Responsible Person"
    }

    data.members.forEach((member, index) => {
      if (!member.name) newErrors[`member${index}Name`] = "Name is required"
      if (!member.address) newErrors[`member${index}Address`] = "Address is required"
      if (!member.city) newErrors[`member${index}City`] = "City is required"
      if (!member.country) newErrors[`member${index}Country`] = "Country is required"
      if (!member.zip) newErrors[`member${index}Zip`] = "ZIP code is required"
      if (!member.passportFile) newErrors[`member${index}Passport`] = "Passport is required"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] OwnerInfoStep - handleSubmit called")
    console.log("[v0] OwnerInfoStep - data:", data)
    console.log("[v0] OwnerInfoStep - onNext type:", typeof onNext)
    if (validate()) {
      console.log("[v0] OwnerInfoStep - validation passed, calling onNext")
      onNext()
    } else {
      console.log("[v0] OwnerInfoStep - validation failed")
    }
  }

  const handleAddItinForMember = (memberId: string) => {
    updateData({
      members: data.members.map((m) => (m.id === memberId ? { ...m, itinAdded: true } : m)),
    })
  }

  const handlePassportUpload = async (memberId: string, file: File | null) => {
    if (file) {
      try {
        const memberIndex = data.members.findIndex((m) => m.id === memberId)
        const passportKey = `passport_${Date.now()}_member${memberIndex + 1}`

        console.log("[v0] Uploading passport for member:", memberId)
        console.log("[v0] Using passport key:", passportKey)
        console.log("[v0] File name:", file.name)
        console.log("[v0] File size:", file.size)

        await savePassport(passportKey, file)

        const blobUrl = URL.createObjectURL(file)
        console.log("[v0] Created blob URL for preview:", blobUrl)
        setPassportPreviews((prev) => ({ ...prev, [memberId]: blobUrl }))

        console.log("[v0] Passport saved successfully with key:", passportKey)

        updateData({
          members: data.members.map((m) => (m.id === memberId ? { ...m, passportFile: file, passportKey } : m)),
        })
      } catch (error) {
        console.error("[v0] Error saving passport to IndexedDB:", error)
      }
    } else {
      if (passportPreviews[memberId]) {
        URL.revokeObjectURL(passportPreviews[memberId])
      }
      setPassportPreviews((prev) => {
        const newPreviews = { ...prev }
        delete newPreviews[memberId]
        return newPreviews
      })

      updateData({
        members: data.members.map((m) =>
          m.id === memberId ? { ...m, passportFile: null, passportKey: undefined } : m,
        ),
      })
    }
  }

  const handleRemovePassport = async (memberId: string) => {
    try {
      const member = data.members.find((m) => m.id === memberId)
      if (member?.passportKey) {
        await deletePassport(member.passportKey)
      }

      if (passportPreviews[memberId]) {
        URL.revokeObjectURL(passportPreviews[memberId])
      }
      setPassportPreviews((prev) => {
        const newPreviews = { ...prev }
        delete newPreviews[memberId]
        return newPreviews
      })

      updateData({
        members: data.members.map((m) =>
          m.id === memberId ? { ...m, passportFile: null, passportKey: undefined } : m,
        ),
      })
      const fileInput = document.getElementById(`passport-${memberId}`) as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    } catch (error) {
      console.error("[v0] Error removing passport from IndexedDB:", error)
    }
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
        {data.members.map((member, index) => (
          <div key={member.id} className="space-y-4">
            <div className="p-4 md:p-6 rounded-lg border border-slate-200 bg-white space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-slate-900">Member {index + 1}</h3>
                {data.members.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3 text-sm rounded-md"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`responsible-${member.id}`}
                    checked={member.isResponsiblePerson}
                    onCheckedChange={(checked) => toggleResponsiblePerson(member.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`responsible-${member.id}`}
                    className="text-xs md:text-sm font-medium text-slate-900 cursor-pointer"
                  >
                    Responsible Person / Authorized Person
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor={`name-${member.id}`} className="text-sm font-semibold text-slate-900">
                  Full Legal Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id={`name-${member.id}`}
                    placeholder="John Smith"
                    value={member.name}
                    onChange={(e) => updateMember(member.id, { name: e.target.value })}
                    className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
                  />
                </div>
                {errors[`member${index}Name`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`member${index}Name`]}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor={`address-${member.id}`} className="text-sm font-semibold text-slate-900">
                  Home Address
                </Label>
                <Input
                  id={`address-${member.id}`}
                  placeholder="456 Oak Avenue"
                  value={member.address}
                  onChange={(e) => updateMember(member.id, { address: e.target.value })}
                  className="h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
                />
                {errors[`member${index}Address`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`member${index}Address`]}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor={`country-${member.id}`} className="text-sm font-semibold text-slate-900">
                  Country
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm relative"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-slate-400 absolute left-3" />
                        <span className="ml-2">{getCountryName(member.country)}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                    {countries.map((country) => (
                      <DropdownMenuItem
                        key={country.isoCode}
                        onClick={() => updateMember(member.id, { country: country.isoCode })}
                        className="cursor-pointer"
                      >
                        {country.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors[`member${index}Country`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`member${index}Country`]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor={`city-${member.id}`} className="text-sm font-semibold text-slate-900">
                    City
                  </Label>
                  <Input
                    id={`city-${member.id}`}
                    placeholder="San Francisco"
                    value={member.city}
                    onChange={(e) => updateMember(member.id, { city: e.target.value })}
                    className="h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
                  />
                  {errors[`member${index}City`] && (
                    <p className="text-xs text-red-600 mt-1">{errors[`member${index}City`]}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor={`zip-${member.id}`} className="text-sm font-semibold text-slate-900">
                    ZIP Code
                  </Label>
                  <Input
                    id={`zip-${member.id}`}
                    placeholder="94102"
                    value={member.zip}
                    onChange={(e) => updateMember(member.id, { zip: e.target.value })}
                    className="h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
                  />
                  {errors[`member${index}Zip`] && (
                    <p className="text-xs text-red-600 mt-1">{errors[`member${index}Zip`]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor={`ssn-${member.id}`} className="text-sm font-semibold text-slate-900">
                  SSN or ITIN (Optional)
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id={`ssn-${member.id}`}
                    type="password"
                    placeholder="XXX-XX-XXXX"
                    value={member.ssn}
                    onChange={(e) => updateMember(member.id, { ssn: e.target.value })}
                    className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
                  />
                </div>
                <p className="text-xs text-slate-600 flex items-start gap-2">
                  <Check className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  Your information is encrypted and secure.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor={`passport-${member.id}`} className="text-sm font-semibold text-slate-900">
                  Passport <span className="text-[#ff0d13]">*</span>
                </Label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <Input
                    id={`passport-${member.id}`}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handlePassportUpload(member.id, e.target.files?.[0] || null)}
                    className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                  />
                </div>
                {member.passportFile && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0" />
                        <span className="text-xs text-slate-700 truncate">{member.passportFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleRemovePassport(member.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3 flex-shrink-0 cursor-pointer"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    {passportPreviews[member.id] && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <div className="p-2">
                          <p className="text-xs font-medium text-slate-700 mb-2">Preview:</p>
                          {member.passportFile.type.startsWith("image/") ? (
                            <img
                              src={passportPreviews[member.id] || "/placeholder.svg"}
                              alt="Passport preview"
                              className="w-full h-auto max-h-64 object-contain rounded"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-slate-100 rounded">
                              <FileText className="w-12 h-12 text-slate-400" />
                              <p className="text-sm text-slate-600 ml-2">PDF Document</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {errors[`member${index}Passport`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`member${index}Passport`]}</p>
                )}
                <p className="text-xs text-slate-600">
                  Upload a copy of your passport or government-issued ID (Required)
                </p>
              </div>
            </div>

            {!member.ssn && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          ITIN Application for {member.name || `Member ${index + 1}`}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">Tax ID</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">No SSN?</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">
                            Banking Friendly
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        Need an Individual Taxpayer Identification Number (ITIN) to open bank accounts and file taxes?
                        We'll handle your complete ITIN application end-to-end.
                      </p>

                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                          <span>Document checklist & review</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                          <span>Form W-7 preparation</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                          <span>Application guidance & submission support</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full lg:w-auto lg:flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-2xl font-bold text-[#ff0d13]">$149.00</div>
                        <div className="text-xs text-slate-500">per application</div>
                      </div>

                      {member.itinAdded ? (
                        <Button
                          type="button"
                          onClick={() => updateMember(member.id, { itinAdded: false })}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 h-10 px-5 text-sm font-medium rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleAddItinForMember(member.id)}
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
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>Processing time: 6-8 weeks after IRS receives your application</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <Button
          type="button"
          onClick={addMember}
          variant="outline"
          className="w-full border border-slate-200 bg-white text-slate-900 h-10 text-sm font-medium rounded-lg cursor-pointer"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Member
        </Button>
      </form>

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full sm:w-auto px-6 h-10 border border-slate-200 bg-white text-slate-900 font-medium text-sm rounded-lg cursor-pointer"
        >
          Back
          <ArrowLeft className="ml-2 w-4 h-4" />
        </Button>
        <Button
          onClick={handleSubmit}
          className="w-full sm:w-auto bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white h-10 text-sm font-medium rounded-lg px-5 flex items-center justify-center cursor-pointer"
        >
          Next
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
