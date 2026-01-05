"use client"
import { useState, useMemo, useEffect } from "react"
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  DollarSign,
  Upload,
  Globe,
  ChevronDown,
  FileText,
  Eye,
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
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      country: "PK",
      zip: "",
      ssn: "",
      phone: "",
      dateOfBirth: "",
      isResponsiblePerson: (data.members || []).length === 0,
      itinAddon: false,
      passportFile: null,
      passportKey: undefined,
      passportUrl: undefined,
      passportId: undefined, // New field for storing passport database ID
    }
    updateData({ members: [...(data.members || []), newMember] })
  }

  const removeMember = (id: string) => {
    if (data.members?.length > 1) {
      // Revoke blob URL for this member's passport preview
      if (passportPreviews[id]) {
        URL.revokeObjectURL(passportPreviews[id])
      }

      // Remove member from data
      const updatedMembers = (data.members || []).filter((m) => m.id !== id)

      // If we removed the responsible person, make the first remaining member responsible
      const hadResponsible = data.members.find((m) => m.id === id)?.isResponsiblePerson
      if (hadResponsible && updatedMembers.length > 0) {
        updatedMembers[0].isResponsiblePerson = true
      }

      updateData({ members: updatedMembers })

      // Clean up state for this member
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

      // Clear any errors for this member
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

  const toggleItinAddon = (id: string) => {
    updateData({
      members: (data.members || []).map((m) => ({
        ...m,
        itinAddon: !m.itinAddon,
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
      if (!member.firstName) newErrors[`member${index}FirstName`] = "First Name is required"
      if (!member.lastName) newErrors[`member${index}LastName`] = "Last Name is required"
      if (!member.address) newErrors[`member${index}Address`] = "Address is required"
      if (!member.city) newErrors[`member${index}City`] = "City is required"
      if (!member.state) newErrors[`member${index}State`] = "State/Province is required"
      if (!member.country) newErrors[`member${index}Country`] = "Country is required"
      if (!member.zip) newErrors[`member${index}Zip`] = "ZIP code is required"
      if (!member.phone) newErrors[`member${index}Phone`] = "Phone Number is required"
      if (!member.dateOfBirth) newErrors[`member${index}DateOfBirth`] = "Date of Birth is required"
      if (!member.ssn) newErrors[`member${index}SSN`] = "SSN/ITIN is required"
      if (!member.passportUrl) {
        newErrors[`member${index}Passport`] = "Passport Copy is required"
      }
    })

    setErrors(newErrors)
    console.log("[v0] Validation errors found:", newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    console.log("[v0] Owner info form submitted")
    console.log("[v0] Members:", data.members)
    console.log("[v0] Validating...")

    const hasUploading = Object.values(uploadingPassports).some((uploading) => uploading)
    if (hasUploading) {
      console.log("[v0] Passport upload in progress, please wait...")
      return
    }

    if (validate()) {
      console.log("[v0] Validation passed, calling onNext")
      onNext()
    } else {
      console.log("[v0] Validation failed, errors:", errors)
    }
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
      console.log("[v0] Upload already in progress for this member")
      return
    }

    if (!data.userId) {
      console.error("[v0] User ID is missing")
      return
    }

    const member = data.members.find((m) => m.id === memberId)
    if (!member) {
      console.error("[v0] Member not found")
      return
    }

    const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unknown Member"

    setUploadingPassports((prev) => ({ ...prev, [memberId]: true }))

    try {
      console.log("[v0] Uploading passport to Vercel Blob...")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", data.userId)

      // Get companyId from localStorage if available (created in review step)
      const companyDataStr = localStorage.getItem("companyData")
      if (companyDataStr) {
        try {
          const companyData = JSON.parse(companyDataStr)
          if (companyData.id) {
            formData.append("companyId", companyData.id)
          }
        } catch (e) {
          console.log("[v0] No company data yet, proceeding without companyId")
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
      console.log("[v0] Passport uploaded successfully:", result)

      // Create preview URL for display
      const blobUrl = URL.createObjectURL(file)
      setPassportPreviews((prev) => ({ ...prev, [memberId]: blobUrl }))

      updateMember(memberId, {
        passportFile: file,
        passportKey: result.data?.fileUrl || result.url,
        passportUrl: result.data?.fileUrl || result.url,
        passportId: result.data?.id, // Store the database ID for future reference
      })
    } catch (error) {
      console.error("[v0] Error uploading passport:", error)
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

                {/* First Name / Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">
                      First Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      placeholder="John"
                      value={member.firstName}
                      onChange={(e) => updateMember(member.id, { firstName: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                    {errors[`member${index}FirstName`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}FirstName`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">
                      Last Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      placeholder="Doe"
                      value={member.lastName}
                      onChange={(e) => updateMember(member.id, { lastName: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                    {errors[`member${index}LastName`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}LastName`]}</p>
                    )}
                  </div>
                </div>

                {/* Date of Birth / SSN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">
                      Date of Birth <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={member.dateOfBirth}
                      onChange={(e) => updateMember(member.id, { dateOfBirth: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                    {errors[`member${index}DateOfBirth`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}DateOfBirth`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">
                      SSN/ITIN <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      placeholder="***-**-8637"
                      value={member.ssn}
                      onChange={(e) => updateMember(member.id, { ssn: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                      maxLength={11}
                    />
                    {errors[`member${index}SSN`] && (
                      <p className="text-xs text-red-600">{errors[`member${index}SSN`]}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">
                    Phone Number <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={member.phone}
                    onChange={(e) => updateMember(member.id, { phone: e.target.value })}
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                  {errors[`member${index}Phone`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Phone`]}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">
                    Street Address <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    placeholder="123 Main St, Apt 4B"
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

                {/* Passport Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">
                    Passport Copy <span className="text-red-600">*</span>
                  </Label>
                  <p className="text-xs md:text-sm text-slate-600">
                    Upload a clear copy of the member's passport or government-issued ID
                  </p>

                  {member.passportUrl ? (
                    <div className="p-3 md:p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-slate-900 truncate">Passport uploaded</p>
                            <p className="text-xs text-slate-600">Click to view or change</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(member.passportUrl, "_blank")}
                            className="flex-1 sm:flex-none h-9 text-xs md:text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateMember(member.id, { passportUrl: null, passportFile: null })
                            }}
                            className="flex-1 sm:flex-none h-9 text-xs md:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handlePassportUpload(member.id, e.target.files?.[0] || null)}
                        disabled={uploadingPassports[member.id]}
                        className="h-10 md:h-11 text-sm cursor-pointer"
                      />
                      {uploadingPassports[member.id] && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-2">
                          <Upload className="w-3 h-3 animate-pulse" />
                          Uploading...
                        </p>
                      )}
                    </div>
                  )}
                  {errors[`member${index}Passport`] && (
                    <p className="text-xs text-red-600">{errors[`member${index}Passport`]}</p>
                  )}
                </div>

                {/* ITIN Addon Card */}
                {data.selectedState === "Wyoming" && (
                  <div className="p-4 md:p-6 rounded-lg border-2 border-red-100 bg-red-50/50 hover:border-red-200 transition-all duration-200">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <h3 className="text-base md:text-lg font-semibold text-slate-900">
                            ITIN Application for {member.firstName || `Member ${index + 1}`}
                          </h3>

                          <p className="text-sm text-slate-600">
                            Need an ITIN to open bank accounts or file taxes? We handle the complete process for you.
                          </p>

                          <ul className="space-y-2 text-xs md:text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words">Document checklist & review</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words">Form W-7 preparation</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="break-words">Application guidance & submission</span>
                            </li>
                          </ul>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-3">
                          <div className="text-left lg:text-right">
                            <div className="text-xl md:text-2xl font-bold text-red-600">$149.00</div>
                            <p className="text-xs md:text-sm text-slate-600 mt-1">One-time fee</p>
                          </div>

                          <Button
                            type="button"
                            variant={member.itinAddon ? "default" : "outline"}
                            onClick={() => toggleItinAddon(member.id)}
                            className={`w-full lg:w-auto h-10 md:h-11 px-4 md:px-6 text-sm md:text-base ${
                              member.itinAddon
                                ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 text-white"
                                : "border-red-600 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {member.itinAddon ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Added
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Add ITIN Service
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {member.itinAddon && (
                        <div className="pt-3 border-t border-red-200">
                          <p className="text-xs md:text-sm text-green-700 font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            ITIN service added - Processing time: 6-8 weeks
                          </p>
                        </div>
                      )}
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
