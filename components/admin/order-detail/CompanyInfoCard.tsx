"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Globe, Tag, Layers, MapPin, Pencil } from "lucide-react"

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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-gray-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Company Information</h2>
        </div>
        {!editingCompany && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {editingCompany ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Company Name</Label>
              <Input
                value={companyForm.name}
                onChange={(e) => onFormChange({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
                className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">State</Label>
              <Input
                value={companyForm.state}
                onChange={(e) => onFormChange({ ...companyForm, state: e.target.value })}
                placeholder="Enter state"
                className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Business Category</Label>
              <Input
                value={companyForm.businessCategory}
                onChange={(e) => onFormChange({ ...companyForm, businessCategory: e.target.value })}
                placeholder="Enter business category"
                className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Business Website</Label>
              <Input
                value={companyForm.businessWebsite}
                onChange={(e) => onFormChange({ ...companyForm, businessWebsite: e.target.value })}
                placeholder="Enter website URL"
                className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Business Description</Label>
              <Textarea
                value={companyForm.businessDescription}
                onChange={(e) => onFormChange({ ...companyForm, businessDescription: e.target.value })}
                placeholder="Enter business description"
                rows={3}
                className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg text-sm resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={onSave}
                size="sm"
                className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-xs px-4"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="rounded-lg text-xs px-4 border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info rows in Apple-style bordered list */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-36 shrink-0">Company Name</span>
                <span className="text-sm text-gray-900 font-medium">{company.name}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-36 shrink-0">State of Formation</span>
                <span className="text-sm text-gray-900 font-medium">{company.state}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Layers className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-36 shrink-0">Entity Type</span>
                <span className="text-sm text-gray-900 font-medium">{company.type || company.entityType || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Tag className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-36 shrink-0">Business Category</span>
                <span className="text-sm text-gray-900 font-medium">{company.businessCategory || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Tag className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-xs text-gray-400 w-36 shrink-0">Package Type</span>
                <span className="text-sm text-gray-900 font-medium capitalize bg-gray-100 rounded-full px-2.5 py-0.5 text-xs">
                  {company.packageType || "Starter"}
                </span>
              </div>
              {company.businessWebsite && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Globe className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-36 shrink-0">Website</span>
                  <a
                    href={
                      company.businessWebsite.startsWith("http")
                        ? company.businessWebsite
                        : `https://${company.businessWebsite}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium truncate"
                  >
                    {company.businessWebsite}
                  </a>
                </div>
              )}
            </div>

            {/* Business Description */}
            {company.businessDescription && (
              <div className="rounded-xl border border-gray-200 px-4 py-4">
                <p className="text-xs text-gray-400 font-medium mb-2">Business Description</p>
                <p className="text-sm text-gray-800 leading-relaxed">{company.businessDescription}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
