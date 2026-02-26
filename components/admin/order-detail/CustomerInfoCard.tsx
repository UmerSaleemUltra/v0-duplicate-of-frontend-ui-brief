"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Settings } from "lucide-react"

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
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-600" />
            Customer Information
          </CardTitle>
          {!editingCustomer && (
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
        {editingCustomer ? (
          <div className="space-y-4">
            <div>
              <Label>Customer Name</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => onFormChange({ ...customerForm, name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => onFormChange({ ...customerForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => onFormChange({ ...customerForm, phone: e.target.value })}
                placeholder="Enter phone number"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Customer Name</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{customer?.name || "Unknown"}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Email Address</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{customer?.email || "N/A"}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Phone Number</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{customer?.phone || "N/A"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
