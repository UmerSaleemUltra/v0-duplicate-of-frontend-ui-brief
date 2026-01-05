"use client"
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
  const [uploadingPassports, setUploadingPassports] = useState<Record<string, boolean>>({})
  const [passportPreviews, setPassportPreviews] = useState<Record<string, string>>({})
  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  useEffect(() => {
    if (data.members && data.members.length > 0) {
      const needsUpdate = data.members.some((m) => !m.country || m.country === "US")
      if (needsUpdate) {
        updateData({
          members: data.members.map((m) => ({
            ...m,
            country: m.country && m.country !== "US" ? m.country : "PK",
          })),
        })
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup all blob URLs when component unmounts
      Object.values(passportPreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [passportPreviews])

  const addMember = () => {
    const newMember: Member = {
      id: Math.random().toString(),
      name: "",
      address: "",
      city: "",
      state: "",
      country: "PK",
      zip: "",
      ssn: "",
      isResponsiblePerson: (data.members || []).length === 0,
      itinAdded: false,
      passportFile: null,
      passportKey: undefined,
      passportUrl: undefined,
      passportId: undefined,
    }
    updateData({ members: [...(data.members || []), newMember] })
  }

  const removeMember = (id: string) => {
    if (data.members?.length > 1) {
      if (passportPreviews[id]) {
        URL.revokeObjectURL(passportPreviews[id])
      }

      const updatedMembers = (data.members || []).filter((m) => m.id !== id)

      const hadResponsible = data.members.find((m) => m.id === id)?.isResponsiblePerson
      if (hadResponsible && updatedMembers.length > 0) {
        updatedMembers[0].isResponsiblePerson = true
      }

      updateData({ members: updatedMembers })

      setPassportPreviews((prev) => {
        const newPreviews = { ...prev }
        delete newPreviews[id]
        return newPreviews
      })

      setUploadingPassports((prev) => {
        const newUploading = { ...prev }
        delete newUploading[id]
        return newUploading
      })

      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`member-${id}`]
        return newErrors
      })
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
        isResponsiblePerson: m.id === id ? checked : false,
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
      if (!member.passportFile && !member.passportUrl) {
        newErrors[`member${index}Passport`] = "Passport is required"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    const hasUploading = Object.values(uploadingPassports).some((uploading) => uploading)
    if (hasUploading) {
      return
    }

    if (validate()) {
      onNext()
    }
  }

  const handleAddItinForMember = (memberId: string) => {
    const itinAddon = {
      id: `itin-${memberId}`,
      name: `ITIN Application - ${data.members?.find((m) => m.id === memberId)?.name || "Member"}`,
      price: 149,
      memberId: memberId,
    }

    const currentAddons = data.addons || []
    const addonExists = currentAddons.some((a) => a.id === itinAddon.id)

    if (!addonExists) {
      updateData({
        addons: [...currentAddons, itinAddon],
        addonsTotal: (data.addonsTotal || 0) + 149,
      })
    }

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
      updateMember(memberId, {
        passportFile: null,
        passportKey: undefined,
        passportUrl: undefined,
        passportId: undefined,
      })
      return
    }

    if (uploadingPassports[memberId]) {
      return
    }

    if (!data.userId) {
      return
    }

    const member = data.members.find((m) => m.id === memberId)
    if (!member) {
      return
    }

    const memberName = member.name || "Unknown Member"

    setUploadingPassports((prev) => ({ ...prev, [memberId]: true }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", data.userId)

      const companyDataStr = localStorage.getItem("companyData")
      if (companyDataStr) {
        try {
          const companyData = JSON.parse(companyDataStr)
          if (companyData.id) {
            formData.append("companyId", companyData.id)
          }
        } catch (e) {
          // No company data yet
        }
      }

      formData.append("memberId", memberId)
      formData.append("memberName", memberName)

      const response = await fetch("/api/passports/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to upload passport" }))
        throw new Error(errorData.error || "Failed to upload passport")
      }

      const result = await response.json()

      const blobUrl = URL.createObjectURL(file)
      setPassportPreviews((prev) => ({ ...prev, [memberId]: blobUrl }))

      updateMember(memberId, {
        passportFile: file,
        passportKey: result.data?.fileUrl || result.url,
        passportUrl: result.data?.fileUrl || result.url,
        passportId: result.data?.id,
      })
    } catch (error) {
      console.error("Error uploading passport:", error)
    } finally {
      setUploadingPassports((prev) => {
        const n = { ...prev }
        delete n[memberId]
        return n
      })
    }
  }

  const handleRemovePassport = (memberId: string) => {
    if (passportPreviews[memberId]) URL.revokeObjectURL(passportPreviews[memberId])
    setPassportPreviews((prev) => {
      const n = { ...prev }
      delete n[memberId]
      return n
    })
    updateMember(memberId, {
      passportFile: null,
      passportKey: undefined,
      passportUrl: undefined,
      passportId: undefined,
    })

    const fileInput = document.getElementById(`passport-${memberId}`) as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const getCountryName = (isoCode: string) => {
    return countries.find((c) => c.isoCode === isoCode)?.name || "Select a country"
  }

  const handleRemoveItinForMember = (memberId: string) => {
    const itinAddonId = `itin-${memberId}`
    const currentAddons = data.addons || []
    const updatedAddons = currentAddons.filter((a) => a.id !== itinAddonId)

    updateData({
      addons: updatedAddons,
      addonsTotal: Math.max(0, (data.addonsTotal || 0) - 149),
    })

    updateMember(memberId, { itinAdded: false })
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-6 md:pb-10">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-950 tracking-tight">Member Information</h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
          Add all members or owners of the business. At least one must be designated as the Responsible Person.
        </p>

        {errors.responsiblePerson && (
          <p className="text-xs text-red-600 mt-3 font-medium">{errors.responsiblePerson}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {(data.members || [])
          .filter((m) => m)
          .map((member, index) => (
            <div key={member.id} className="space-y-4">
              <div className="p-4 md:p-6 rounded-lg border border-slate-200 bg-white space-y-4 md:space-y-5">
                {/* Member Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900">Member {index + 1}</h3>

                  {data.members.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3 text-sm rounded-md w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Responsible Person */}
                <div className="p-3 md:p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={`responsible-${member.id}`}
                      checked={member.isResponsiblePerson}
                      onCheckedChange={(c) => toggleResponsiblePerson(member.id, c as boolean)}
                      disabled={data.members?.length === 1}
                      className="data-[state=checked]:bg-[#ff0d13] data-[state=checked]:border-[#ff0d13] mt-0.5"
                    />
                    <label
                      htmlFor={`responsible-${member.id}`}
                      className="text-xs md:text-sm font-medium text-slate-900 cursor-pointer leading-relaxed"
                    >
                      Responsible Person / Authorized Person
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 ml-6">
                    {data.members?.length === 1
                      ? "As the only member, you are automatically the responsible person."
                      : "Person authorized to represent the company"}
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">Full Legal Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                    <Input
                      placeholder="Muhammad Ahmed Khan"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, { name: e.target.value })}
                      className="pl-10 h-10 md:h-11 text-sm md:text-base"
                    />
                  </div>
                  {errors[`member${index}Name`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Name`]}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">Home Address</Label>
                  <Input
                    placeholder="House 123, Street 4, F-7 Markaz"
                    value={member.address}
                    onChange={(e) => updateMember(member.id, { address: e.target.value })}
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                  {errors[`member${index}Address`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Address`]}</p>
                  )}
                </div>

                {/* City / State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">City</Label>
                    <Input
                      placeholder="Islamabad"
                      value={member.city}
                      onChange={(e) => updateMember(member.id, { city: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                    {errors[`member${index}City`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}City`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">State / Province</Label>
                    <Input
                      placeholder="Punjab"
                      value={member.state}
                      onChange={(e) => updateMember(member.id, { state: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                    {errors[`member${index}State`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}State`]}</p>
                    )}
                  </div>
                </div>

                {/* Country / ZIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">Country</Label>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between pl-10 h-10 md:h-11 relative bg-transparent text-sm md:text-base"
                        >
                          <Globe className="absolute left-3 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                          <span className="truncate">{getCountryName(member.country)}</span>
                          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
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

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">ZIP Code</Label>
                    <Input
                      placeholder="44000"
                      value={member.zip}
                      onChange={(e) => updateMember(member.id, { zip: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                    {errors[`member${index}Zip`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}Zip`]}</p>
                    )}
                  </div>
                </div>

                {/* SSN / ITIN */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">SSN or ITIN (optional)</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 w-4 h-4 md:w-5 md:h-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="XXXXX-XXXXXXX-X"
                      value={member.ssn}
                      onChange={(e) => updateMember(member.id, { ssn: e.target.value })}
                      className="pl-10 h-10 md:h-11 text-sm md:text-base"
                    />
                  </div>
                  <p className="text-xs text-slate-600 flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    Your information is encrypted & secure.
                  </p>
                </div>

                {/* Passport Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">
                    Passport <span className="text-red-600">*</span>
                  </Label>

                  <div className="relative">
                    <Upload className="absolute left-3 w-4 h-4 md:w-5 md:h-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id={`passport-${member.id}`}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handlePassportUpload(member.id, e.target.files?.[0] || null)}
                      className="pl-10 h-10 md:h-11 file:text-sm file:font-medium"
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
                      <div className="flex flex-col gap-4">
                        <div className="space-y-3">
                          <h3 className="text-lg md:text-xl font-semibold text-slate-900 break-words">
                            ITIN Application for {member.name || `Member ${index + 1}`}
                          </h3>

                          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                            Need an ITIN to open bank accounts or file taxes? We handle the complete process for you.
                          </p>

                          <ul className="space-y-2 text-sm md:text-base text-slate-700">
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words">Document checklist & review</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words">Form W-7 preparation</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words">Application guidance & submission</span>
                            </li>
                          </ul>
                        </div>

                        <div className="flex flex-col items-center gap-3 pt-3 border-t border-slate-100 md:border-0 md:pt-0 md:flex-row md:justify-between md:items-center">
                          <div className="text-center md:text-left">
                            <div className="text-3xl md:text-2xl font-bold text-red-600">$149.00</div>
                            <div className="text-sm text-slate-500">per application</div>
                          </div>

                          {member.itinAdded ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full md:w-auto border-red-300 text-red-600 bg-transparent hover:bg-red-50 py-6 md:py-2"
                              onClick={() => handleRemoveItinForMember(member.id)}
                            >
                              <X className="w-5 h-5 md:w-4 md:h-4 mr-2" /> Remove from Order
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              className="w-full md:w-auto bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:opacity-90 py-6 md:py-2 text-base md:text-sm"
                              onClick={() => handleAddItinForMember(member.id)}
                            >
                              <DollarSign className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                              Add to Order
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 text-xs md:text-sm text-slate-500 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Processing time: 6–8 weeks after IRS receives your file
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Add Member Button */}
        <Button
          type="button"
          onClick={addMember}
          variant="outline"
          className="w-full border-slate-300 hover:bg-slate-50 h-11 md:h-12 text-sm md:text-base font-medium bg-transparent"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Add Another Member
        </Button>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 md:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto h-11 px-6 sm:px-8 border-slate-300 hover:bg-slate-50 text-base order-2 sm:order-1 bg-transparent cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={Object.values(uploadingPassports).some((uploading) => uploading)}
            className="w-full sm:w-auto sm:px-8 h-11 px-6 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 text-white font-semibold text-base order-1 sm:order-2 cursor-pointer"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  )
}
