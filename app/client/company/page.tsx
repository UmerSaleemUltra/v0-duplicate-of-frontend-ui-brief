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
  FileText,
  Mail,
  Building,
} from "lucide-react"
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
    const loadCompanyData = async () => {
      if (!selectedCompanyId) return

      try {
        setLoading(true)
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
            businessId: selectedComp.businessId || "BIZ-PENDING",
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
            itin: selectedComp.itin,
          })
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

    loadCompanyData()
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

  const hasITIN = companyData?.itin && companyData.itin.trim() !== ""

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
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Order Date</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">{companyData.orderDate}</div>
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
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">EIN Number</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.ein || "Not Assigned"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-slate-600 mb-1">Business ID</div>
                <div className="font-medium text-slate-900 text-sm sm:text-base">
                  {companyData.businessId || "Not Assigned"}
                </div>
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
              <span className="text-slate-600 text-sm sm:text-base">Business Website</span>
              <span className="font-medium text-slate-900 text-sm sm:text-base">{companyData.website}</span>
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
                <span className="font-medium text-slate-900 text-sm sm:text-base ">{companyData.ein}</span>
              </div>
            )}
            {hasBusinessId && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">Business ID</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base ">{companyData.businessId}</span>
              </div>
            )}
            {hasITIN && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-slate-600 text-sm sm:text-base">ITIN</span>
                <span className="font-medium text-slate-900 text-sm sm:text-base ">{companyData.itin}</span>
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
                return (
                  <div
                    key={member.id}
                    className="p-4 sm:p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                      {member.email && (
                        <div>
                          <div className="text-xs text-slate-600 mb-1">Email</div>
                          <div className="text-sm text-slate-900">{member.email}</div>
                        </div>
                      )}
                      {member.phone && (
                        <div>
                          <div className="text-xs text-slate-600 mb-1">Phone</div>
                          <div className="text-sm text-slate-900">{member.phone}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-slate-600 mb-1">SSN/ITIN</div>
                        <div className="text-sm text-slate-900 ">{member.ssn}</div>
                        {member.itinAdded && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-2">
                            ITIN Application Added
                          </Badge>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-slate-600 mb-1">Address</div>
                        <div className="text-sm text-slate-900">{member.address}</div>
                        <div className="text-sm text-slate-900">
                          {member.city}, {member.state} {member.zip}
                        </div>
                        <div className="text-sm text-slate-900">{member.country}</div>
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
                  {companyData.orderDate} -{" "}
                  {new Date(
                    new Date(companyData.orderDate).setFullYear(new Date(companyData.orderDate).getFullYear() + 1),
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
              {companyData.purchasedAddons.map((addon: any, index: number) => {
                const addonName = typeof addon === "string" ? addon : addon.name || "Unknown Add-on"

                const addonPrice = typeof addon === "object" && addon.price ? `$${addon.price}` : ""

                const addonKey =
                  typeof addon === "string"
                    ? `${addon}-${index}`
                    : `${addon.serviceId || addon.name}-${addon.memberId || index}`

                return (
                  <div key={addonKey} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium text-slate-900 text-sm flex-1">{addonName}</div>
                      {addonPrice && <div className="font-semibold text-[#ff0d13] text-sm">{addonPrice}</div>}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">Active</Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </ClientShell>
  )
}
