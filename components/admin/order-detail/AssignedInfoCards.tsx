"use client"

import { useState } from "react"
import {
  UserCheck,
  Home,
  Hash,
  Building2,
  MapPin,
  Copy,
  Check,
  Receipt,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  X,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AssignedInfoCardsProps {
  company: any
  onUpdateCompany?: (patch: Record<string, any>) => Promise<void>
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
  onEdit,
  onDelete,
  saving,
  children,
}: {
  title: string
  icon: React.ReactNode
  onEdit?: () => void
  onDelete?: () => void
  saving?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">{icon}</div>
        <h2 className="text-base font-semibold text-gray-900 flex-1">{title}</h2>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              disabled={saving}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={saving}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Remove"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function AssignedInfoCards({ company, onUpdateCompany }: AssignedInfoCardsProps) {
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

  const itinMembers: { memberName: string; itin: string; assignedAt?: string }[] = Array.isArray(company?.itinMembers)
    ? company.itinMembers.filter((entry: any) => entry?.itin && entry.itin.trim() !== "")
    : []

  const hasTax =
    company?.taxClassification || company?.annualReportFilingDate || company?.irsFilingDate

  // ── Local edit / saving state ──────────────────────────────────────────────

  // Registered Agent
  const [editingAgent, setEditingAgent] = useState(false)
  const [agentDraft, setAgentDraft] = useState({ name: "", address: "", city: "", state: "", zip: "", servicePeriod: "", expiryDate: "" })
  const [agentSaving, setAgentSaving] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState(false)

  // Mailing Address
  const [editingMailing, setEditingMailing] = useState(false)
  const [mailingDraft, setMailingDraft] = useState({ street: "", city: "", state: "", zip: "", servicePeriod: "", expiryDate: "" })
  const [mailingSaving, setMailingSaving] = useState(false)
  const [deletingMailing, setDeletingMailing] = useState(false)

  const [editingEIN, setEditingEIN] = useState(false)
  const [einDraft, setEINDraft] = useState("")
  const [einSaving, setEINSaving] = useState(false)

  const [editingBusinessId, setEditingBusinessId] = useState(false)
  const [businessIdDraft, setBusinessIdDraft] = useState("")
  const [businessIdSaving, setBusinessIdSaving] = useState(false)

  const [deletingItinIdx, setDeletingItinIdx] = useState<number | null>(null)
  const [deletingEIN, setDeletingEIN] = useState(false)
  const [deletingBusinessId, setDeletingBusinessId] = useState(false)

  const [editingTax, setEditingTax] = useState(false)
  const [taxDraft, setTaxDraft] = useState({
    taxClassification: "",
    annualReportFilingDate: "",
    irsFilingDate: "",
  })
  const [taxSaving, setTaxSaving] = useState(false)
  const [deletingTax, setDeletingTax] = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const update = async (patch: Record<string, any>) => {
    if (!onUpdateCompany) return
    await onUpdateCompany(patch)
  }

  // Registered Agent
  const handleEditAgent = () => {
    setAgentDraft({
      name: agent?.name || "",
      address: agent?.address || "",
      city: agent?.city || "",
      state: agent?.state || "",
      zip: agent?.zip || "",
      servicePeriod: agent?.servicePeriod || "",
      expiryDate: agent?.expiryDate || "",
    })
    setEditingAgent(true)
  }
  const handleSaveAgent = async () => {
    setAgentSaving(true)
    try {
      await update({
        registeredAgent: {
          ...agent,
          name: agentDraft.name.trim(),
          address: agentDraft.address.trim(),
          city: agentDraft.city.trim(),
          state: agentDraft.state.trim(),
          zip: agentDraft.zip.trim(),
          servicePeriod: agentDraft.servicePeriod.trim(),
          expiryDate: agentDraft.expiryDate.trim(),
        },
      })
      setEditingAgent(false)
    } finally {
      setAgentSaving(false)
    }
  }
  const handleDeleteAgent = async () => {
    setDeletingAgent(true)
    try {
      await update({ registeredAgent: { name: "", address: "", city: "", state: "", zip: "", servicePeriod: "", expiryDate: "" } })
    } finally {
      setDeletingAgent(false)
    }
  }

  // Mailing Address
  const handleEditMailing = () => {
    setMailingDraft({
      street: mailing?.street || "",
      city: mailing?.city || "",
      state: mailing?.state || "",
      zip: mailing?.zip || "",
      servicePeriod: mailing?.servicePeriod || "",
      expiryDate: mailing?.expiryDate || "",
    })
    setEditingMailing(true)
  }
  const handleSaveMailing = async () => {
    setMailingSaving(true)
    try {
      await update({
        mailingAddress: {
          street: mailingDraft.street.trim(),
          city: mailingDraft.city.trim(),
          state: mailingDraft.state.trim(),
          zip: mailingDraft.zip.trim(),
          servicePeriod: mailingDraft.servicePeriod.trim(),
          expiryDate: mailingDraft.expiryDate.trim(),
        },
      })
      setEditingMailing(false)
    } finally {
      setMailingSaving(false)
    }
  }
  const handleDeleteMailing = async () => {
    setDeletingMailing(true)
    try {
      await update({ mailingAddress: { street: "", city: "", state: "", zip: "", servicePeriod: "", expiryDate: "" } })
    } finally {
      setDeletingMailing(false)
    }
  }

  // EIN
  const handleEditEIN = () => {
    setEINDraft(company?.ein || "")
    setEditingEIN(true)
  }
  const handleSaveEIN = async () => {
    setEINSaving(true)
    try {
      await update({ ein: einDraft.trim() })
      setEditingEIN(false)
    } finally {
      setEINSaving(false)
    }
  }
  const handleDeleteEIN = async () => {
    setDeletingEIN(true)
    try {
      await update({ ein: "" })
    } finally {
      setDeletingEIN(false)
    }
  }

  // Business ID
  const handleEditBusinessId = () => {
    setBusinessIdDraft(company?.businessId || "")
    setEditingBusinessId(true)
  }
  const handleSaveBusinessId = async () => {
    setBusinessIdSaving(true)
    try {
      await update({ businessId: businessIdDraft.trim() })
      setEditingBusinessId(false)
    } finally {
      setBusinessIdSaving(false)
    }
  }
  const handleDeleteBusinessId = async () => {
    setDeletingBusinessId(true)
    try {
      await update({ businessId: "" })
    } finally {
      setDeletingBusinessId(false)
    }
  }

  // ITIN per-member delete
  const handleDeleteITINEntry = async (idx: number) => {
    setDeletingItinIdx(idx)
    try {
      const updated = itinMembers.filter((_, i) => i !== idx)
      await update({ itinMembers: updated })
    } finally {
      setDeletingItinIdx(null)
    }
  }

  // Tax Info
  const handleEditTax = () => {
    setTaxDraft({
      taxClassification: company?.taxClassification || "",
      annualReportFilingDate: company?.annualReportFilingDate || "",
      irsFilingDate: company?.irsFilingDate || "",
    })
    setEditingTax(true)
  }
  const handleSaveTax = async () => {
    setTaxSaving(true)
    try {
      await update({
        taxClassification: taxDraft.taxClassification.trim(),
        annualReportFilingDate: taxDraft.annualReportFilingDate.trim(),
        irsFilingDate: taxDraft.irsFilingDate.trim(),
      })
      setEditingTax(false)
    } finally {
      setTaxSaving(false)
    }
  }
  const handleDeleteTax = async () => {
    setDeletingTax(true)
    try {
      await update({
        taxClassification: "",
        annualReportFilingDate: "",
        irsFilingDate: "",
      })
    } finally {
      setDeletingTax(false)
    }
  }

  const mailingAddressString = hasMailing ? `${mailing.street}, ${mailing.city}, ${mailing.state} ${mailing.zip}` : ""

  const agentAddressString =
    hasAgent && agent.address
      ? `${agent.address}${agent.city ? `, ${agent.city}` : ""}${agent.state ? `, ${agent.state}` : ""}${agent.zip ? ` ${agent.zip}` : ""}`
      : ""

  return (
    <>
      {/* Registered Agent — editable / removable */}
      {hasAgent && (
        <InfoCard
          title="Registered Agent"
          icon={<UserCheck className="w-4 h-4 text-gray-500" />}
          onEdit={onUpdateCompany ? handleEditAgent : undefined}
          onDelete={onUpdateCompany ? handleDeleteAgent : undefined}
          saving={deletingAgent}
        >
          {editingAgent ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Name</Label>
                <Input
                  value={agentDraft.name}
                  onChange={(e) => setAgentDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Agent name"
                  className="text-sm"
                  disabled={agentSaving}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Street Address</Label>
                <Input
                  value={agentDraft.address}
                  onChange={(e) => setAgentDraft((d) => ({ ...d, address: e.target.value }))}
                  placeholder="Street address"
                  className="text-sm"
                  disabled={agentSaving}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">City</Label>
                  <Input
                    value={agentDraft.city}
                    onChange={(e) => setAgentDraft((d) => ({ ...d, city: e.target.value }))}
                    placeholder="City"
                    className="text-sm"
                    disabled={agentSaving}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">State</Label>
                  <Input
                    value={agentDraft.state}
                    onChange={(e) => setAgentDraft((d) => ({ ...d, state: e.target.value }))}
                    placeholder="State"
                    className="text-sm uppercase"
                    maxLength={2}
                    disabled={agentSaving}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">ZIP</Label>
                  <Input
                    value={agentDraft.zip}
                    onChange={(e) => setAgentDraft((d) => ({ ...d, zip: e.target.value }))}
                    placeholder="ZIP"
                    className="text-sm"
                    disabled={agentSaving}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Expiry Date</Label>
                <Input
                  type="date"
                  value={agentDraft.expiryDate}
                  onChange={(e) => setAgentDraft((d) => ({ ...d, expiryDate: e.target.value }))}
                  className="text-sm"
                  disabled={agentSaving}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSaveAgent} disabled={agentSaving || !agentDraft.name.trim()} className="h-8 text-xs">
                  {agentSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingAgent(false)} disabled={agentSaving} className="h-8 text-xs">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
              {agent.expiryDate && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <Calendar className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Expiry Date</p>
                    <p className="text-sm text-gray-900 font-medium break-words">
                      {new Date(agent.expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <CopyButton value={new Date(agent.expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
                </div>
              )}
            </div>
          )}
        </InfoCard>
      )}

      {/* Mailing Address — editable / removable */}
      {hasMailing && (
        <InfoCard
          title="Mailing Address"
          icon={<Home className="w-4 h-4 text-gray-500" />}
          onEdit={onUpdateCompany ? handleEditMailing : undefined}
          onDelete={onUpdateCompany ? handleDeleteMailing : undefined}
          saving={deletingMailing}
        >
          {editingMailing ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Street Address</Label>
                <Input
                  value={mailingDraft.street}
                  onChange={(e) => setMailingDraft((d) => ({ ...d, street: e.target.value }))}
                  placeholder="Street address"
                  className="text-sm"
                  disabled={mailingSaving}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">City</Label>
                  <Input
                    value={mailingDraft.city}
                    onChange={(e) => setMailingDraft((d) => ({ ...d, city: e.target.value }))}
                    placeholder="City"
                    className="text-sm"
                    disabled={mailingSaving}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">State</Label>
                  <Input
                    value={mailingDraft.state}
                    onChange={(e) => setMailingDraft((d) => ({ ...d, state: e.target.value }))}
                    placeholder="State"
                    className="text-sm uppercase"
                    maxLength={2}
                    disabled={mailingSaving}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">ZIP</Label>
                  <Input
                    value={mailingDraft.zip}
                    onChange={(e) => setMailingDraft((d) => ({ ...d, zip: e.target.value }))}
                    placeholder="ZIP"
                    className="text-sm"
                    disabled={mailingSaving}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Expiry Date</Label>
                <Input
                  type="date"
                  value={mailingDraft.expiryDate}
                  onChange={(e) => setMailingDraft((d) => ({ ...d, expiryDate: e.target.value }))}
                  className="text-sm"
                  disabled={mailingSaving}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSaveMailing} disabled={mailingSaving || !mailingDraft.street.trim()} className="h-8 text-xs">
                  {mailingSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingMailing(false)} disabled={mailingSaving} className="h-8 text-xs">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
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
              {mailing.expiryDate && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <Calendar className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Expiry Date</p>
                    <p className="text-sm text-gray-900 font-medium break-words">
                      {new Date(mailing.expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <CopyButton value={new Date(mailing.expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
                </div>
              )}
            </div>
          )}
        </InfoCard>
      )}

      {/* EIN — editable / removable */}
      {hasEIN && (
        <InfoCard
          title="EIN"
          icon={<Hash className="w-4 h-4 text-gray-500" />}
          onEdit={onUpdateCompany ? handleEditEIN : undefined}
          onDelete={onUpdateCompany ? handleDeleteEIN : undefined}
          saving={deletingEIN}
        >
          {editingEIN ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Employer Identification Number</Label>
                <Input
                  value={einDraft}
                  onChange={(e) => setEINDraft(e.target.value)}
                  placeholder="XX-XXXXXXX"
                  className="font-mono text-sm"
                  disabled={einSaving}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEIN} disabled={einSaving || !einDraft.trim()} className="h-8 text-xs">
                  {einSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingEIN(false)}
                  disabled={einSaving}
                  className="h-8 text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </InfoCard>
      )}

      {/* Business ID — editable / removable */}
      {hasBusinessId && (
        <InfoCard
          title="Business ID"
          icon={<Building2 className="w-4 h-4 text-gray-500" />}
          onEdit={onUpdateCompany ? handleEditBusinessId : undefined}
          onDelete={onUpdateCompany ? handleDeleteBusinessId : undefined}
          saving={deletingBusinessId}
        >
          {editingBusinessId ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">State Business License ID</Label>
                <Input
                  value={businessIdDraft}
                  onChange={(e) => setBusinessIdDraft(e.target.value)}
                  placeholder="Business ID"
                  className="font-mono text-sm uppercase"
                  disabled={businessIdSaving}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveBusinessId}
                  disabled={businessIdSaving || !businessIdDraft.trim()}
                  className="h-8 text-xs"
                >
                  {businessIdSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingBusinessId(false)}
                  disabled={businessIdSaving}
                  className="h-8 text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </InfoCard>
      )}

      {/* Tax Information — editable / removable */}
      {hasTax && (
        <InfoCard
          title="Tax Information"
          icon={<Receipt className="w-4 h-4 text-gray-500" />}
          onEdit={onUpdateCompany ? handleEditTax : undefined}
          onDelete={onUpdateCompany ? handleDeleteTax : undefined}
          saving={deletingTax}
        >
          {editingTax ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Tax Classification</Label>
                <Input
                  value={taxDraft.taxClassification}
                  onChange={(e) => setTaxDraft((d) => ({ ...d, taxClassification: e.target.value }))}
                  placeholder="e.g. S-Corp, C-Corp, LLC"
                  className="text-sm"
                  disabled={taxSaving}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">Annual Report Filing Date</Label>
                <Input
                  type="date"
                  value={taxDraft.annualReportFilingDate}
                  onChange={(e) => setTaxDraft((d) => ({ ...d, annualReportFilingDate: e.target.value }))}
                  className="text-sm"
                  disabled={taxSaving}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">IRS Filing Date</Label>
                <Input
                  type="date"
                  value={taxDraft.irsFilingDate}
                  onChange={(e) => setTaxDraft((d) => ({ ...d, irsFilingDate: e.target.value }))}
                  className="text-sm"
                  disabled={taxSaving}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSaveTax} disabled={taxSaving} className="h-8 text-xs">
                  {taxSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTax(false)}
                  disabled={taxSaving}
                  className="h-8 text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
                  <Calendar className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Annual Report Date</p>
                    <p className="text-sm text-gray-900 font-medium break-words">{company.annualReportFilingDate}</p>
                  </div>
                  <CopyButton value={company.annualReportFilingDate} />
                </div>
              )}
              {company?.irsFilingDate && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <Calendar className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">IRS Filing Date</p>
                    <p className="text-sm text-gray-900 font-medium break-words">{company.irsFilingDate}</p>
                  </div>
                  <CopyButton value={company.irsFilingDate} />
                </div>
              )}
            </div>
          )}
        </InfoCard>
      )}

      {/* ITIN — per member, removable */}
      {itinMembers.length > 0 && (
        <InfoCard title="ITIN" icon={<Hash className="w-4 h-4 text-gray-500" />}>
          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {itinMembers.map((entry, idx) => (
              <div key={idx} className="px-4 py-3 relative group">
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
                  {onUpdateCompany && (
                    <button
                      onClick={() => handleDeleteITINEntry(idx)}
                      disabled={deletingItinIdx === idx}
                      className="ml-1 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0"
                      title="Remove ITIN entry"
                    >
                      {deletingItinIdx === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </>
  )
}
