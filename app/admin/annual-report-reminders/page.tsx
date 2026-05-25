"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Reminder {
  id: string
  companyId: string
  companyName: string
  state: string
  formationDate: string
  dueDate: string
  daysUntil: number
  urgency: "critical" | "urgent" | "upcoming" | "later"
  fee: number
  lateFee?: number
  notes?: string
  userEmail: string | null
  userName: string
  status: "pending" | "sent" | "completed" | "snoozed"
  lastSent: string | null
  sentCount: number
  snoozedUntil: string | null
}

interface Stats {
  total: number
  critical: number
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
  const [stats, setStats] = useState<Stats>({ total: 0, critical: 0, urgent: 0, upcoming: 0, later: 0 })
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [isLive, setIsLive] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: "send" | "complete" | "snooze" | null
    reminder: Reminder | null
    snoozeDays?: number
  }>({ open: false, type: null, reminder: null })

  const fetchReminders = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch(`/api/annual-report-reminders?_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch reminders")

      const data = await response.json()
      setReminders(data.data || [])
      setFilteredReminders(data.data || [])
      setStats(data.stats || { total: 0, critical: 0, urgent: 0, upcoming: 0, later: 0 })
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
  }

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchReminders()
    }
  }, [isLoading, isAuthenticated])

  // Live refresh every 30 seconds when enabled
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(fetchReminders, 30000)
    return () => clearInterval(interval)
  }, [isLive])

  // Filter reminders
  useEffect(() => {
    let filtered = [...reminders]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.companyName.toLowerCase().includes(query) ||
          r.state.toLowerCase().includes(query) ||
          r.userName.toLowerCase().includes(query) ||
          (r.userEmail && r.userEmail.toLowerCase().includes(query))
      )
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((r) => r.urgency === urgencyFilter)
    }

    setFilteredReminders(filtered)
  }, [searchQuery, urgencyFilter, reminders])

  const handleAction = async (type: "send" | "complete" | "snooze", reminder: Reminder, snoozeDays?: number) => {
    setActionLoading(reminder.id)
    try {
      const token = authService.getToken()
      const response = await fetch("/api/annual-report-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: type === "send" ? "send_reminder" : type === "complete" ? "mark_complete" : "snooze",
          companyId: reminder.companyId,
          snoozeDays,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Action failed")

      toast({
        title: "Success",
        description: data.message,
      })

      fetchReminders()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Action failed",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setConfirmDialog({ open: false, type: null, reminder: null })
    }
  }

  const getUrgencyBadge = (urgency: string, daysUntil: number) => {
    switch (urgency) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <AlertTriangle className="h-3 w-3" />
            {daysUntil} days
          </Badge>
        )
      case "urgent":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
            <Clock className="h-3 w-3" />
            {daysUntil} days
          </Badge>
        )
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <Calendar className="h-3 w-3" />
            {daysUntil} days
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
            <Calendar className="h-3 w-3" />
            {daysUntil} days
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Mail className="h-3 w-3" />
            Sent
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "snoozed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <Timer className="h-3 w-3" />
            Snoozed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1">
            <Bell className="h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  if (isLoading || dataLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="h-4 bg-slate-100 rounded w-96"></div>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-16"></div>
              <div className="h-8 bg-slate-100 rounded w-12"></div>
            </div>
          ))}
        </div>
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded"></div>
          ))}
        </div>
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

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <div className="text-xs font-medium text-red-600 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Critical
          </div>
          <div className="mt-2 text-3xl font-semibold text-red-700">{stats.critical}</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wide flex items-center gap-1">
            <Clock className="h-3 w-3" /> Urgent
          </div>
          <div className="mt-2 text-3xl font-semibold text-amber-700">{stats.urgent}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Upcoming
          </div>
          <div className="mt-2 text-3xl font-semibold text-blue-700">{stats.upcoming}</div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Later</div>
          <div className="mt-2 text-3xl font-semibold text-slate-700">{stats.later}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by company, state, client name, or email..."
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

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400">Urgency:</span>
          {["all", "critical", "urgent", "upcoming", "later"].map((u) => (
            <button
              key={u}
              onClick={() => setUrgencyFilter(u)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                urgencyFilter === u
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {u === "all" ? "All" : u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
          {(searchQuery || urgencyFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("")
                setUrgencyFilter("all")
              }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reminders List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">Reminders</span>
          <span className="text-xs text-slate-400">{filteredReminders.length} total</span>
        </div>

        {filteredReminders.length === 0 ? (
          <div className="text-center py-16">
            <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400">
              {searchQuery || urgencyFilter !== "all"
                ? "No reminders match your filters"
                : "No annual report reminders"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Company
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    State
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Due Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Urgency
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Fee
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{reminder.companyName}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-slate-400 truncate max-w-[160px]">
                                {reminder.userName} {reminder.userEmail && `• ${reminder.userEmail}`}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              {reminder.userName}
                              {reminder.userEmail && ` (${reminder.userEmail})`}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {reminder.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {new Date(reminder.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getUrgencyBadge(reminder.urgency, reminder.daysUntil)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {reminder.fee}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(reminder.status)}</td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                            disabled={actionLoading === reminder.id}
                          >
                            {actionLoading === reminder.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmDialog({ open: true, type: "send", reminder })
                            }
                            disabled={!reminder.userEmail}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmDialog({ open: true, type: "complete", reminder })
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmDialog({ open: true, type: "snooze", reminder, snoozeDays: 7 })
                            }
                          >
                            <Timer className="h-4 w-4 mr-2" />
                            Snooze 7 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmDialog({ open: true, type: "snooze", reminder, snoozeDays: 14 })
                            }
                          >
                            <Timer className="h-4 w-4 mr-2" />
                            Snooze 14 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmDialog({ open: true, type: "snooze", reminder, snoozeDays: 30 })
                            }
                          >
                            <Timer className="h-4 w-4 mr-2" />
                            Snooze 30 days
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, reminder: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "send" && "Send Reminder Email"}
              {confirmDialog.type === "complete" && "Mark as Completed"}
              {confirmDialog.type === "snooze" && `Snooze for ${confirmDialog.snoozeDays} days`}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "send" && (
                <>
                  Send an annual report reminder email to{" "}
                  <strong>{confirmDialog.reminder?.userEmail}</strong> for{" "}
                  <strong>{confirmDialog.reminder?.companyName}</strong>?
                </>
              )}
              {confirmDialog.type === "complete" && (
                <>
                  Mark the annual report for <strong>{confirmDialog.reminder?.companyName}</strong> as
                  completed? This indicates the report has been filed.
                </>
              )}
              {confirmDialog.type === "snooze" && (
                <>
                  Snooze reminders for <strong>{confirmDialog.reminder?.companyName}</strong> for{" "}
                  {confirmDialog.snoozeDays} days?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: null, reminder: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.reminder && confirmDialog.type) {
                  handleAction(confirmDialog.type, confirmDialog.reminder, confirmDialog.snoozeDays)
                }
              }}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
