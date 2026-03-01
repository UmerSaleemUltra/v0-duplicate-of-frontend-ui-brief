"use client"

import { useState } from "react"
import { UserCheck, Home, Hash, Building2, MapPin, Phone, Copy, Check, Receipt, FileText } from "lucide-react"

interface AssignedInfoCardsProps {
  company: any
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
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

  const itinMembers: { memberName: string; itin: string; assignedAt?: string }[] =
    Array.isArray(company?.itinMembers)
      ? company.itinMembers.filter((entry: any) => entry?.itin && entry.itin.trim() !== "")
      : []

  const mailingAddressString = hasMailing
    ? `${mailing.street}, ${mailing.city}, ${mailing.state} ${mailing.zip}`
    : ""

  const agentAddressString =
    hasAgent && agent.address
      ? `${agent.address}${agent.city ? `, ${agent.city}` : ""}${agent.state ? `, ${agent.state}` : ""}${agent.zip ? ` ${agent.zip}` : ""}`
      : ""

  return (
    <>
      {/* Registered Agent */}
      {hasAgent && (
        <InfoCard title="Registered Agent" icon={<UserCheck className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {agent.name && (
              <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <UserCheck className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{agent.name}</p>
                </div>
                <CopyButton value={agent.name} />
              </div>
            )}
            {agent.address && (
              <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <MapPin className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Address</p>
                  <div className="text-sm text-gray-900 font-medium break-words">
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
                <CopyButton value={agentAddressString} />
              </div>
            )}
            {agent.servicePeriod && (
              <div className="flex items-start gap-3 px-4 py-3">
                <Phone className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Service Period</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{agent.servicePeriod}</p>
                </div>
                <CopyButton value={agent.servicePeriod} />
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
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Address</p>
                <div className="text-sm font-medium break-words">
                  <p className="text-gray-900">{mailing.street}</p>
                  <p className="text-gray-600">
                    {mailing.city}, {mailing.state} {mailing.zip}
                  </p>
                </div>
              </div>
              <CopyButton value={mailingAddressString} />
            </div>
          </div>
        </InfoCard>
      )}

      {/* EIN */}
      {hasEIN && (
        <InfoCard title="EIN" icon={<Hash className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
              <Hash className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Employer Identification Number</p>
                <p className="text-sm text-gray-900 font-semibold font-mono break-all">{company.ein}</p>
              </div>
              <CopyButton value={company.ein} />
            </div>
          </div>
        </InfoCard>
      )}

      {/* Business ID */}
      {hasBusinessId && (
        <InfoCard title="Business ID" icon={<Building2 className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
              <Building2 className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">State Business License ID</p>
                <p className="text-sm text-gray-900 font-semibold font-mono break-all">{company.businessId}</p>
              </div>
              <CopyButton value={company.businessId} />
            </div>
          </div>
        </InfoCard>
      )}

      {/* Tax Information */}
      {(company?.taxClassification || company?.annualReportFilingDate || company?.irsFilingDate || company?.taxNotes) && (
        <InfoCard title="Tax Information" icon={<Receipt className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {company?.taxClassification && (
              <div className="flex items-start gap-3 px-4 py-3">
                <FileText className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Tax Classification</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{company.taxClassification}</p>
                </div>
                <CopyButton value={company.taxClassification} />
              </div>
            )}
            {company?.annualReportFilingDate && (
              <div className="flex items-start gap-3 px-4 py-3">
                <FileText className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Annual Report Date</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{company.annualReportFilingDate}</p>
                </div>
                <CopyButton value={company.annualReportFilingDate} />
              </div>
            )}
            {company?.irsFilingDate && (
              <div className="flex items-start gap-3 px-4 py-3">
                <FileText className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">IRS Filing Date</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{company.irsFilingDate}</p>
                </div>
                <CopyButton value={company.irsFilingDate} />
              </div>
            )}
            {company?.taxNotes && (
              <div className="flex items-start gap-3 px-4 py-3">
                <FileText className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                  <p className="text-sm text-gray-700 leading-relaxed break-words">{company.taxNotes}</p>
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* ITIN — per member */}
      {itinMembers.length > 0 && (
        <InfoCard title="ITIN" icon={<Hash className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {itinMembers.map((entry, idx) => (
              <div key={idx} className="px-4 py-3">
                {entry.memberName && entry.memberName.trim() !== "" && (
                  <div className="flex items-start gap-3 mb-2">
                    <UserCheck className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Member Name</p>
                      <p className="text-sm text-gray-900 font-medium break-words">{entry.memberName}</p>
                    </div>
                    <CopyButton value={entry.memberName} />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">ITIN Number</p>
                    <p className="text-sm text-gray-900 font-semibold font-mono break-all">{entry.itin}</p>
                  </div>
                  <CopyButton value={entry.itin} />
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </>
  )
}
