"use client"

import { useAuthGuard } from "@/lib/use-auth-guard"
import { ClientShell } from "@/components/client/client-shell"
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Download,
  FileText,
  X,
  Mail,
  Eye,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { getCheckoutData } from "@/lib/checkout-storage"
import { getDisplayValue } from "@/lib/utils"
import { invoiceStorage, companyStorage, currentUserStorage, addonStorage, mailStorage } from "@/lib/local-storage"
import { documentStorage } from "@/lib/document-storage"

type MemberUI = {
  id: string // UI id (member-1, member-2, ...)
  storageKey: string // REAL persisted id (UUID) or fallback to UI id
  name: string
  address: string
  city: string
  state: string
  country: string
  zip: string
  ssn: string
  isResponsiblePerson: boolean
  itinAdded: boolean
  ownership: string
  passportKey?: string // Optional passport key
}

export default function CompanyPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("client")

  const { selectedCompanyId } = useSelectedCompany()
  const [companyData, setCompanyData] = useState<any>(null)
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [userInvoices, setUserInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserPassport, setCurrentUserPassport] = useState<string | null>(null)
  const [passportFileInfo, setPassportFileInfo] = useState<{ fileName: string; fileType: string } | null>(null)
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false)
  const [addons, setAddons] = useState<any[]>([])
  const [mailCount, setMailCount] = useState(0)
  const [documentCount, setDocumentCount] = useState(0)

  const keyFor = (m: Partial<MemberUI>) => m.storageKey || m.id || ""

  const getAddonName = (addonId: string) => {
    const addon = addons.find((a) => a.id === addonId)
    if (addon) return addon.name

    // Fallback for legacy addon IDs
    if (addonId.startsWith("itin-")) return "ITIN Application"
    if (addonId === "reseller-certificate") return "Reseller Certificate"
    if (addonId === "business-website") return "Business Website"

    return addonId
  }

  useEffect(() => {
    const loadCompanyData = async () => {
      if (!selectedCompanyId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const allAddons = addonStorage.getAll()
        setAddons(allAddons)

        const selectedComp = companyStorage.getById(selectedCompanyId)
        if (!selectedComp) {
          setError("Company not found")
          setLoading(false)
          return
        }

        const savedData = getCheckoutData()

        const builtMembers: MemberUI[] =
          (selectedComp.members ?? []).map((m: any, idx: number) => ({
            id: `member-${idx + 1}`,
            storageKey: m.id || m.memberId || `member-${idx + 1}`,
            name: m.name || "Member",
            address: m.address || "",
            city: m.city || "",
            state: m.state || "",
            country: m.country || "US",
            zip: m.zip || "",
            ssn: m.ssn ? `***-**-${String(m.ssn).slice(-4)}` : "Not provided",
            isResponsiblePerson: !!m.isResponsiblePerson,
            itinAdded: !!m.itinAdded,
            ownership: `${m.ownershipPercentage ?? 100}%`,
            passportKey: m.passportKey, // Include passportKey from member data
          })) || []

        const loadPassports = async () => {
          try {
            const { getPassport, arrayBufferToFile } = await import("@/lib/passport-storage")
            const currentUser = currentUserStorage.get()

            console.log("[v0] Client Company Page - Loading passports")
            console.log("[v0] Selected company ID:", selectedCompanyId)
            console.log("[v0] Total members:", builtMembers.length)

            if (currentUser && builtMembers.length > 0) {
              const responsibleMemberIndex = builtMembers.findIndex((m) => m.isResponsiblePerson)
              if (responsibleMemberIndex !== -1) {
                const responsibleMember = builtMembers[responsibleMemberIndex]
                const originalMember = selectedComp.members[responsibleMemberIndex]
                console.log("[v0] Responsible member found:", responsibleMember.name)
                console.log("[v0] Responsible member index:", responsibleMemberIndex)

                const passportKey =
                  originalMember?.passportKey || `${selectedCompanyId}_member-${responsibleMemberIndex + 1}`
                console.log("[v0] Attempting to load passport with key:", passportKey)

                try {
                  const passportData = await getPassport(passportKey)
                  if (passportData) {
                    console.log("[v0] ✓ Passport found with key:", passportKey)
                    const file = arrayBufferToFile(passportData)
                    const url = URL.createObjectURL(file)
                    console.log("[v0] Passport URL created:", url)
                    setCurrentUserPassport(url)
                    setPassportFileInfo({
                      fileName: passportData.fileName,
                      fileType: passportData.fileType,
                    })
                  } else {
                    console.log("[v0] ⚠ No passport found for responsible person")
                  }
                } catch (error) {
                  console.log("[v0] ✗ Error loading passport:", error)
                }
              } else {
                console.log("[v0] ⚠ No responsible member found")
              }
            }
          } catch (error) {
            console.error("[v0] Error loading passport:", error)
          }
        }

        await loadPassports()

        setCompanyData({
          businessName: selectedComp.name || "Your Company",
          businessCategory: getDisplayValue(selectedComp.businessCategory, "Not provided"),
          businessDescription: getDisplayValue(selectedComp.businessDescription, "No description provided"),
          needsResellerCertificate: selectedComp.businessCategory === "Reseller" || false,
          state: getDisplayValue(selectedComp.state, "Not yet"),
          entityType: selectedComp.entityType || "LLC",
          packageType: selectedComp.packageType || "starter",
          formationDate: selectedComp.formationDate
            ? new Date(selectedComp.formationDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : new Date(selectedComp.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
          ein: getDisplayValue(selectedComp.ein),
          businessId: getDisplayValue(selectedComp.businessId, "BIZ-PENDING"),
          selectedServices: selectedComp.services || [],
          selectedAddons: selectedComp.addons || [],
          purchasedAddons: selectedComp.purchasedAddons || [],
          members: builtMembers,
          registeredAgent: selectedComp.registeredAgent || {
            name: "BuzzFiling Services Inc.",
            address: "100 Ambition Parkway",
            city: "New York",
            state: "NY",
            zip: "10001",
          },
          itin: selectedComp.itin, // Include ITIN from company data
        })

        const allInvoices = invoiceStorage.getAll()
        console.log("[v0] Total mail items in system:", allInvoices.length)
        const companyInvoices = allInvoices.filter((inv) => inv.companyId === selectedCompanyId)
        console.log("[v0] Mail items for this company:", companyInvoices.length)
        setUserInvoices(companyInvoices)

        const allMail = mailStorage.getAll()
        console.log("[v0] Total mail items in system:", allMail.length)
        const companyMail = allMail.filter((mail) => mail.companyId === selectedCompanyId)
        console.log("[v0] Mail items for this company:", companyMail.length)
        setMailCount(companyMail.length)

        const allDocuments = await documentStorage.getByCompanyId(selectedCompanyId)
        const businessDocuments = allDocuments.filter((doc) => !doc.isMailDocument)
        console.log("[v0] Business document items for this company:", businessDocuments.length)
        setDocumentCount(businessDocuments.length)

        setLoading(false)
      } catch (err) {
        console.error("Error loading company data:", err)
        setError("Failed to load company data")
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      loadCompanyData()
    }

    return () => {
      if (currentUserPassport) {
        URL.revokeObjectURL(currentUserPassport)
      }
    }
  }, [selectedCompanyId, isAuthenticated])

  const getAddonDetails = (addonId: string) => {
    const addonMap: Record<string, { name: string; description: string }> = {
      "registered-agent": {
        name: "Registered Agent Service",
        description: "Professional registered agent for your business",
      },
      "compliance-calendar": {
        name: "Compliance Calendar",
        description: "Never miss important filing deadlines",
      },
      "business-website": {
        name: "Business Website",
        description: "Professional website for your business",
      },
      "annual-report": {
        name: "Annual Report Filing",
        description: "Automatic annual report filing",
      },
      "business-license": {
        name: "Business License Research",
        description: "Comprehensive license research",
      },
      trademark: {
        name: "Trademark Registration",
        description: "Federal trademark registration",
      },
      "virtual-address": {
        name: "Virtual Business Address",
        description: "Professional business address with mail forwarding",
      },
    }
    return addonMap[addonId] || { name: addonId, description: "Add-on service" }
  }

  const handleDownloadPassport = () => {
    if (currentUserPassport) {
      const link = document.createElement("a")
      link.href = currentUserPassport
      link.download = passportFileInfo?.fileName || "my_passport.jpg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (authLoading) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying authentication...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Loading company information...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (error) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
              Retry
            </Button>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (!companyData) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-slate-600">No company selected</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  const displayAddons = companyData?.purchasedAddons || []
  const hasEIN =
    companyData?.ein &&
    companyData.ein !== "Not yet" &&
    companyData.ein !== "Not Yet Assigned" &&
    companyData.ein !== "Pending" &&
    companyData.ein !== "Not provided" &&
    companyData.ein.trim() !== "" &&
    !companyData.ein.includes("PENDING") &&
    !companyData.ein.includes("pending")

  const hasBusinessId =
    companyData?.businessId &&
    companyData.businessId !== "BIZ-PENDING" &&
    companyData.businessId !== "Not yet" &&
    companyData.businessId !== "Not Yet Assigned" &&
    companyData.businessId !== "Pending" &&
    companyData.businessId !== "Not provided" &&
    !companyData.businessId.includes("PENDING") &&
    !companyData.businessId.includes("pending") &&
    companyData.businessId.trim() !== ""

  const hasRegisteredAgent =
    companyData?.registeredAgent &&
    companyData.registeredAgent.address &&
    companyData.registeredAgent.address.trim() !== "" &&
    companyData.registeredAgent.address !== "100 Ambition Parkway" &&
    companyData.registeredAgent.address !== "Not yet" &&
    companyData.registeredAgent.address !== "Not Yet Assigned" &&
    companyData.registeredAgent.name !== "BuzzFiling Services Inc." &&
    companyData.registeredAgent.name !== "BuzzFiling Services" &&
    companyData.registeredAgent.name !== "BuzzFiling Registered Agent Services"

  return (
    <ClientShell>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Company Information</h1>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base">
              Complete business details from registration
            </p>
          </div>
        </div>

        {/* Company Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">
            <h2 className="text-base sm:text-lg font-semibold">Company Status</h2>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">Active</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Business Name</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base break-words">
                  {companyData.businessName}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Formation Date</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{companyData.formationDate}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">State of Formation</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{companyData.state}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Entity Type</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.entityType === "LLC" ? "Limited Liability Company (LLC)" : "S Corporation"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Mail Items</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{mailCount} items</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Documents</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{documentCount} items</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Business Details</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
              <span className="text-slate-600 text-sm sm:text-base">Business Category</span>
              <span className="font-medium text-slate-900 text-sm sm:text-base">{companyData.businessCategory}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
              <span className="text-slate-600 text-sm sm:text-base">Package Type</span>
              <span className="font-medium text-slate-900 text-sm sm:text-base capitalize">
                {companyData.packageType}
              </span>
            </div>
            {hasEIN && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">EIN</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base font-mono">{companyData.ein}</span>
              </div>
            )}
            {hasBusinessId && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">Business ID</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base font-mono">
                  {companyData.businessId}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-600 text-sm sm:text-base mb-2">Business Description</div>
              <p className="text-slate-900 text-sm sm:text-base leading-relaxed">{companyData.businessDescription}</p>
            </div>
          </div>
        </div>

        {/* Additional Services */}
        {companyData.needsResellerCertificate && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Additional Services</h2>
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-slate-50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm sm:text-base">Reseller Certificate</div>
                <div className="text-xs sm:text-sm text-slate-600">Tax exempt purchasing for wholesale</div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
            </div>
          </div>
        )}

        {/* Members & Owners */}
        {companyData.members && companyData.members.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Members & Owners</h2>
            <div className="space-y-4">
              {companyData.members.map((member: MemberUI) => {
                const mKey = keyFor(member)
                return (
                  <div
                    key={member.id}
                    className="p-4 sm:p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-slate-900 text-sm sm:text-base">{member.name}</div>
                          {member.isResponsiblePerson && (
                            <Badge className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 text-xs">
                              Responsible Person
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Member</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-medium text-slate-900 text-sm sm:text-base">{member.ownership}</div>
                        <div className="text-xs sm:text-sm text-slate-600">Ownership</div>
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                      <div>
                        <div className="text-xs text-slate-600 mb-1">Address</div>
                        <div className="text-sm text-slate-900">{member.address}</div>
                        <div className="text-sm text-slate-900">
                          {member.city}, {member.state} {member.zip}
                        </div>
                        <div className="text-sm text-slate-900">{member.country}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 mb-1">SSN/ITIN</div>
                        <div className="text-sm text-slate-900 font-mono">{member.ssn}</div>
                        {member.itinAdded && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-2">
                            ITIN Application Added
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Registered Agent */}
        {hasRegisteredAgent && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Registered Agent</h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">Agent Name</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.registeredAgent?.name}
                </span>
              </div>
              {companyData.registeredAgent?.company && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                  <span className="text-slate-600 text-sm sm:text-base">Company</span>
                  <span className="font-medium text-slate-900 text-sm sm:text-base">
                    {companyData.registeredAgent.company}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">Full Address</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-right">
                  {companyData.registeredAgent?.address}
                  {companyData.registeredAgent?.city && `, ${companyData.registeredAgent.city}`}
                  {companyData.registeredAgent?.state && `, ${companyData.registeredAgent.state}`}
                  {companyData.registeredAgent?.zip && ` ${companyData.registeredAgent.zip}`}
                </span>
              </div>
              {companyData.registeredAgent?.phone && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                  <span className="text-slate-600 text-sm sm:text-base">Phone</span>
                  <span className="font-medium text-slate-900 text-sm sm:text-base">
                    {companyData.registeredAgent.phone}
                  </span>
                </div>
              )}
              {companyData.registeredAgent?.email && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                  <span className="text-slate-600 text-sm sm:text-base">Email</span>
                  <span className="font-medium text-slate-900 text-sm sm:text-base">
                    {companyData.registeredAgent.email}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">Service Period</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.formationDate} -{" "}
                  {new Date(
                    new Date(companyData.formationDate).setFullYear(
                      new Date(companyData.formationDate).getFullYear() + 1,
                    ),
                  ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">Status</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">Active</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Purchased Add-ons Section */}
        {companyData.purchasedAddons && companyData.purchasedAddons.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-[#ff0d13]" />
              <h2 className="text-base sm:text-lg font-semibold">Purchased Add-ons</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {companyData.purchasedAddons.map((addonId: string) => {
                const addonName = getAddonName(addonId)
                const addon = addons.find((a) => a.id === addonId)

                const isItin = addonId.startsWith("itin-")
                const memberName = isItin
                  ? companyData.members?.find((m: any) => addonId === `itin-${m.id}`)?.name || "Member"
                  : ""

                return (
                  <div key={addonId} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="font-medium text-slate-900 text-sm">
                      {isItin ? `ITIN Application - ${memberName}` : addonName}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {addon?.description ||
                        (isItin
                          ? "Tax ID application service"
                          : addonId === "reseller-certificate"
                            ? "Sales tax exemption"
                            : addonId === "business-website"
                              ? "Professional website"
                              : "Add-on service")}
                    </div>
                    <Badge className="mt-2 bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                      {addon?.price
                        ? `$${addon.price}`
                        : isItin
                          ? "$149"
                          : addonId === "reseller-certificate"
                            ? "$99"
                            : addonId === "business-website"
                              ? "$499"
                              : "Active"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ITIN Information Section */}
        {companyData.itin && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold">ITIN Information</h2>
                <p className="text-slate-600 text-xs sm:text-sm">Individual Taxpayer Identification Number</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">ITIN Number</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base font-mono">{companyData.itin}</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800">
                  Your ITIN has been successfully processed and assigned to your company.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Passport Document Section */}
        {currentUserPassport && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Passport Document</h2>
                  <p className="text-slate-600 text-xs sm:text-sm">Your uploaded identification document</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#ff0d13]" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{passportFileInfo?.fileName || "Passport.jpg"}</div>
                      <div className="text-sm text-slate-600">{passportFileInfo?.fileType || "image/jpeg"}</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Verified</Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
               
                 
                </div>
              </div>
            </div>

            {/* Passport Modal for viewing passport */}
            
          </>
        )}
      </div>
    </ClientShell>
  )
}
