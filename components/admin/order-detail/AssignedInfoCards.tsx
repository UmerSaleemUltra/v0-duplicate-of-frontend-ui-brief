"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, Home, Hash, Building2 } from "lucide-react"

interface AssignedInfoCardsProps {
  company: any
}

interface InfoCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function InfoCard({ title, icon, children }: InfoCardProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-900 font-mono">{value}</p>
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

  const hasITIN =
    company?.itin &&
    company.itin.trim() !== "" &&
    company.itin !== "N/A"

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
        <InfoCard
          title="Registered Agent"
          icon={<UserCheck className="w-5 h-5 text-slate-600" />}
        >
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            {agent.name && (
              <p className="text-sm font-semibold text-slate-900">{agent.name}</p>
            )}
            {agent.company && (
              <p className="text-sm text-slate-700">{agent.company}</p>
            )}
            {agent.address && (
              <p className="text-sm text-slate-700">{agent.address}</p>
            )}
            {agent.city && (
              <p className="text-sm text-slate-700">
                {agent.city}
                {agent.state && `, ${agent.state}`}
                {agent.zip && ` ${agent.zip}`}
              </p>
            )}
            {agent.servicePeriod && (
              <p className="text-xs text-slate-500 mt-2">Service Period: {agent.servicePeriod}</p>
            )}
          </div>
        </InfoCard>
      )}

      {/* Mailing Address */}
      {hasMailing && (
        <InfoCard
          title="Mailing Address"
          icon={<Home className="w-5 h-5 text-slate-600" />}
        >
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-sm font-semibold text-slate-900">Business Mailing Address</p>
            <p className="text-sm text-slate-700">{mailing.street}</p>
            <p className="text-sm text-slate-700">
              {mailing.city}, {mailing.state} {mailing.zip}
            </p>
          </div>
        </InfoCard>
      )}

      {/* EIN */}
      {hasEIN && (
        <InfoCard title="EIN" icon={<Hash className="w-5 h-5 text-slate-600" />}>
          <DataRow label="Employer Identification Number" value={company.ein} />
        </InfoCard>
      )}

      {/* Business ID */}
      {hasBusinessId && (
        <InfoCard title="Business ID" icon={<Building2 className="w-5 h-5 text-slate-600" />}>
          <DataRow label="State Business License ID" value={company.businessId} />
        </InfoCard>
      )}

      {/* ITIN — per member */}
      {itinMembers.length > 0 && (
        <InfoCard title="ITIN" icon={<Hash className="w-5 h-5 text-slate-600" />}>
          <div className="space-y-3">
            {itinMembers.map((entry, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Member</p>
                <p className="text-sm font-semibold text-slate-900">{entry.memberName}</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-2">ITIN Number</p>
                <p className="text-sm font-semibold text-slate-900 font-mono">{entry.itin}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </>
  )
}
