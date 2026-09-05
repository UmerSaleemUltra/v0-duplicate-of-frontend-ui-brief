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
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CheckoutData } from "@/app/checkout/page"
import { getPassport, arrayBufferToFile, type PassportData } from "@/lib/passport-storage"
import { STATE_FEES } from "@/lib/constants"

export function ReviewStep({
  data,
  updateData,
  onNext,
  onBack,
}: {
  data: CheckoutData
  updateData: (updates: Partial<CheckoutData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const [passportData, setPassportData] = useState<Record<string, PassportData | null>>({})

  useEffect(() => {
    const loadPassports = async () => {
      const passports: Record<string, PassportData | null> = {}
      for (const member of data.members || []) {
        if (member.passportFile) {
          try {
            const passport = await getPassport(member.id)
            passports[member.id] = passport
          } catch (error) {}
        }
      }
      setPassportData(passports)
    }
    loadPassports()
  }, [data.members])

  const maskSSN = (ssn?: string) =>
    !ssn || ssn.trim() === "" || ssn.length < 4 ? "Not provided" : `***-**-${ssn.slice(-4)}`

  const membersWithItin = data.members?.filter((m) => m?.itinAdded) || []
  const isAdvancedPackage = data.packageType === "advanced"
  const resellerCertIncluded = isAdvancedPackage
  const hasResellerCert = resellerCertIncluded || data.needsResellerCertificate === true

  const websitePrice = data.upsells?.includes("website") ? 499 : 0

  const basePackagePrice = data.packageType === "starter" ? 149 : 249
  const stateFilingFee = STATE_FEES[data.state] || 100

  const itinPrice = membersWithItin.length * 149
  const resellerCertPrice = hasResellerCert && !resellerCertIncluded ? 99 : 0

  const addonsTotal = itinPrice + resellerCertPrice + websitePrice
  const subtotal = basePackagePrice + stateFilingFee
  const total = subtotal + addonsTotal

  useEffect(() => {
    const purchasedAddons: string[] = []
    if (membersWithItin.length > 0) {
      membersWithItin.forEach((member) => {
        purchasedAddons.push(`itin-${member.id}`)
      })
    }
    if (hasResellerCert) {
      purchasedAddons.push("reseller-certificate")
    }
    if (websitePrice > 0) {
      purchasedAddons.push("business-website")
    }

    updateData({
      purchasedAddons,
      totalAmount: total,
      packagePrice: basePackagePrice,
      stateFilingFee,
      addonsTotal,
    })
  }, [total, membersWithItin.length, hasResellerCert, websitePrice])

  const handleRemoveItin = (memberId: string) => {
    updateData({
      members: data.members.map((m) => (m.id === memberId ? { ...m, itinAdded: false } : m)),
    })
  }

  const handleRemoveResellerCert = () => {
    updateData({ needsResellerCertificate: false })
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
              <p className="font-semibold text-slate-900">{data.state}</p>
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
              <p className="font-semibold text-slate-900">{data.entityType}</p>
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
              <p className="font-semibold text-slate-900">{data.members?.length || 0} member(s)</p>
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
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer
"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">State</span>
            <span className="text-sm font-medium text-slate-900">{data.state}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Entity Type</span>
            <span className="text-sm font-medium text-slate-900">{data.entityType}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-700">Members</span>
            <span className="text-sm font-medium text-slate-900">{data.members?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer
"
            onClick={onBack}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Company Name</span>
            <span className="text-sm font-medium text-slate-900">{data.businessName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Company Ending</span>
            <span className="text-sm font-medium text-slate-900">{data.entityType}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Industry</span>
            <span className="text-sm font-medium text-slate-900">{data.businessCategory || "General"}</span>
          </div>
          {data.businessWebsite && (
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Website</span>
              <span className="text-sm font-medium text-slate-900">{data.businessWebsite}</span>
            </div>
          )}
          {data.businessDescription && (
            <div className="flex flex-col py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700 mb-2">Business Description</span>
              <span className="text-sm text-slate-900 leading-relaxed">{data.businessDescription}</span>
            </div>
          )}
        </div>
      </div>

      {data.members && data.members.length > 0 && (
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
            {data.members.map((member, index) => (
              <div key={index} className={`${index > 0 ? "pt-6 border-t border-slate-200" : ""}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#ffffff]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">Member {index + 1}</p>
                  </div>
                </div>
                <div className="space-y-3 ml-12">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Full Name</span>
                    <span className="text-sm font-medium text-slate-900">{member.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Country</span>
                    <span className="text-sm font-medium text-slate-900">{member.country}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Address</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-xs">
                      {member.address}
                      <br />
                      {member.city}, {member.state} {member.zip}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">SSN/ITIN</span>
                    <span className="text-sm font-medium text-slate-900">{maskSSN(member.ssn)}</span>
                  </div>
                  {member.passportFile && passportData[member.id] && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Passport</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPassport(member.id)}
                        className="text-[#ff0d13] border-[#ff0d13] hover:bg-[#ff0d13]/5 h-8 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Passport
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">{data.state} Formation Package</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer
"
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
              <p className="font-semibold text-slate-900 capitalize">{data.packageType} Package</p>
              <p className="text-sm text-slate-700">Formation service + state filing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">${basePackagePrice}</p>
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
              className="text-[#ff0d13] hover:text-[#d81c20] hover:bg-[#ff0d13]/5 cursor-pointer
"
              onClick={onBack}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-3">
            {membersWithItin.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">ITIN Application</p>
                    <p className="text-xs text-slate-700">For {member.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#ff0d13]">$149</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItin(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 cursor-pointer
"
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
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{data.packageType} Package</p>
            </div>
            <span className="text-sm font-medium text-slate-900">${basePackagePrice}</span>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <span className="text-sm text-slate-700">State Filing Fee</span>
              <p className="text-xs text-slate-500 mt-0.5">{data.state}</p>
            </div>
            <span className="text-sm font-medium text-slate-900">${stateFilingFee}</span>
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
          className="flex-1 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer
"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white font-semibold transition-all cursor-pointer
"
        >
          Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
