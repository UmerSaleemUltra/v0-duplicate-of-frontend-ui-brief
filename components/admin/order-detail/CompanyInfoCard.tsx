"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Settings } from "lucide-react"

interface CompanyForm {
  name: string
  state: string
  businessCategory: string
  businessWebsite: string
  businessDescription: string
}

interface CompanyInfoCardProps {
  company: any
  editingCompany: boolean
  companyForm: CompanyForm
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onFormChange: (form: CompanyForm) => void
}

interface InfoFieldProps {
  label: string
  value: React.ReactNode
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

export function CompanyInfoCard({
  company,
  editingCompany,
  companyForm,
  onEdit,
  onSave,
  onCancel,
  onFormChange,
}: CompanyInfoCardProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            Company Information
          </CardTitle>
          {!editingCompany && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-9 text-xs w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingCompany ? (
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={companyForm.name}
                onChange={(e) => onFormChange({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={companyForm.state}
                onChange={(e) => onFormChange({ ...companyForm, state: e.target.value })}
                placeholder="Enter state"
              />
            </div>
            <div>
              <Label>Business Category</Label>
              <Input
                value={companyForm.businessCategory}
                onChange={(e) => onFormChange({ ...companyForm, businessCategory: e.target.value })}
                placeholder="Enter business category"
              />
            </div>
            <div>
              <Label>Business Website</Label>
              <Input
                value={companyForm.businessWebsite}
                onChange={(e) => onFormChange({ ...companyForm, businessWebsite: e.target.value })}
                placeholder="Enter website URL"
              />
            </div>
            <div>
              <Label>Business Description</Label>
              <Textarea
                value={companyForm.businessDescription}
                onChange={(e) => onFormChange({ ...companyForm, businessDescription: e.target.value })}
                placeholder="Enter business description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} size="sm" className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
                Save Changes
              </Button>
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Company Name" value={company.name} />
              <InfoField label="State of Formation" value={company.state} />
              <InfoField label="Entity Type" value={company.type || company.entityType || "N/A"} />
              <InfoField label="Business Category" value={company.businessCategory || "Not provided"} />
              <InfoField
                label="Package Type"
                value={
                  <Badge variant="outline" className="text-xs capitalize font-medium">
                    {company.packageType || "Starter"}
                  </Badge>
                }
              />
              {company.businessWebsite && (
                <InfoField
                  label="Business Website"
                  value={
                    <a
                      href={
                        company.businessWebsite.startsWith("http")
                          ? company.businessWebsite
                          : `https://${company.businessWebsite}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.businessWebsite}
                    </a>
                  }
                />
              )}
            </div>
            {company.businessDescription && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
                  Business Description
                </p>
                <p className="text-sm text-slate-900 leading-relaxed">{company.businessDescription}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
