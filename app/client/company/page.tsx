"use client"

import { useAuthGuard } from "@/lib/use-auth-guard"
import { ClientShell } from "@/components/client/client-shell"
import { Building2, MapPin, Calendar, Users, DollarSign, AlertCircle, Building, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useSelectedCompany } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

type MemberUI = {
  id: string
  storageKey: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zip: string
  ssn: string
  isResponsiblePerson: boolean
  itinAdded: boolean
  ownership: string
}

export default function CompanyPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("client")
  const { selectedCompanyId } = useSelectedCompany()
  const [companyData, setCompanyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mailCount, setMailCount] = useState(0)
  const [documentCount, setDocumentCount] = useState(0)
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    const fetchCompanyData = async () => {
      setLoading(true)
      console.log("[v0] Fetching company details for:", selectedCompanyId)

      if (!selectedCompanyId) return

      try {
        setError(null)

        const token = authService.getToken()
        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        const [companyResponse, mailResponse, docsResponse, ordersResponse] = await Promise.allSettled([
          ApiClient.companies.getById(selectedCompanyId, token),
          ApiClient.mail.getAll(token),
          ApiClient.documents.getAll(token),
          ApiClient.orders.getAll(token),
        ])

        if (companyResponse.status === "fulfilled") {
          const selectedComp = companyResponse.value.data || companyResponse.value

          if (!selectedComp) {
            setError("Company not found")
            setLoading(false)
            return
          }

          const builtMembers: MemberUI[] = (selectedComp.members ?? []).map((m: any, idx: number) => {
            const firstName = m.firstName || ""
            const middleName = m.middleName || ""
            const lastName = m.lastName || ""

            let fullName = "Not yet"
            if (firstName && lastName) {
              fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`
            } else if (firstName) {
              fullName = firstName
            } else if (m.name) {
              fullName = m.name
            }

            return {
              id: m._id?.toString() || m.id || `member-${idx + 1}`,
              storageKey: m.id || m.memberId || `member-${idx + 1}`,
              name: fullName,
              email: m.email || "",
              phone: m.phone || "",
              address: m.address || "Not yet",
              city: m.city || "Not yet",
              state: m.state || "Not yet",
              country: m.country || "US",
              zip: m.zip || "Not yet",
              ssn: m.ssn && m.ssn.trim() ? `***-**-${String(m.ssn).slice(-4)}` : "Not yet",
              isResponsiblePerson: !!m.isResponsiblePerson,
              itinAdded: !!m.needsItin,
              ownership: `${m.ownershipPercentage || 0}%`,
            }
          })

          if (mailResponse.status === "fulfilled") {
            const allMail = mailResponse.value.data || mailResponse.value.mail || []
            const companyMail = allMail.filter((mail: any) => mail.companyId === selectedCompanyId)
            setMailCount(companyMail.length)
          } else {
            console.error("[v0] Mail fetch error:", mailResponse.reason)
            setMailCount(0)
          }

          if (docsResponse.status === "fulfilled") {
            const allDocs = docsResponse.value.data || docsResponse.value.documents || []
            const companyDocs = allDocs.filter((doc: any) => doc.companyId === selectedCompanyId && !doc.isMailDocument)
            setDocumentCount(companyDocs.length)
          } else {
            console.error("[v0] Documents fetch error:", docsResponse.reason)
            setDocumentCount(0)
          }

          let orderDate = new Date(selectedComp.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })

          // If we have the actual order, use its date
          if (ordersResponse.status === "fulfilled") {
            const allOrders = ordersResponse.value.data || ordersResponse.value.orders || []
            const companyOrder = allOrders.find((order: any) => order.companyId === selectedCompanyId)
            if (companyOrder) {
              setOrderDetails(companyOrder)
              orderDate = new Date(companyOrder.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            }
          }

          setCompanyData({
            businessName: selectedComp.name || "Your Company",
            businessCategory: selectedComp.businessCategory || "Not yet",
            businessDescription: selectedComp.businessDescription || "No description provided",
            website: selectedComp.website || selectedComp.businessWebsite || "Not yet",
            needsResellerCertificate: selectedComp.businessCategory === "Reseller" || false,
            state: selectedComp.state || "Not yet",
            entityType: selectedComp.entityType || "LLC",
            packageType: selectedComp.packageType || "starter",
            orderDate: orderDate,
            ein: selectedComp.ein || "Not yet",
            businessId: selectedComp.businessId || "Not Yet",
            selectedServices: selectedComp.services || [],
            selectedAddons: selectedComp.addons || [],
            purchasedAddons: selectedComp.purchasedAddons || [],
            members: builtMembers,
            registeredAgent: selectedComp.registeredAgent,
            businessAddress: selectedComp.businessAddress,
            itin: selectedComp.itin,
            companyStatus: selectedComp.status || "pending",
            registeredAgentStatus: selectedComp.registeredAgentStatus || "pending",
            businessAddressStatus: selectedComp.businessAddressStatus || "pending",
            serviceStatus: selectedComp.serviceStatus || "pending",
            mailingAddress: selectedComp.mailingAddress,
            mailingAddressStatus: selectedComp.mailingAddressStatus || "pending",
            taxFilingDate: selectedComp.taxFilingDate,
            taxClassification: selectedComp.taxClassification || "Not Yet",
            annualReportFilingDate: selectedComp.annualReportFilingDate,
            irsReturnFilingDate: selectedComp.irsFilingDate, // API returns as irsFilingDate
          })

          console.log(
            "[v0] Tax data fetched - Classification:",
            selectedComp.taxClassification,
            "Annual Report:",
            selectedComp.annualReportFilingDate,
            "IRS Filing:",
            selectedComp.irsFilingDate,
          )
        } else {
          setError("Company not found")
        }

        setLoading(false)
      } catch (err) {
        console.error("[v0] Load company error:", err)
        setError("Failed to load company data")
        setLoading(false)
      }
    }

    fetchCompanyData()

    const handleRefresh = () => {
      console.log("[v0] Company page refresh triggered")
      fetchCompanyData()
    }

    window.addEventListener("client-dashboard-refresh", handleRefresh)

    return () => {
      window.removeEventListener("client-dashboard-refresh", handleRefresh)
    }
  }, [selectedCompanyId])

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

  const hasEIN =
    companyData?.ein &&
    companyData.ein !== "Not yet" &&
    companyData.ein !== "Not Yet Assigned" &&
    companyData.ein !== "Pending" &&
    companyData.ein !== "Not provided" &&
    !companyData.ein.includes("PENDING") &&
    !companyData.ein.includes("pending")

  const hasBusinessId =
    companyData?.businessId &&
    companyData.businessId !== "Not Yet" &&
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

  const hasBusinessAddress =
    companyData?.businessAddress &&
    companyData.businessAddress.address &&
    companyData.businessAddress.address.trim() !== "" &&
    companyData.businessAddress.address !== "Not yet" &&
    companyData.businessAddress.address !== "Not Yet Assigned"

  const hasITIN = companyData?.itin && companyData.itin.trim() !== ""

  const hasMailingAddress =
    companyData?.mailingAddress &&
    (companyData.mailingAddress.street || companyData.mailingAddress.address) &&
    (companyData.mailingAddress.street || companyData.mailingAddress.address).trim() !== "" &&
    (companyData.mailingAddress.street || companyData.mailingAddress.address) !== "Not yet" &&
    (companyData.mailingAddress.street || companyData.mailingAddress.address) !== "Not Yet Assigned"

  const hasTaxInfo =
    (companyData?.taxClassification &&
      companyData.taxClassification.toString().trim() !== "" &&
      companyData.taxClassification !== "Not Yet") ||
    (companyData?.annualReportFilingDate && companyData.annualReportFilingDate.toString().trim() !== "") ||
    (companyData?.irsReturnFilingDate && companyData.irsReturnFilingDate.toString().trim() !== "")

  return (
    <ClientShell>
      <div className="space-y-6 md:space-8">
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
          <h2 className="text-base sm:text-lg font-semibold mb-4">Business Status</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Business Name */}
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

            {/* State of Formation */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">State of Formation</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{companyData.state}</div>
              </div>
            </div>

            {/* Entity Type */}
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

            {/* Package Type */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Package Type</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base capitalize">
                  {companyData.packageType}
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Order Date</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{companyData.orderDate}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Company Status</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">
                  <Badge
                    className={
                      companyData.companyStatus === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 capitalize"
                        : companyData.companyStatus === "inactive"
                          ? "bg-red-50 text-red-700 border-red-200 capitalize"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200 capitalize"
                    }
                  >
                    {companyData.companyStatus || "Pending"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Business ID */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Business ID</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.businessId && companyData.businessId !== "Not Yet" ? (
                    companyData.businessId
                  ) : (
                    <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Not Yet</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* EIN (Employer Identification Number) */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">EIN</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.ein && companyData.ein !== "Not yet" && companyData.ein !== "Not Yet" ? (
                    companyData.ein
                  ) : (
                    <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Not Yet</Badge>
                  )}
                </div>
              </div>
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

        {/* Business Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Business Details</h2>
          <div className="space-y-4">
            <div className="flex flex-col py-2 gap-2">
              <span className="text-slate-600 text-sm sm:text-base text-left">Business Category</span>
              <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                {companyData.businessCategory || "Not specified"}
              </span>
            </div>

            <div className="flex flex-col py-2 gap-2">
              <span className="text-slate-600 text-sm sm:text-base text-left">Business Website</span>
              <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                {companyData.website || "Not yet"}
              </span>
            </div>

            {companyData.businessDescription && (
              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Business Description</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.businessDescription}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tax Information */}
        {hasTaxInfo && (
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Tax Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {companyData?.taxClassification &&
                companyData.taxClassification.toString().trim() !== "" &&
                companyData.taxClassification !== "Not Yet" && (
                  <div className="flex flex-col">
                    <p className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">Tax Classification</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">{companyData.taxClassification}</p>
                  </div>
                )}

              {companyData?.annualReportFilingDate && companyData.annualReportFilingDate.toString().trim() !== "" && (
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">Annual Report Filing Date</p>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {new Date(companyData.annualReportFilingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {companyData?.irsReturnFilingDate && companyData.irsReturnFilingDate.toString().trim() !== "" && (
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">IRS Filing Date</p>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {new Date(companyData.irsReturnFilingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members & Owners */}
        {companyData.members && companyData.members.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Company Members</h2>
            <div className="space-y-6">
              {companyData.members.map((member: MemberUI) => {
                return (
                  <div key={member.id} className="space-y-3">
                    <div className="flex flex-col py-2 gap-2">
                      <span className="text-slate-600 text-sm sm:text-base text-left">Member Name</span>
                      <span className="font-medium text-slate-900 text-sm sm:text-base flex items-center gap-2 text-left">
                        {member.name}
                        {member.isResponsiblePerson && (
                          <Badge className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 text-xs">
                            Responsible Person
                          </Badge>
                        )}
                      </span>
                    </div>

                    {member.email && (
                      <div className="flex flex-col py-2 gap-2">
                        <span className="text-slate-600 text-sm sm:text-base text-left">Email</span>
                        <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                          {member.email}
                        </span>
                      </div>
                    )}

                    {member.phone && (
                      <div className="flex flex-col py-2 gap-2">
                        <span className="text-slate-600 text-sm sm:text-base text-left">Phone</span>
                        <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                          {member.phone}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col py-2 gap-2">
                      <span className="text-slate-600 text-sm sm:text-base text-left">SSN/ITIN</span>
                      <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                        {member.ssn}
                        {member.itinAdded && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs ml-2">
                            ITIN Application Added
                          </Badge>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col py-2 gap-2">
                      <span className="text-slate-600 text-sm sm:text-base text-left">Address</span>
                      <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                        {member.address}, {member.city}, {member.state} {member.zip}, {member.country}
                      </span>
                    </div>

                    {companyData.members.length > 1 &&
                      member !== companyData.members[companyData.members.length - 1] && (
                        <div className="border-t border-slate-200 pt-4 mt-4" />
                      )}
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
            <div className="space-y-4">
              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Registered Agent</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.registeredAgent?.company || companyData.registeredAgent?.name || "Not Yet"}
                </span>
              </div>

              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Address</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.registeredAgent.address ? (
                    <>
                      {companyData.registeredAgent.address}
                      {companyData.registeredAgent.city && `, ${companyData.registeredAgent.city}`}
                      {companyData.registeredAgent.state && `, ${companyData.registeredAgent.state}`}
                      {companyData.registeredAgent.zip && ` ${companyData.registeredAgent.zip}`}
                    </>
                  ) : (
                    "Not Yet"
                  )}
                </span>
              </div>

              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Expiry Date</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.taxFilingDate
                    ? new Date(companyData.taxFilingDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : new Date(
                        new Date(companyData.orderDate).setFullYear(new Date(companyData.orderDate).getFullYear() + 1),
                      ).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>

              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Status</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  <Badge
                    className={
                      companyData.registeredAgentStatus === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 capitalize"
                        : companyData.registeredAgentStatus === "inactive"
                          ? "bg-red-50 text-red-700 border-red-200 capitalize"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200 capitalize"
                    }
                  >
                    {(companyData.registeredAgentStatus || "pending").charAt(0).toUpperCase() +
                      (companyData.registeredAgentStatus || "pending").slice(1)}
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Business Mailing Address */}
        {hasMailingAddress && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Business Mailing Address</h2>
            <div className="space-y-4">
              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Company Name</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.businessName}
                </span>
              </div>

              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Address</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.mailingAddress?.street ? (
                    <>
                      {companyData.mailingAddress.street}
                      {companyData.mailingAddress?.city && `, ${companyData.mailingAddress.city}`}
                      {companyData.mailingAddress?.state && `, ${companyData.mailingAddress.state}`}
                      {companyData.mailingAddress?.zip && ` ${companyData.mailingAddress.zip}`}
                    </>
                  ) : companyData.mailingAddress?.address ? (
                    <>
                      {companyData.mailingAddress.address}
                      {companyData.mailingAddress?.city && `, ${companyData.mailingAddress.city}`}
                      {companyData.mailingAddress?.state && `, ${companyData.mailingAddress.state}`}
                      {companyData.mailingAddress?.zip && ` ${companyData.mailingAddress.zip}`}
                    </>
                  ) : companyData.businessAddress?.address ? (
                    <>
                      {companyData.businessAddress.address}
                      {companyData.businessAddress?.city && `, ${companyData.businessAddress.city}`}
                      {companyData.businessAddress?.state && `, ${companyData.businessAddress.state}`}
                      {companyData.businessAddress?.zip && ` ${companyData.businessAddress.zip}`}
                    </>
                  ) : (
                    <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Not Yet</Badge>
                  )}
                </span>
              </div>

              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Expiry Date</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  {companyData.taxFilingDate
                    ? new Date(companyData.taxFilingDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : new Date(
                        new Date(companyData.orderDate).setFullYear(new Date(companyData.orderDate).getFullYear() + 1),
                      ).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>

              <div className="flex flex-col py-2 gap-2">
                <span className="text-slate-600 text-sm sm:text-base text-left">Status</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base text-left">
                  <Badge
                    className={
                      companyData.mailingAddressStatus === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 capitalize"
                        : companyData.mailingAddressStatus === "inactive"
                          ? "bg-red-50 text-red-700 border-red-200 capitalize"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200 capitalize"
                    }
                  >
                    {(companyData.mailingAddressStatus || "pending").charAt(0).toUpperCase() +
                      (companyData.mailingAddressStatus || "pending").slice(1)}
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Purchased Add-ons */}
        {companyData.purchasedAddons && companyData.purchasedAddons.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Purchased Add-ons</h2>
            <div className="space-y-3">
              {companyData.purchasedAddons.map((addon: any, index: number) => (
                <div key={index}>
                  <div className="py-2">
                    <span className="font-medium text-slate-900 text-sm sm:text-base">{addon.name}</span>
                  </div>
                  {index < companyData.purchasedAddons.length - 1 && <div className="border-t border-slate-200" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ClientShell>
  )
}
