"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

interface StatusManagementCardProps {
  company: any
  onUpdateCompanyStatus: () => void
  onUpdateAgentStatus: () => void
  onUpdateAddressStatus: () => void
  onUpdateServiceStatus: () => void
}

interface StatusRowProps {
  label: string
  description: string
  status: string
  onUpdate: () => void
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":   return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "inactive": return "bg-red-100 text-red-700 border-red-200"
    default:         return "bg-amber-100 text-amber-700 border-amber-200"
  }
}

function StatusRow({ label, description, status, onUpdate }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={`capitalize text-xs border ${statusBadgeClass(status)}`}>{status}</Badge>
        <Button size="sm" variant="outline" onClick={onUpdate} className="h-8 text-xs">
          Update
        </Button>
      </div>
    </div>
  )
}

export function StatusManagementCard({
  company,
  onUpdateCompanyStatus,
  onUpdateAgentStatus,
  onUpdateAddressStatus,
  onUpdateServiceStatus,
}: StatusManagementCardProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          Status Management
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Manage company, agent, address, and service statuses
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        <StatusRow
          label="Company Status"
          description="Overall company operational status"
          status={company?.companyStatus || "pending"}
          onUpdate={onUpdateCompanyStatus}
        />
        <StatusRow
          label="Registered Agent Status"
          description="Agent assignment and service status"
          status={company?.registeredAgentStatus || "pending"}
          onUpdate={onUpdateAgentStatus}
        />
        <StatusRow
          label="Business Address Status"
          description="Mailing address setup status"
          status={company?.businessAddressStatus || "pending"}
          onUpdate={onUpdateAddressStatus}
        />
        <StatusRow
          label="Service Status"
          description="Overall service delivery status"
          status={company?.serviceStatus || "pending"}
          onUpdate={onUpdateServiceStatus}
        />
      </CardContent>
    </Card>
  )
}
