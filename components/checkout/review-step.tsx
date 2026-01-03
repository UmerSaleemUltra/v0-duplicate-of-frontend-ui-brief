"use client"
import { useState, useEffect } from "react"
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  Package,
  MapPin,
  Globe,
  FileText,
  Shield,
  Edit2,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CheckoutData } from "@/app/checkout/page"
import { getPassport, arrayBufferToFile, type PassportData } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { STATE_FEES } from "@/lib/constants"

type ReviewStepProps = {
  formData?: CheckoutData
  onBack: () => void
  onNext: () => void
}

export function ReviewStep({ formData, onBack, onNext }: ReviewStepProps) {
  const { toast } = useToast()
  const [passportData, setPassportData] = useState<Record<string, PassportData | null>>({})

  useEffect(() => {
    console.log("[v0] ReviewStep formData:", {
      hasFormData: !!formData,
      state: formData?.state,
      businessName: formData?.businessName,
      packageType: formData?.packageType,
      members: formData?.members?.length,
    })

    const loadPassports = async () => {
      const passports: Record<string, PassportData | null> = {}
      const validMembers = Array.isArray(formData?.members)
        ? formData.members.filter(
            (m): m is NonNullable<typeof m> =>
              m != null && typeof m === "object" && m.id != null && typeof m.id === "string" && m.id.length > 0,
          )
        : []

      console.log("[v0] Loading passports for", validMembers.length, "members")

      for (const member of validMembers) {
        if (member.passportFile || member.passportUrl) {
          try {
            const passport = await getPassport(member.id)
            passports[member.id] = passport
            console.log("[v0] Loaded passport for member:", member.id)
          } catch (error) {
            console.error("[v0] Error loading passport for member:", member.id, error)
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

  console.log("[v0] ReviewStep - Valid members count:", validMembers.length)

  const membersWithItin = validMembers.filter((m) => m.itinAdded === true)
  const isAdvancedPackage = formData?.packageType === "advanced"
  const resellerCertIncluded = isAdvancedPackage
  const hasResellerCert = resellerCertIncluded || formData?.needsResellerCertificate === true

  const websitePrice = formData?.upsells?.includes("website") ? 499 : 0

  const basePackagePrice = formData?.packageType === "starter" ? 149 : 249
  const stateFilingFee = STATE_FEES[formData?.state || ""] || 100

  const itinPrice = membersWithItin.length * 149
  const resellerCertPrice = hasResellerCert && !resellerCertIncluded ? 99 : 0

  const addonsTotal = itinPrice + resellerCertPrice + websitePrice
  const subtotal = basePackagePrice + stateFilingFee
  const total = subtotal + addonsTotal

  const handleRemoveItin = (memberId: string) => {
    const updatedMembers = validMembers.map((m) => (m.id === memberId ? { ...m, itinAdded: false } : m))
    // Assuming updateData is available in the context or passed as a prop
    // updateData({ members: updatedMembers })
  }

  const handleRemoveResellerCert = () => {
    // Assuming updateData is available in the context or passed as a prop
    // updateData({ needsResellerCertificate: false })
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

  const handleSubmit = async () => {}

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Review Your Business Details</h1>
        <p className="text-slate-700">Please review your company formation order to ensure everything is correct.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-0.5">State</p>
              <p className="font-semibold text-slate-900">{formData?.state || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Entity Type</p>
              <p className="font-semibold text-slate-900">{formData?.entityType || "LLC"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Members</p>
              <p className="font-semibold text-slate-900">{formData?.members?.length || 0} member(s)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">General Information</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">State</span>
            <span className="text-sm font-medium text-slate-900">{formData?.state || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Entity Type</span>
            <span className="text-sm font-medium text-slate-900">{formData?.entityType || "LLC"}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-700">Members</span>
            <span className="text-sm font-medium text-slate-900">{formData?.members?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Company Name</span>
            <span className="text-sm font-medium text-slate-900">{formData?.businessName || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Company Ending</span>
            <span className="text-sm font-medium text-slate-900">{formData?.entityType || "LLC"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Industry</span>
            <span className="text-sm font-medium text-slate-900">{formData?.businessCategory || "General"}</span>
          </div>
          {formData?.businessWebsite && (
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Website</span>
              <span className="text-sm font-medium text-slate-900">{formData.businessWebsite}</span>
            </div>
          )}
          {formData?.businessDescription && (
            <div className="flex flex-col py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700 mb-2">Business Description</span>
              <span className="text-sm text-slate-900 leading-relaxed">{formData.businessDescription}</span>
            </div>
          )}
        </div>
      </div>

      {validMembers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Member Information</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5"
              onClick={onBack}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-6">
            {(formData?.members || []).map((member, index) => (
              <div key={member.id || index} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-slate-400" />
                  <h4 className="font-medium text-slate-900">{member.name || `Member ${index + 1}`}</h4>
                  {member.isResponsiblePerson && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded">
                      Responsible Person
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Address</span>
                  <span className="text-sm font-medium text-slate-900 text-right">{member.address || "N/A"}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">City, State ZIP</span>
                  <span className="text-sm font-medium text-slate-900">
                    {member.city}, {member.state} {member.zip}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Country</span>
                  <span className="text-sm font-medium text-slate-900">{member.country || "US"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {formData?.state || "N/A"} {formData?.packageType === "starter" ? "Starter" : "Advanced"} Package
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#ffffff]" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 capitalize">{formData?.packageType || "starter"} Package</p>
              <p className="text-sm text-slate-700">Formation service + state filing included</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">${subtotal}</p>
          </div>
        </div>
      </div>

      {(membersWithItin.length > 0 || hasResellerCert || websitePrice > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Add-ons (one-time)</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer"
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
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">ITIN Application</p>
                    <p className="text-xs text-slate-700">For {member.name || "Member"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#ff0d13]">$149</span>
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
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Reseller Certificate</p>
                    <p className="text-xs text-slate-700">Sales tax exemption for e-commerce</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-600">$99</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveResellerCert}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {resellerCertIncluded && (
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-600">Reseller Certificate (Included)</p>
                    <p className="text-xs text-emerald-600">Sales tax exemption for e-commerce</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-600">$0</span>
              </div>
            )}

            {websitePrice > 0 && (
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Business Website</p>
                    <p className="text-xs text-slate-700">Professional website design</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#ff0d13]">${websitePrice}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <span className="text-sm text-slate-700">Formation Package</span>
              <p className="text-xs text-slate-500 mt-0.5">
                {formData?.state || "N/A"} {formData?.packageType === "starter" ? "Starter" : "Advanced"} Package
              </p>
            </div>
            <span className="text-sm font-medium text-slate-900">${subtotal}</span>
          </div>

          {addonsTotal > 0 && (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Add-ons</span>
                <span className="text-sm font-medium text-slate-900">${addonsTotal}</span>
              </div>

              {itinPrice > 0 && (
                <div className="flex items-center justify-between pl-4">
                  <span className="text-xs text-slate-600">ITIN Applications ({membersWithItin.length})</span>
                  <span className="text-xs font-medium text-slate-700">${itinPrice}</span>
                </div>
              )}

              {resellerCertPrice > 0 && (
                <div className="flex items-center justify-between pl-4">
                  <span className="text-xs text-slate-600">Reseller Certificate</span>
                  <span className="text-xs font-medium text-slate-700">${resellerCertPrice}</span>
                </div>
              )}

              {resellerCertIncluded && (
                <div className="flex items-center justify-between pl-4">
                  <span className="text-xs text-emerald-600">Reseller Certificate (Included)</span>
                  <span className="text-xs font-medium text-emerald-600">$0</span>
                </div>
              )}

              {websitePrice > 0 && (
                <div className="flex items-center justify-between pl-4">
                  <span className="text-xs text-slate-600">Business Website</span>
                  <span className="text-xs font-medium text-slate-700">${websitePrice}</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t-2 border-slate-300">
            <div>
              <p className="text-lg font-semibold text-slate-900">Grand Total</p>
              <p className="text-xs text-slate-600 mt-0.5">One-time payment</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">${total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white font-semibold transition-all cursor-pointer"
        >
          Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
