"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  MoreVertical,
  Search,
  X,
  Bell,
  Building2,
  MapPin,
  DollarSign,
  RefreshCw,
  Mail,
  Timer,
  FileCheck,
  Radio,
  Settings,
} from "lucide-react"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

interface Reminder {
  _id: string | null
  companyId: string
  companyName: string
  state: string
  formationDate: string
  dueDate: string
  daysUntil: number
  fee: number
  frequency: string
  notes: string
  status: string
  lastReminderSent: string | null
  reminderCount: number
  userId: string
}

interface Summary {
  total: number
  urgent: number
  upcoming: number
  later: number
}

export default function AnnualReportRemindersPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const { toast } = useToast()
  const router = useRouter()

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, urgent: 0, upcoming: 0, later: 0 })
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [isLive, setIsLive] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    reminder: Reminder | null
    title: string
    description: string
  }>({ open: false, action: "", reminder: null, title: "", description: "" })

  const fetchReminders = useCallback(async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch(`/api/annual-report-reminders?daysAhead=180&_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch reminders")

      const data = await response.json()
      if (data.success) {
        setReminders(data.data || [])
        setSummary(data.summary || { total: 0, urgent: 0, upcoming: 0, later: 0 })
      }
    } catch (error) {
      console.error("Error fetching reminders:", error)
      toast({
        title: "Error",
        description: "Failed to load reminders",
        variant: "destructive",
      })
    } finally {
      setDataLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchReminders()
    }
  }, [isLoading, isAuthenticated, fetchReminders])

  // SSE for realtime updates
  useEffect(() => {
    const token = authService.getToken()
    if (!token) return

    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      eventSource = new EventSource(`/api/realtime/sse?token=${token}`)

      eventSource.onopen = () => {
        setIsLive(true)
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
          reconnectTimeout = null
        }
      }

      eventSource.onerror = () => {
        setIsLive(false)
        eventSource?.close()
        reconnectTimeout = setTimeout(connect, 5000)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.resource === "annual-report-reminders") {
            fetchReminders()
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    connect()

    return () => {
      eventSource?.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [fetchReminders])

  // Filter reminders
  useEffect(() => {
    let filtered = [...reminders]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.companyName.toLowerCase().includes(query) ||
          r.state.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    if (urgencyFilter === "urgent") {
      filtered = filtered.filter((r) => r.daysUntil <= 30)
    } else if (urgencyFilter === "upcoming") {
      filtered = filtered.filter((r) => r.daysUntil > 30 && r.daysUntil <= 60)
    } else if (urgencyFilter === "later") {
      filtered = filtered.filter((r) => r.daysUntil > 60)
    }

    setFilteredReminders(filtered)
  }, [reminders, searchQuery, statusFilter, urgencyFilter])

  const handleAction = async (action: string, reminder: Reminder, snoozeDays?: number) => {
    setActionLoading(reminder.companyId)
    try {
      const token = authService.getToken()
      if (!token) throw new Error("Not authenticated")

      const response = await fetch("/api/annual-report-reminders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          companyId: reminder.companyId,
          snoozeDays,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })
        fetchReminders()
      } else {
        throw new Error(data.error || "Action failed")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setConfirmDialog({ open: false, action: "", reminder: null, title: "", description: "" })
    }
  }

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 14) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
    } else if (daysUntil <= 30) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Urgent</Badge>
    } else if (daysUntil <= 60) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Upcoming</Badge>
    } else {
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Later</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>
      case "snoozed":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Snoozed</Badge>
      default:
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Pending</Badge>
    }
  }

  if (isLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Annual Report Reminders</h1>
            {isLive && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Track and send annual report filing reminders to clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/annual-report-reminders/settings")}
            className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const token = authService.getToken()
                const res = await fetch("/api/cron/annual-report-reminders", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                if (data.success) {
                  toast({
                    title: "Auto-Send Complete",
                    description: `Sent ${data.remindersSent?.length || 0} reminders`,
                  })
                  fetchReminders()
                } else {
                  toast({ title: "Error", description: data.error, variant: "destructive" })
                }
              } catch {
                toast({ title: "Error", description: "Failed to run auto-send", variant: "destructive" })
              }
            }}
            className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Auto-Send Due
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReminders}
            className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</div>
              <div className="text-2xl font-semibold text-slate-900">{summary.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Urgent</div>
              <div className="text-2xl font-semibold text-red-700">{summary.urgent}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">Upcoming</div>
              <div className="text-2xl font-semibold text-amber-700">{summary.upcoming}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Later</div>
              <div className="text-2xl font-semibold text-slate-900">{summary.later}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by company name or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 border-slate-200 text-sm rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400">Urgency:</span>
          {["all", "urgent", "upcoming", "later"].map((u) => (
            <button
              key={u}
              onClick={() => setUrgencyFilter(u)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                urgencyFilter === u
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}

          <span className="text-xs text-slate-400 ml-2">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-32 text-xs rounded-full border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reminders List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">Upcoming Deadlines</span>
          <span className="text-xs text-slate-400">{filteredReminders.length} companies</span>
        </div>

        {filteredReminders.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No reminders found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReminders.map((reminder) => (
              <div
                key={reminder.companyId}
                className="px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900 truncate">{reminder.companyName}</h3>
                      {getUrgencyBadge(reminder.daysUntil)}
                      {getStatusBadge(reminder.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {reminder.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(reminder.dueDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Fee: ${reminder.fee}
                      </span>
                      {reminder.lastReminderSent && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Last sent: {new Date(reminder.lastReminderSent).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {reminder.notes && (
                      <p className="text-xs text-slate-400 mt-1">{reminder.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <div className={`text-lg font-bold ${
                        reminder.daysUntil <= 14 ? "text-red-600" :
                        reminder.daysUntil <= 30 ? "text-amber-600" :
                        "text-slate-700"
                      }`}>
                        {reminder.daysUntil}
                      </div>
                      <div className="text-xs text-slate-400">days</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-xl"
                      disabled={actionLoading === reminder.companyId}
                      onClick={() => setConfirmDialog({
                        open: true,
                        action: "send_reminder",
                        reminder,
                        title: "Send Reminder Email",
                        description: `Send an annual report reminder email to the owner of ${reminder.companyName}?`,
                      })}
                    >
                      {actionLoading === reminder.companyId ? (
                        <Spinner className="h-3 w-3" />
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </>
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => setConfirmDialog({
                            open: true,
                            action: "mark_complete",
                            reminder,
                            title: "Mark as Complete",
                            description: `Mark the annual report for ${reminder.companyName} as filed/complete?`,
                          })}
                        >
                          <FileCheck className="h-4 w-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction("snooze", reminder, 7)}>
                          <Timer className="h-4 w-4 mr-2" />
                          Snooze 7 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("snooze", reminder, 14)}>
                          <Timer className="h-4 w-4 mr-2" />
                          Snooze 14 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("snooze", reminder, 30)}>
                          <Timer className="h-4 w-4 mr-2" />
                          Snooze 30 days
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/orders?search=${encodeURIComponent(reminder.companyName)}`)}>
                          <Building2 className="h-4 w-4 mr-2" />
                          View Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog.reminder && handleAction(confirmDialog.action, confirmDialog.reminder)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
