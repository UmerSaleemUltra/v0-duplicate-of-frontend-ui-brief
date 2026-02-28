"use client"

import { UserCheck, Home, Hash, Building2, MapPin, Phone } from "lucide-react"

interface AssignedInfoCardsProps {
  company: any
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">{icon}</div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function AssignedInfoCards({ company }: AssignedInfoCardsProps) {
  const agent = company?.registeredAgent
  const hasAgent = agent?.name && agent.name.trim() !== ""

  const mailing = company?.mailingAddress
  const hasMailing = mailing?.street && mailing?.city && mailing?.state && mailing?.zip

  const hasEIN =
    company?.ein &&
    company.ein.trim() !== "" &&
    company.ein !== "Pending" &&
    company.ein !== "pending" &&
    company.ein !== "N/A"

  const hasBusinessId =
    company?.businessId &&
    company.businessId.trim() !== "" &&
    !company.businessId.includes("PENDING") &&
    company.businessId !== "BIZ-PENDING" &&
    company.businessId !== "N/A"

  const hasITIN = company?.itin && company.itin.trim() !== "" && company.itin !== "N/A"

  const itinMembers: { memberId: string | null; memberName: string; itin: string; assignedAt?: string }[] =
    company?.itinMembers && Array.isArray(company.itinMembers) && company.itinMembers.length > 0
      ? company.itinMembers
      : hasITIN
        ? [{ memberId: null, memberName: "Member", itin: company.itin }]
        : []

  return (
    <>
      {/* Registered Agent */}
      {hasAgent && (
        <InfoCard title="Registered Agent" icon={<UserCheck className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {agent.name && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <UserCheck className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-28 shrink-0">Name</span>
                <span className="text-sm text-gray-900 font-medium">{agent.name}</span>
              </div>
            )}
            {agent.company && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-28 shrink-0">Company</span>
                <span className="text-sm text-gray-900 font-medium">{agent.company}</span>
              </div>
            )}
            {agent.address && (
              <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <MapPin className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-400 w-28 shrink-0 mt-0.5">Address</span>
                <div className="text-sm text-gray-900 font-medium">
                  <p>{agent.address}</p>
                  {agent.city && (
                    <p className="text-gray-600">
                      {agent.city}
                      {agent.state && `, ${agent.state}`}
                      {agent.zip && ` ${agent.zip}`}
                    </p>
                  )}
                </div>
              </div>
            )}
            {agent.servicePeriod && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-28 shrink-0">Service Period</span>
                <span className="text-sm text-gray-900 font-medium">{agent.servicePeriod}</span>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Mailing Address */}
      {hasMailing && (
        <InfoCard title="Mailing Address" icon={<Home className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
              <MapPin className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-400 w-28 shrink-0 mt-0.5">Address</span>
              <div className="text-sm font-medium">
                <p className="text-gray-900">{mailing.street}</p>
                <p className="text-gray-600">
                  {mailing.city}, {mailing.state} {mailing.zip}
                </p>
              </div>
            </div>
          </div>
        </InfoCard>
      )}

      {/* EIN */}
      {hasEIN && (
        <InfoCard title="EIN" icon={<Hash className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Hash className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="text-xs text-gray-400 w-48 shrink-0">Employer Identification Number</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{company.ein}</span>
            </div>
          </div>
        </InfoCard>
      )}

      {/* Business ID */}
      {hasBusinessId && (
        <InfoCard title="Business ID" icon={<Building2 className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="text-xs text-gray-400 w-48 shrink-0">State Business License ID</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{company.businessId}</span>
            </div>
          </div>
        </InfoCard>
      )}

      {/* ITIN — per member */}
      {itinMembers.length > 0 && (
        <InfoCard title="ITIN" icon={<Hash className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {itinMembers.map((entry, idx) => (
              <div key={idx} className="px-4 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <UserCheck className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-28 shrink-0">Member</span>
                  <span className="text-sm text-gray-900 font-medium">{entry.memberName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-28 shrink-0">ITIN Number</span>
                  <span className="text-sm text-gray-900 font-semibold font-mono">{entry.itin}</span>
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </>
  )
}
