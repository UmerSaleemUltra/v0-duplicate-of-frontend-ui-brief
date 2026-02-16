"use client"
import { useState, useEffect } from "react"
import { ArrowRight, ArrowLeft, Building2, Users, MapPin, Globe, FileText, Shield, Edit2, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CheckoutData } from "@/app/checkout/page"
import { getPassport, arrayBufferToFile, type PassportData } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { STATE_FEES } from "@/lib/constants"

type ReviewStepProps = {
  formData?: CheckoutData
  onBack: () => void
  onNext: () => void
  updateData?: (updates: Partial<CheckoutData>) => void
}

const truncateFilename = (filename: string, maxWords = 6): string => {
  const words = filename.split(/[\s._-]+/)
  if (words.length <= maxWords) {
    return filename
  }
  return words.slice(0, maxWords).join(" ") + "..."
}

export function ReviewStep({ formData, onBack, onNext, updateData }: ReviewStepProps) {
  const { toast } = useToast()
  const [passportData, setPassportData] = useState<Record<string, PassportData | null>>({})
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)

  useEffect(() => {
    const loadPassports = async () => {
      const passports: Record<string, PassportData | null> = {}
      const validMembers = Array.isArray(formData?.members)
        ? formData.members.filter(
            (m): m is NonNullable<typeof m> =>
              m != null && typeof m === "object" && m.id != null && typeof m.id === "string" && m.id.length > 0,
          )
        : []

      for (const member of validMembers) {
        if (member.passportFile || member.passportUrl) {
          try {
            const passport = await getPassport(member.id)
            passports[member.id] = passport
          } catch (error) {
            console.error("Error loading passport for member:", member.id, error)
          }
        }
      }
      setPassportData(passports)
    }
    loadPassports()
  }, [formData])

  const maskSSN = (ssn?: string) =>
    !ssn || ssn.trim() === "" || ssn.length < 4 ? "Not provided" : `***-**-${ssn.slice(-4)}`

  const validMembers = Array.isArray(formData?.members)
    ? formData.members.filter(
        (m): m is NonNullable<typeof m> =>
          m != null && typeof m === "object" && m.id != null && typeof m.id === "string" && m.id.length > 0,
      )
    : []

  const membersWithItin = validMembers.filter((m) => m.itinAdded === true)
  const isAdvancedPackage = formData?.packageType === "advanced"
  const resellerCertIncluded = isAdvancedPackage
  const hasResellerCert = resellerCertIncluded || formData?.needsResellerCertificate === true

  const websitePrice = formData?.upsells?.includes("website") ? 499 : 0

  const basePackagePrice = formData?.packageType === "starter" ? 149 : 249
  const stateFilingFee = STATE_FEES[formData?.state || ""] || 100

  const itinPrice = membersWithItin.length * 199
  const resellerCertPrice = hasResellerCert && !resellerCertIncluded ? 99 : 0

  const addonsTotal = itinPrice + resellerCertPrice + websitePrice
  const subtotal = basePackagePrice + stateFilingFee
  const total = subtotal + addonsTotal

  const handleRemoveItin = (memberId: string) => {
    if (updateData) {
      const updatedMembers = validMembers.map((m) => (m.id === memberId ? { ...m, itinAdded: false } : m))
      updateData({ members: updatedMembers })
    }
  }

  const handleRemoveResellerCert = () => {
    if (updateData) {
      updateData({ needsResellerCertificate: false })
    }
  }

  const handleViewPassport = async (memberId: string) => {
    const passport = passportData[memberId]
    if (passport) {
      const file = arrayBufferToFile(passport)
      const url = URL.createObjectURL(file)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 100)
    }
  }

  const handleProceedToPayment = async () => {
    if (!formData) {
      toast({
        title: "Error",
        description: "Form data is missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare addons array with all selected add-ons
      const addons: any[] = []

      // Add ITIN applications
      membersWithItin.forEach((member) => {
        addons.push({
          serviceId: "itin",
          name: `ITIN Application - ${member.name}`,
          price: 199,
          memberName: member.name,
          memberId: member.id,
        })
      })

      // Add reseller certificate if selected and not included in package
      if (hasResellerCert && !resellerCertIncluded) {
        addons.push({
          serviceId: "reseller-certificate",
          name: "Reseller Certificate",
          price: 99,
        })
      }

      // Add website if selected
      if (websitePrice > 0) {
        addons.push({
          serviceId: "website",
          name: "Business Website",
          price: websitePrice,
        })
      }

      // Update checkout data with pricing and addons
      if (updateData) {
        updateData({
          addons: addons,
          addonsTotal: addonsTotal,
          packagePrice: basePackagePrice,
          stateFilingFee: stateFilingFee,
          totalAmount: total,
        })
      }

      toast({
        title: "Success",
        description: "Order information saved successfully",
      })

      // Proceed to payment
      onNext()
    } catch (error) {
      console.error("Error updating checkout data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save order information",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-6 md:pb-10 overflow-x-hidden max-w-full">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Review Your Business Details</h1>
        <p className="text-sm md:text-base text-slate-700 leading-relaxed">
          Please review your company formation order to ensure everything is correct.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-600 mb-0.5">State</p>
              <p className="font-semibold text-slate-900 truncate">{formData?.state || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">Entity Type</p>
              <p className="font-semibold text-slate-900 truncate">{formData?.entityType || "LLC"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-5 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">Members</p>
              <p className="font-semibold text-slate-900">{formData?.members?.length || 0} member(s)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-slate-900">General Information</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer h-9 px-3 self-start sm:self-auto"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-2 md:space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">State</span>
            <span className="text-sm font-medium text-slate-900">{formData?.state || "N/A"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Entity Type</span>
            <span className="text-sm font-medium text-slate-900">{formData?.entityType || "LLC"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2">
            <span className="text-sm text-slate-700">Members</span>
            <span className="text-sm font-medium text-slate-900">{formData?.members?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-slate-900">Company Information</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer h-9 px-3 self-start sm:self-auto"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-2 md:space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Company Name</span>
            <span className="text-sm font-medium text-slate-900 break-words max-w-full sm:text-right">
              {formData?.businessName || "N/A"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Industry</span>
            <span className="text-sm font-medium text-slate-900 break-words sm:text-right sm:max-w-[60%]">
              {formData?.businessCategory || "General"}
            </span>
          </div>
          {formData?.businessWebsite && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700 flex-shrink-0">Website</span>
              <span className="text-sm font-medium text-slate-900 break-all sm:text-right sm:max-w-[60%]">
                {formData.businessWebsite}
              </span>
            </div>
          )}
          {formData?.businessDescription && (
            <div className="flex flex-col py-2 border-b border-slate-100 gap-2">
              <span className="text-sm text-slate-700">Business Description</span>
              <span className="text-sm text-slate-900 leading-relaxed break-words max-w-full">
                {formData.businessDescription}
              </span>
            </div>
          )}
        </div>
      </div>

      {validMembers.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900">Member Information</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 h-9 px-3 self-start sm:self-auto"
              onClick={onBack}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-4 md:space-y-6">
            {validMembers.map((member, index) => (
              <div key={member.id} className={`${index > 0 ? "pt-4 md:pt-6 border-t border-slate-200" : ""}`}>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#ffffff]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{member.name || "Member"}</p>
                    <p className="text-xs text-slate-500">Member {index + 1}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3 pl-0 sm:pl-13">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Full Name</span>
                    <span className="text-sm font-medium text-slate-900 break-words">{member.name || "N/A"}</span>
                  </div>
                  {member.email && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Email</span>
                      <span className="text-sm font-medium text-slate-900 break-words max-w-full overflow-hidden">
                        {member.email}
                      </span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Phone</span>
                      <span className="text-sm font-medium text-slate-900">{member.phone}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500 flex-shrink-0">Address</span>
                    <span className="text-sm font-medium text-slate-900 sm:text-right break-words max-w-full">
                      {member.address || "N/A"}
                      {(member.city || member.state || member.zip) && (
                        <span className="block mt-1">
                          {[member.city, [member.state, member.zip].filter(Boolean).join(" ")]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">SSN/ITIN</span>
                    <span className="text-sm font-medium text-slate-900">{member.ssn}</span>
                  </div>
                  {member.passportFile && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500 flex-shrink-0">Passport Document</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#ff0d13] flex-shrink-0" />
                        <span
                          className="text-sm font-medium text-slate-900 break-words"
                          title={member.passportFile.name}
                        >
                          {truncateFilename(member.passportFile.name, 6)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 break-words max-w-full leading-tight">
            {formData?.state || "N/A"} {formData?.packageType === "starter" ? "Starter" : "Advanced"} Package
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer h-9 px-3 self-start sm:self-auto"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm md:text-base text-slate-700 break-words leading-relaxed">
              Formation service + state filing included
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-2xl md:text-3xl font-bold text-slate-900">${subtotal}</p>
          </div>
        </div>
      </div>

      {(membersWithItin.length > 0 || hasResellerCert || websitePrice > 0) && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Add-ons (one-time)</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer h-9 px-3 self-start sm:self-auto"
              onClick={onBack}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-3">
            {membersWithItin.map((member, index) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">ITIN Application</p>
                    <p className="text-xs text-slate-700 truncate">For {member.name || "Member"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-lg font-bold text-[#ff0d13]">$199</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItin(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {hasResellerCert && !resellerCertIncluded && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">Reseller Certificate</p>
                    <p className="text-xs text-slate-700">Sales tax exemption for e-commerce</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-lg font-bold text-green-600">$99</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveResellerCert}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {websitePrice > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">Business Website</p>
                    <p className="text-xs text-slate-700">Professional website setup</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-lg font-bold text-[#ff0d13]">${websitePrice}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
            <div className="min-w-0 flex-1">
              <span className="text-sm text-slate-700 block">Formation Package</span>
              <p className="text-xs text-slate-500 mt-0.5 break-words">
                {formData?.state || "N/A"} {formData?.packageType === "starter" ? "Starter" : "Advanced"} Package
              </p>
            </div>
            <span className="text-sm font-medium text-slate-900 flex-shrink-0">${subtotal}</span>
          </div>

          {addonsTotal > 0 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Add-ons</span>
                <span className="text-sm font-medium text-slate-900 flex-shrink-0">${addonsTotal}</span>
              </div>

              {itinPrice > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-4">
                  <span className="text-xs text-slate-600">ITIN Applications ({membersWithItin.length})</span>
                  <span className="text-xs font-medium text-slate-700 flex-shrink-0">${itinPrice}</span>
                </div>
              )}

              {resellerCertPrice > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-4">
                  <span className="text-xs text-slate-600">Reseller Certificate</span>
                  <span className="text-xs font-medium text-slate-700 flex-shrink-0">${resellerCertPrice}</span>
                </div>
              )}

              {resellerCertIncluded && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-4">
                  <span className="text-xs text-emerald-600">Reseller Certificate (Included)</span>
                  <span className="text-xs font-medium text-emerald-600 flex-shrink-0">$0</span>
                </div>
              )}

              {websitePrice > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-4">
                  <span className="text-xs text-slate-600">Business Website</span>
                  <span className="text-xs font-medium text-slate-700 flex-shrink-0">${websitePrice}</span>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t-2 border-slate-300">
            <div className="min-w-0">
              <p className="text-base md:text-lg font-semibold text-slate-900">Grand Total</p>
              <p className="text-xs text-slate-600 mt-0.5">One-time payment</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">${total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isCreatingCompany}
          className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-slate-300 hover:bg-slate-50 bg-white text-slate-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Edit
        </Button>

        <Button
          type="button"
          onClick={handleProceedToPayment}
          className="w-full sm:w-auto h-12 px-10 text-base bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#990000] hover:to-[#ff1a1a] text-white font-semibold"
        >
          Next
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
