"use client"

import { Button } from "@/components/ui/button"
import { Users, User, UserCheck, FileText, AlertCircle, Mail, Phone, MapPin, Shield } from "lucide-react"

interface MembersCardProps {
  members: any[]
}

export function MembersCard({ members }: MembersCardProps) {
  if (!members || members.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Business Owners / Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {members.length} member{members.length !== 1 ? "s" : ""} registered
            </p>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="divide-y divide-gray-100">
        {members.map((member: any, index: number) => (
          <div key={member.id || index} className="px-6 py-6">
            {/* Member Header Row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    member.responsiblePerson ? "bg-gray-900" : "bg-gray-100"
                  }`}
                >
                  <User className={`w-4.5 h-4.5 ${member.responsiblePerson ? "text-white" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{member.name || "N/A"}</p>
                  {member.responsiblePerson && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500 font-medium">Responsible Person</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                Member {index + 1}
              </span>
            </div>

            {/* Info Fields — Apple-style bordered rows */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {member.email && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <Mail className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-24 shrink-0">Email</span>
                  <span className="text-sm text-gray-800 font-medium truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <Phone className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-24 shrink-0">Phone</span>
                  <span className="text-sm text-gray-800 font-medium">{member.phone}</span>
                </div>
              )}
              {member.address && (
                <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <MapPin className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-400 w-24 shrink-0 mt-0.5">Address</span>
                  <span className="text-sm text-gray-800 font-medium leading-relaxed">
                    {member.address}
                    {member.city && `, ${member.city}`}
                    {member.state && `, ${member.state}`}
                    {member.zip && ` ${member.zip}`}
                    {member.country && `, ${member.country}`}
                  </span>
                </div>
              )}
              {member.ssn && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <Shield className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-24 shrink-0">SSN / ITIN</span>
                  <span className="text-sm text-gray-800 font-medium font-mono">{member.ssn}</span>
                </div>
              )}
              {member.passportUrl && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-24 shrink-0">Passport / ID</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(member.passportUrl, "_blank")}
                    className="h-7 px-3 text-xs bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <FileText className="w-3 h-3 mr-1.5" />
                    View Document
                  </Button>
                </div>
              )}
            </div>

            {/* ITIN badge below fields */}
            {member.itinAdded && (
              <div className="mt-3 flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-medium">ITIN Application Requested</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
