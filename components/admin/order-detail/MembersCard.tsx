"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, User, UserCheck, FileText, AlertCircle } from "lucide-react"

interface MembersCardProps {
  members: any[]
}

export function MembersCard({ members }: MembersCardProps) {
  if (!members || members.length === 0) return null

  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          Business Owners / Members
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          <span className="font-semibold text-slate-800">{members.length}</span>{" "}
          member{members.length !== 1 ? "s" : ""} registered
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member: any, index: number) => (
            <div
              key={member.id || index}
              className={`p-5 rounded-xl border-2 ${
                member.responsiblePerson
                  ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      member.responsiblePerson
                        ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                        : "bg-slate-300"
                    }`}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{member.name || "N/A"}</h3>
                    {member.responsiblePerson && (
                      <Badge className="mt-1 text-xs bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Responsible Person
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-medium shrink-0">
                  Member #{index + 1}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {member.email && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{member.email}</p>
                  </div>
                )}
                {member.phone && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-slate-900">{member.phone}</p>
                  </div>
                )}
                {member.address && (
                  <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Full Address</p>
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">
                      {member.address}
                      {member.city && `, ${member.city}`}
                      {member.state && `, ${member.state}`}
                      {member.zip && ` ${member.zip}`}
                      {member.country && `, ${member.country}`}
                    </p>
                  </div>
                )}
                {member.ssn && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">SSN / ITIN</p>
                    <p className="text-sm font-medium text-slate-900 font-mono">{member.ssn}</p>
                  </div>
                )}
                {member.passportUrl && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Passport / ID</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(member.passportUrl, "_blank")}
                      className="w-full justify-center h-9 bg-transparent"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                    </Button>
                  </div>
                )}
                {member.itinAdded && (
                  <div className="sm:col-span-2">
                    <Badge
                      variant="outline"
                      className="bg-amber-50 border-amber-300 text-amber-800 px-3 py-1.5 text-xs"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      ITIN Application Requested
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
