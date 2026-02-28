"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Pencil } from "lucide-react"

interface CustomerInfoCardProps {
  customer: any
  editingCustomer: boolean
  customerForm: { name: string; email: string; phone: string }
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onFormChange: (form: { name: string; email: string; phone: string }) => void
}

export function CustomerInfoCard({
  customer,
  editingCustomer,
  customerForm,
  onEdit,
  onSave,
  onCancel,
  onFormChange,
}: CustomerInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <span className="text-sm font-semibold text-stone-800 tracking-tight">Customer</span>
        </div>
        {!editingCustomer && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors font-medium"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {editingCustomer ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Full Name</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => onFormChange({ ...customerForm, name: e.target.value })}
                placeholder="Enter customer name"
                className="h-9 text-sm border-stone-200 rounded-lg focus-visible:ring-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Email</Label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => onFormChange({ ...customerForm, email: e.target.value })}
                placeholder="Enter email address"
                className="h-9 text-sm border-stone-200 rounded-lg focus-visible:ring-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Phone</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => onFormChange({ ...customerForm, phone: e.target.value })}
                placeholder="Enter phone number"
                className="h-9 text-sm border-stone-200 rounded-lg focus-visible:ring-stone-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={onSave}
                size="sm"
                className="h-8 text-xs px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 text-xs px-4 text-stone-500 hover:text-stone-700 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <InfoRow label="Full Name" value={customer?.name || "—"} />
            <InfoRow label="Email" value={customer?.email || "—"} />
            <InfoRow label="Phone" value={customer?.phone || "—"} />
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-xs font-medium text-stone-400 uppercase tracking-widest shrink-0 w-24">{label}</span>
      <span className="text-sm font-medium text-stone-800 text-right truncate ml-4">{value}</span>
    </div>
  )
}
