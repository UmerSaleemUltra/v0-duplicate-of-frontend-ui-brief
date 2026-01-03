"use client"

import type React from "react"

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
import { getPassport, arrayBufferToFile, type PassportData } from "@/lib/passport-storage"
import { STATE_FEES } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"

type ReviewStepProps = {
  formData: CheckoutData
  onBack: () => void
  onNext: () => void
}

export function ReviewStep({ formData, onBack, onNext }: ReviewStepProps) {
  const [passportData, setPassportData] = useState<Record<string, PassportData | null>>({})
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string>("")
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string>("")

  useEffect(() => {
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
  }, [formData?.members])

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

  useEffect(() => {
    const purchasedAddons: any[] = []

    // Add ITIN applications with full details
    if (membersWithItin.length > 0) {
      membersWithItin.forEach((member) => {
        if (member.id) {
          purchasedAddons.push({
            serviceId: "itin",
            name: "ITIN Application",
            memberName: member.name || member.firstName + " " + member.lastName || "Member",
            memberId: member.id,
            price: 149,
          })
        }
      })
    }

    // Add reseller certificate if selected
    if (hasResellerCert && !resellerCertIncluded) {
      purchasedAddons.push({
        serviceId: "reseller-cert",
        name: "Reseller Certificate",
        price: 99,
      })
    }

    // Add website if selected
    if (websitePrice > 0) {
      purchasedAddons.push({
        serviceId: "website",
        name: "Business Website",
        price: websitePrice,
      })
    }
  }, [total, membersWithItin.length, hasResellerCert, websitePrice, basePackagePrice, stateFilingFee, addonsTotal])

  if (!formData || !formData.packageType || !formData.state) {
    console.error("[v0] ReviewStep - Invalid formData:", formData)
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <p className="text-red-600">
          Error: Missing required checkout data. Please go back and complete the previous steps.
        </p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only image files (JPEG, PNG, WEBP) are allowed")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB")
      return
    }

    setReceiptFile(file)
    setUploadError("")

    setIsUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append("receipt", file)
      formData.append("orderId", "temp-" + Date.now())

      const response = await fetch("/api/payment-receipt/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setReceiptUrl(result.data.url)
        toast({
          title: "Receipt uploaded successfully",
          description: "Your payment receipt has been uploaded.",
        })
      } else {
        setUploadError(result.error || "Failed to upload receipt")
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload receipt",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Receipt upload error:", error)
      setUploadError("Failed to upload receipt. Please try again.")
      toast({
        title: "Upload failed",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingReceipt(false)
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
              <p className="font-semibold text-slate-900">{formData.state}</p>
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
              <p className="font-semibold text-slate-900">{formData.entityType}</p>
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
              <p className="font-semibold text-slate-900">{formData.members?.length || 0} member(s)</p>
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
            <span className="text-sm font-medium text-slate-900">{formData.state}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Entity Type</span>
            <span className="text-sm font-medium text-slate-900">{formData.entityType}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-700">Members</span>
            <span className="text-sm font-medium text-slate-900">{formData.members?.length || 0}</span>
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
            <span className="text-sm font-medium text-slate-900">{formData.businessName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Company Ending</span>
            <span className="text-sm font-medium text-slate-900">{formData.entityType}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Industry</span>
            <span className="text-sm font-medium text-slate-900">{formData.businessCategory || "General"}</span>
          </div>
          {formData.businessWebsite && (
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Website</span>
              <span className="text-sm font-medium text-slate-900">{formData.businessWebsite}</span>
            </div>
          )}
          {formData.businessDescription && (
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
            {validMembers.map((member, index) => (
              <div key={member.id} className={`${index > 0 ? "pt-6 border-t border-slate-200" : ""}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#ffffff]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{member.name || "Member"}</p>
                    <p className="text-xs text-slate-500">Member {index + 1}</p>
                  </div>
                </div>
                <div className="space-y-3 ml-12">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Full Name</span>
                    <span className="text-sm font-medium text-slate-900">{member.name || "N/A"}</span>
                  </div>
                  {member.email && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Email</span>
                      <span className="text-sm font-medium text-slate-900">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Phone</span>
                      <span className="text-sm font-medium text-slate-900">{member.phone}</span>
                    </div>
                  )}
                  {member.ownershipPercentage && member.ownershipPercentage > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Ownership</span>
                      <span className="text-sm font-medium text-slate-900">{member.ownershipPercentage}%</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Country</span>
                    <span className="text-sm font-medium text-slate-900">{member.country || "US"}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Address</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-xs">
                      {member.address || "N/A"}
                      <br />
                      {member.city || ""}, {member.state || ""} {member.zip || ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">SSN/ITIN</span>
                    <span className="text-sm font-medium text-slate-900">{maskSSN(member.ssn)}</span>
                  </div>
                  {member.passportFile && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Passport Document</span>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#ff0d13]" />
                        <span className="text-sm font-medium text-slate-900">{member.passportFile.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#880000]/5 to-[#ff0d13]/5 rounded-xl border border-[#ff0d13]/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Payment Bank Account Details</h2>
            <p className="text-sm text-slate-700 mb-4">For the payment, please find the details below:</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-[#ff0d13]/10">
                <div className="w-5 h-5 rounded-full bg-[#ff0d13]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#ff0d13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Bank Name</p>
                  <p className="text-sm font-semibold text-slate-900">United Bank Limited (UBL)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-[#ff0d13]/10">
                <div className="w-5 h-5 rounded-full bg-[#ff0d13]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#ff0d13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Account Title</p>
                  <p className="text-sm font-semibold text-slate-900">BUZZ FILING</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-[#ff0d13]/10">
                <div className="w-5 h-5 rounded-full bg-[#ff0d13]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#ff0d13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Account Number</p>
                  <p className="text-sm font-semibold text-slate-900">1176314943776</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-[#ff0d13]/10">
                <div className="w-5 h-5 rounded-full bg-[#ff0d13]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#ff0d13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">IBAN</p>
                  <p className="text-sm font-semibold text-slate-900">PK22UNIL0109000314943776</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#ff0d13]/5 rounded-lg border border-[#ff0d13]/20">
              <p className="text-xs text-slate-700">
                <span className="font-semibold text-[#ff0d13]">Important:</span> After making the payment, kindly send a
                screenshot with details of your payment. Thank you.
              </p>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed border-slate-300">
              <label htmlFor="receipt-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center py-3">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-700 mb-1">Upload Payment Receipt</p>
                  <p className="text-xs text-slate-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP (max. 5MB)</p>
                </div>
              </label>
              <input
                id="receipt-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleReceiptUpload}
                className="hidden"
                disabled={isUploadingReceipt}
              />

              {isUploadingReceipt && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
                  <svg className="animate-spin h-4 w-4 text-[#ff0d13]" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </div>
              )}

              {receiptFile && !isUploadingReceipt && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">{receiptFile.name}</p>
                      <p className="text-xs text-green-700">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFile(null)
                      setReceiptUrl("")
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {formData.state} {formData.packageType === "starter" ? "Starter" : "Advanced"} Package
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
              <p className="font-semibold text-slate-900 capitalize">{formData.packageType} Package</p>
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
                {formData.state} {formData.packageType === "starter" ? "Starter" : "Advanced"} Package
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
