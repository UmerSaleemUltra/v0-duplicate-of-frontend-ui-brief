"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Bell, Plus, X, Save, AlertCircle, Check } from "lucide-react"

export default function AnnualReportSettingsPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>(null)
  const [reminderDays, setReminderDays] = useState<number[]>([60, 30, 14, 7, 3, 1])
  const [enableAutoSend, setEnableAutoSend] = useState(true)
  const [newDay, setNewDay] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated])

  const fetchSettings = async () => {
    try {
      setDataLoading(true)
      const token = authService.getToken()
      const res = await fetch("/api/annual-report-reminders/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setSettings(data.data)
        setReminderDays(data.data.reminderDays || [60, 30, 14, 7, 3, 1])
        setEnableAutoSend(data.data.enableAutoSend !== false)
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch settings", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch settings", variant: "destructive" })
    } finally {
      setDataLoading(false)
    }
  }

  const handleAddDay = () => {
    const day = parseInt(newDay)
    if (!newDay || isNaN(day) || day <= 0) {
      toast({ title: "Invalid", description: "Please enter a positive number", variant: "destructive" })
      return
    }
    if (reminderDays.includes(day)) {
      toast({ title: "Duplicate", description: `${day} days is already in the list`, variant: "destructive" })
      return
    }
    setReminderDays([...reminderDays, day].sort((a, b) => b - a))
    setNewDay("")
  }

  const handleRemoveDay = (day: number) => {
    setReminderDays(reminderDays.filter(d => d !== day))
  }

  const handleSave = async () => {
    if (reminderDays.length === 0) {
      toast({ title: "Invalid", description: "At least one reminder day is required", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)
      const token = authService.getToken()
      const res = await fetch("/api/annual-report-reminders/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminderDays,
          enableAutoSend,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: data.message })
        setSettings(data.data)
      } else {
        toast({ title: "Error", description: data.error || "Failed to save settings", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-6 w-6 text-slate-900" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reminder Settings</h1>
          </div>
          <p className="text-sm text-slate-500">Configure when annual report reminders are automatically sent to clients</p>
        </div>

        {/* Main Settings Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Automatic Reminders</CardTitle>
            <CardDescription>Send reminders X days before the annual report due date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Auto-Send Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <p className="font-medium text-slate-900">Enable Automatic Sending</p>
                <p className="text-xs text-slate-500">Allow the system to automatically send reminders to clients</p>
              </div>
              <Switch checked={enableAutoSend} onCheckedChange={setEnableAutoSend} />
            </div>

            {/* Reminder Days Configuration */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-900">Reminder Days Before Due Date</label>
              <p className="text-xs text-slate-500">Reminders will be sent on these days before the annual report is due</p>

              {/* Current Days */}
              <div className="flex flex-wrap gap-2">
                {reminderDays.sort((a, b) => b - a).map(day => (
                  <Badge key={day} variant="secondary" className="px-3 py-2 gap-2 bg-slate-100 text-slate-700 border-slate-200 rounded-lg">
                    <span className="font-semibold">{day}</span>
                    <span className="text-xs">days</span>
                    <button onClick={() => handleRemoveDay(day)} className="ml-1 text-slate-500 hover:text-slate-700">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add New Day */}
              <div className="flex gap-2 pt-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Days before due date (e.g., 14)"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddDay()}
                  className="flex-1 h-9 text-sm border-slate-200 rounded-lg"
                />
                <Button onClick={handleAddDay} size="sm" variant="outline" className="h-9 px-4 border-slate-200 rounded-lg">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Reminders are sent daily at 9 AM UTC. If enabled, customers will receive emails on the configured days before their annual report due date.
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Cron Job Status</p>
                  <p className="text-xs text-slate-500">Runs daily at 9 AM UTC via Vercel Cron</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={fetchSettings} className="border-slate-200 rounded-lg">
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg gap-2">
            {isSaving ? <Spinner /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}
