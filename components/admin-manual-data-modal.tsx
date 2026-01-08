"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface AdminManualDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  dataType: "tax" | "registered-agent" | "business-address"
  currentData?: any
  onUpdate: () => void
}

export function AdminManualDataModal({
  open,
  onOpenChange,
  companyId,
  dataType,
  currentData,
  onUpdate,
}: AdminManualDataModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>(currentData || {})

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/companies/${companyId}/manual-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType,
          data: formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to update data")

      toast({
        title: "Success",
        description: "Data updated successfully",
      })

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error updating manual data:", error)
      toast({
        title: "Error",
        description: "Failed to update data",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dataType === "tax" && "Edit Tax & Compliance Information"}
            {dataType === "registered-agent" && "Edit Registered Agent"}
            {dataType === "business-address" && "Edit Business Address"}
          </DialogTitle>
          <DialogDescription>Update manual admin fields for this company</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {dataType === "tax" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="formationDate">Formation Date (M)</Label>
                <Input
                  id="formationDate"
                  type="date"
                  value={formData.formationDate || ""}
                  onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ein">EIN Number (M)</Label>
                <Input
                  id="ein"
                  placeholder="XX-XXXXXXX"
                  value={formData.ein || ""}
                  onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessId">Business ID / State Filing Number (M)</Label>
                <Input
                  id="businessId"
                  placeholder="Enter state filing number"
                  value={formData.businessId || ""}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxClassification">Tax Classification (M)</Label>
                <Select
                  value={formData.taxClassification || ""}
                  onValueChange={(value) => setFormData({ ...formData, taxClassification: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Member LLC">Single Member LLC</SelectItem>
                    <SelectItem value="Multi-Member LLC">Multi-Member LLC</SelectItem>
                    <SelectItem value="S Corporation">S Corporation</SelectItem>
                    <SelectItem value="C Corporation">C Corporation</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualReportFilingDate">Annual Report Filing Date (M)</Label>
                <Input
                  id="annualReportFilingDate"
                  type="date"
                  value={formData.annualReportFilingDate || ""}
                  onChange={(e) => setFormData({ ...formData, annualReportFilingDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="irsFilingDate">IRS Tax Return Filing Date (M)</Label>
                <Input
                  id="irsFilingDate"
                  type="date"
                  value={formData.irsFilingDate || ""}
                  onChange={(e) => setFormData({ ...formData, irsFilingDate: e.target.value })}
                />
              </div>
            </>
          )}

          {dataType === "registered-agent" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name (M)</Label>
                <Input
                  id="agentName"
                  placeholder="Registered Agents Inc"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentAddress">Address (M)</Label>
                <Input
                  id="agentAddress"
                  placeholder="30 N Gould St Ste R"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentCity">City (M)</Label>
                  <Input
                    id="agentCity"
                    placeholder="Sheridan"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentState">State (M)</Label>
                  <Input
                    id="agentState"
                    placeholder="WY"
                    maxLength={2}
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentZip">ZIP (M)</Label>
                  <Input
                    id="agentZip"
                    placeholder="82801"
                    value={formData.zip || ""}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (M)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </>
          )}

          {dataType === "business-address" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessAddress">Address (M)</Label>
                <Input
                  id="businessAddress"
                  placeholder="30 N Gould St Ste R"
                  value={formData.street || ""}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCity">City (M)</Label>
                  <Input
                    id="businessCity"
                    placeholder="Sheridan"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessState">State (M)</Label>
                  <Input
                    id="businessState"
                    placeholder="WY"
                    maxLength={2}
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessZip">ZIP (M)</Label>
                  <Input
                    id="businessZip"
                    placeholder="82801"
                    value={formData.zip || ""}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessExpiryDate">Expiry Date (M)</Label>
                <Input
                  id="businessExpiryDate"
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
