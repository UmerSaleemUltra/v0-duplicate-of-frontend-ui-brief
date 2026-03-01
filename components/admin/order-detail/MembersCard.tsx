"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Users,
  User,
  UserCheck,
  FileText,
  AlertCircle,
  MapPin,
  Shield,
  Pencil,
  Plus,
  Loader2,
  ExternalLink,
  Upload,
  X,
  Trash2,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface MembersCardProps {
  members: any[]
  companyId?: string
  onMembersUpdate?: (updatedMembers: any[]) => void
}

const emptyMember = () => ({
  id: Date.now().toString(),
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  ssn: "",
  passportUrl: "",
  isResponsiblePerson: false,
  itinAdded: false,
})

export function MembersCard({ members, companyId, onMembersUpdate }: MembersCardProps) {
  const { toast } = useToast()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // The member being edited
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<any>(emptyMember())

  // Member to delete
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  // New member form
  const [newMemberForm, setNewMemberForm] = useState<any>(emptyMember())

  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Business Owners / Members</h2>
              <p className="text-xs text-gray-400 mt-0.5">No members registered</p>
            </div>
          </div>
          {companyId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setNewMemberForm(emptyMember()); setAddDialogOpen(true) }}
              className="h-8 px-3 text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Member
            </Button>
          )}
        </div>
        <div className="px-6 py-8 text-center text-sm text-gray-400">No members registered for this company.</div>

        {/* Add member dialog */}
        <AddMemberDialog
          open={addDialogOpen}
          form={newMemberForm}
          onChange={setNewMemberForm}
          saving={saving}
          onClose={() => setAddDialogOpen(false)}
          onSave={() => handleSaveNewMember()}
          companyId={companyId}
        />
      </div>
    )
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openEdit = (index: number) => {
    setEditingIndex(index)
    setEditForm({ ...emptyMember(), ...members[index] })
    setEditDialogOpen(true)
  }

  const saveToApi = async (updatedMembers: any[]) => {
    if (!companyId) return
    const token = authService.getToken()
    if (!token) return

    const response = await fetch(`/api/companies/${companyId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ members: updatedMembers }),
    })

    if (!response.ok) throw new Error("Failed to save")
    const result = await response.json()
    return result.data?.members || updatedMembers
  }

  const handleSaveEdit = async () => {
    if (editingIndex === null) return
    try {
      setSaving(true)
      const updatedMembers = members.map((m, i) =>
        i === editingIndex ? { ...m, ...editForm } : m,
      )
      const saved = await saveToApi(updatedMembers)
      onMembersUpdate?.(saved)
      setEditDialogOpen(false)
      toast({ title: "Member updated", description: "Member details saved successfully." })
    } catch {
      toast({ title: "Save failed", description: "Could not save member details.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const openDelete = (index: number) => {
    setDeletingIndex(index)
    setDeleteDialogOpen(true)
  }

  const handleDeleteMember = async () => {
    if (deletingIndex === null) return
    try {
      setDeleting(true)
      const updatedMembers = members.filter((_, i) => i !== deletingIndex)
      const saved = await saveToApi(updatedMembers)
      onMembersUpdate?.(saved)
      setDeleteDialogOpen(false)
      setDeletingIndex(null)
      toast({ title: "Member removed", description: "Member has been removed successfully." })
    } catch {
      toast({ title: "Delete failed", description: "Could not remove member.", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveNewMember = async () => {
    if (!newMemberForm.name.trim()) {
      toast({ title: "Name required", description: "Please enter the member's name.", variant: "destructive" })
      return
    }
    try {
      setSaving(true)
      const newEntry = { ...newMemberForm, id: Date.now().toString() }
      const updatedMembers = [...members, newEntry]
      const saved = await saveToApi(updatedMembers)
      onMembersUpdate?.(saved)
      setAddDialogOpen(false)
      setNewMemberForm(emptyMember())
      toast({ title: "Member added", description: `${newEntry.name} has been added.` })
    } catch {
      toast({ title: "Add failed", description: "Could not add member.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
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
          {companyId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setNewMemberForm(emptyMember()); setAddDialogOpen(true) }}
              className="h-8 px-3 text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Member
            </Button>
          )}
        </div>

        {/* Members List */}
        <div className="divide-y divide-gray-100">
          {members.map((member: any, index: number) => (
            <div key={member.id || index} className="px-6 py-6">
              {/* Member Header Row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      (member.isResponsiblePerson || member.responsiblePerson) ? "bg-gray-900" : "bg-gray-100"
                    }`}
                  >
                    <User className={`w-4.5 h-4.5 ${(member.isResponsiblePerson || member.responsiblePerson) ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{member.name || "N/A"}</p>
                    {(member.isResponsiblePerson || member.responsiblePerson) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500 font-medium">Responsible Person</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                    Member {index + 1}
                  </span>
                  {companyId && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(index)}
                        className="h-7 px-2.5 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDelete(index)}
                        className="h-7 px-2 text-xs border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Fields */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
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
                    <a
                      href={member.passportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Document
                    </a>
                  </div>
                )}
              </div>

              {/* ITIN badge */}
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

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Edit Member {editingIndex !== null ? editingIndex + 1 : ""}
            </DialogTitle>
          </DialogHeader>

          <MemberForm form={editForm} onChange={setEditForm} companyId={companyId} />

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving} className="text-sm">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="text-sm bg-gray-900 hover:bg-gray-800 text-white">
              {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addDialogOpen}
        form={newMemberForm}
        onChange={setNewMemberForm}
        saving={saving}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleSaveNewMember}
        companyId={companyId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-900">
                {deletingIndex !== null ? members[deletingIndex]?.name || "this member" : "this member"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Removing...</> : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Shared form ───────────────────────────────────────────────────────────────

function MemberForm({
  form,
  onChange,
  companyId,
}: {
  form: any
  onChange: (v: any) => void
  companyId?: string
}) {
  const set = (key: string, value: any) => onChange({ ...form, [key]: value })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // Track the original file name separately so we can display it cleanly
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    form.passportFileName || ""
  )

  const handlePassportUpload = async (file: File) => {
    setUploadError(null)
    try {
      setUploading(true)
      const token = authService.getToken()

      // Resolve a valid userId — the API requires a MongoDB-compatible ObjectId.
      // Pull it from the auth service so we always have a real user id.
      const currentUser = authService.getUser?.()
      const userId = currentUser?.id || currentUser?._id || form.userId || ""

      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("userId", userId)
      if (companyId) uploadData.append("companyId", companyId)
      uploadData.append("memberId", form._id || form.id || "0")
      uploadData.append("memberName", form.name || "Unknown")

      const res = await fetch("/api/passports/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.error || "Upload failed")
      }

      const result = await res.json()
      const fileUrl = result.data?.fileUrl || ""

      // Update both passportUrl and the display file name in one onChange call
      // to avoid stale closure issues with sequential set() calls.
      onChange({ ...form, passportUrl: fileUrl, passportFileName: file.name })
      setUploadedFileName(file.name)
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Derive the display name: prefer the stored file name, otherwise decode
  // the last URL segment (which may be a hash on blob storage).
  const displayFileName = uploadedFileName || form.passportFileName || (() => {
    if (!form.passportUrl) return ""
    try {
      const segment = new URL(form.passportUrl).pathname.split("/").pop() || ""
      return decodeURIComponent(segment)
    } catch {
      return form.passportUrl.split("/").pop() || "Document"
    }
  })()

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Full Name</Label>
        <Input
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="John Doe"
          className="h-9 text-sm"
        />
      </div>

      {/* Street Address */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Street Address</Label>
        <Input
          value={form.address || ""}
          onChange={(e) => set("address", e.target.value)}
          placeholder="123 Main St"
          className="h-9 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">City</Label>
          <Input
            value={form.city || ""}
            onChange={(e) => set("city", e.target.value)}
            placeholder="New York"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">State</Label>
          <Input
            value={form.state || ""}
            onChange={(e) => set("state", e.target.value)}
            placeholder="NY"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">ZIP Code</Label>
          <Input
            value={form.zip || ""}
            onChange={(e) => set("zip", e.target.value)}
            placeholder="10001"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Country</Label>
          <Input
            value={form.country || ""}
            onChange={(e) => set("country", e.target.value)}
            placeholder="United States"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* SSN / ITIN */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">SSN / ITIN</Label>
        <Input
          value={form.ssn || ""}
          onChange={(e) => set("ssn", e.target.value)}
          placeholder="XXX-XX-XXXX"
          className="h-9 text-sm font-mono"
        />
      </div>

      {/* Passport / ID Upload */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Passport / ID Document</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handlePassportUpload(file)
            // reset so the same file can be re-selected after removal
            e.target.value = ""
          }}
        />

        {/* Uploaded file preview */}
        {form.passportUrl && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
            <a
              href={form.passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={displayFileName}
              className="text-xs text-blue-600 hover:underline min-w-0 flex-1 overflow-hidden"
              style={{ display: "block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
            >
              {displayFileName || "View Document"}
            </a>
            <button
              type="button"
              onClick={() => {
                onChange({ ...form, passportUrl: "", passportFileName: "" })
                setUploadedFileName("")
                setUploadError(null)
              }}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-8 px-3 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 w-full"
        >
          {uploading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading...</>
          ) : (
            <><Upload className="w-3.5 h-3.5 mr-1.5" />{form.passportUrl ? "Replace Document" : "Upload Passport / ID"}</>
          )}
        </Button>
      </div>

      {/* Responsible Person */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Responsible Person</p>
          <p className="text-xs text-gray-400 mt-0.5">Mark as the primary responsible member</p>
        </div>
        <Switch
          checked={!!(form.isResponsiblePerson ?? form.responsiblePerson)}
          onCheckedChange={(v) => onChange({ ...form, isResponsiblePerson: v, responsiblePerson: v })}
        />
      </div>
    </div>
  )
}

// ── Add member dialog ─────────────────────────────────────────────────────────

function AddMemberDialog({
  open,
  form,
  onChange,
  saving,
  onClose,
  onSave,
  companyId,
}: {
  open: boolean
  form: any
  onChange: (v: any) => void
  saving: boolean
  onClose: () => void
  onSave: () => void
  companyId?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Add New Member</DialogTitle>
        </DialogHeader>

        <MemberForm form={form} onChange={onChange} companyId={companyId} />

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving} className="text-sm">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} className="text-sm bg-gray-900 hover:bg-gray-800 text-white">
            {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Adding...</> : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
