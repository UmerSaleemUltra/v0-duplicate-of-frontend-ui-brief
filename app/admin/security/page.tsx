"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  AlertTriangle,
  Ban,
  Activity,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Lock,
  Unlock,
  Wifi,
  Copy,
  Check,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MigrationMilestoneCard } from "@/components/admin/migration-milestone-card"

const MAX_REASON_LEN = 48
const MAX_TYPE_LEN = 20

function TruncatedText({ text, maxLen }: { text: string; maxLen: number }) {
  const [copied, setCopied] = useState(false)
  if (!text) return null
  if (text.length <= maxLen) return <span>{text}</span>

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-default min-w-0">
          <span className="truncate">{text.slice(0, maxLen) + "…"}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

interface SecurityStats {
  blockedIPs: number
  totalThreats: number
  requestsToday: number
  activeThreats: number
}

interface BlockedIP {
  ip: string
  reason: string
  threatLevel: "low" | "medium" | "high" | "critical"
  blockedAt: string
  requestCount: number
  lastAttempt: string
}

interface ActiveIP {
  ip: string
  requestCount: number
  lastSeen: string
  suspiciousActivity: number
}

interface SecurityThreat {
  ip: string
  timestamp: string
  date: string
  requestCount: number
  reason: string
  action: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
}

const severityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-100 text-red-700" },
  high: { label: "High", className: "bg-orange-100 text-orange-700" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", className: "bg-blue-100 text-blue-700" },
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  active,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  active?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          active ? "bg-red-50" : "bg-gray-50"
        }`}
      >
        <Icon className={`h-5 w-5 ${active ? "text-red-500" : "text-gray-400"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
  )
}

function SecurityDashboardContent() {
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<SecurityStats>({
    blockedIPs: 0,
    totalThreats: 0,
    requestsToday: 0,
    activeThreats: 0,
  })
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [whitelistIP, setWhitelistIP] = useState("")
  const [isWhitelisting, setIsWhitelisting] = useState(false)
  const [activeIPs, setActiveIPs] = useState<ActiveIP[]>([])
  const [ipToBan, setIpToBan] = useState("")
  const [isBanning, setIsBanning] = useState(false)
  const [banDuration, setBanDuration] = useState<"30min" | "24hr" | "permanent">("30min")
  const [banReason, setBanReason] = useState("")
  const [activeTab, setActiveTab] = useState("blocked")
  const [currentUserIP, setCurrentUserIP] = useState("Loading...")
  const [threats, setThreats] = useState<SecurityThreat[]>([])
  const [isLoadingThreats, setIsLoadingThreats] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/login")
        return
      }
      const user = authService.getCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/client/dashboard")
        return
      }
      setIsAuthenticating(false)
    }
    checkAuth()
  }, [router])

  const loadSecurityData = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/admin/security/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch security data")

      const data = await response.json()
      setStats(data.stats || stats)
      setBlockedIPs(data.blockedIPs || [])
      setActiveIPs(data.activeIPs || [])
      setCurrentUserIP(data.yourIP || "Unknown")
      setIsLoading(false)

      loadThreats()
    } catch (error) {
      console.error("Error loading security data:", error)
      toast.error("Failed to load security data")
      setIsLoading(false)
    }
  }

  const loadThreats = async () => {
    try {
      setIsLoadingThreats(true)
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/admin/security/threats?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch threats")

      const data = await response.json()
      setThreats(data.threats || [])
    } catch (error) {
      console.error("Error loading threats:", error)
    } finally {
      setIsLoadingThreats(false)
    }
  }

  useEffect(() => {
    if (isAuthenticating) return
    loadSecurityData()
  }, [isAuthenticating])

  useEffect(() => {
    if (!autoRefresh || isAuthenticating) return
    const interval = setInterval(() => loadSecurityData(), 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticating])

  const handleUnblockIP = async (ip: string) => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/admin/security/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip }),
      })

      if (!response.ok) throw new Error("Failed to unblock IP")
      toast.success(`IP ${ip} has been unblocked`)
      loadSecurityData()
    } catch (error) {
      console.error("Error unblocking IP:", error)
      toast.error("Failed to unblock IP")
    }
  }

  const handleWhitelistIP = async () => {
    if (!whitelistIP.trim()) {
      toast.error("Please enter an IP address")
      return
    }
    setIsWhitelisting(true)
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/admin/security/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip: whitelistIP.trim() }),
      })

      if (!response.ok) throw new Error("Failed to whitelist IP")
      toast.success(`IP ${whitelistIP} has been whitelisted`)
      setWhitelistIP("")
      loadSecurityData()
    } catch (error) {
      console.error("Error whitelisting IP:", error)
      toast.error("Failed to whitelist IP")
    } finally {
      setIsWhitelisting(false)
    }
  }

  const handleBanIP = async () => {
    if (!ipToBan.trim()) {
      toast.error("Please enter an IP address")
      return
    }
    if (!banReason.trim()) {
      toast.error("Please provide a reason for banning")
      return
    }
    setIsBanning(true)
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/admin/security/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip: ipToBan.trim(), duration: banDuration, reason: banReason.trim() }),
      })

      if (!response.ok) throw new Error("Failed to ban IP")
      toast.success(`IP ${ipToBan} has been banned (${banDuration})`)
      setIpToBan("")
      setBanReason("")
      loadSecurityData()
    } catch (error) {
      console.error("Error banning IP:", error)
      toast.error("Failed to ban IP")
    } finally {
      setIsBanning(false)
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    loadSecurityData()
  }

  const filteredIPs = blockedIPs.filter(
    (ip) =>
      ip.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.reason.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isAuthenticating || isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 bg-gray-100 rounded-lg w-52" />
          <div className="h-4 bg-gray-50 rounded-lg w-80" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-48" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-96" />
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Security</h1>
          </div>
          <p className="text-sm text-gray-500">Real-time monitoring and threat management</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5 text-xs h-8">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Your IP card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Wifi className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Your IP Address</p>
            <code className="text-sm font-mono font-semibold text-gray-900">{currentUserIP}</code>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-xs font-medium text-green-700">Allowed</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Blocked IPs"
          value={stats.blockedIPs.toString()}
          sub="Currently blocked"
          icon={Ban}
          active={stats.blockedIPs > 0}
        />
        <StatCard
          label="Total Threats"
          value={stats.totalThreats.toString()}
          sub="Detected today"
          icon={AlertTriangle}
          active={stats.totalThreats > 0}
        />
        <StatCard
          label="Requests Today"
          value={stats.requestsToday.toLocaleString()}
          sub="Total tracked"
          icon={Activity}
        />
        <StatCard
          label="Active IPs"
          value={activeIPs.length.toString()}
          sub="Currently connected"
          icon={Eye}
        />
      </div>

      {/* Controls row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Whitelist */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <SectionHeading title="Whitelist IP" description="Bypass all security checks for trusted IPs" />
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 192.168.1.1"
              value={whitelistIP}
              onChange={(e) => setWhitelistIP(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleWhitelistIP() }}
              className="flex-1 h-9 text-sm"
            />
            <Button
              onClick={handleWhitelistIP}
              disabled={isWhitelisting || !whitelistIP.trim()}
              size="sm"
              className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {isWhitelisting ? "Adding..." : "Whitelist"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Unlock className="h-3 w-3" />
            Whitelisted IPs bypass all rate limiting and DDoS checks
          </p>
        </div>

        {/* Manual Ban */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <SectionHeading title="Manual IP Ban" description="Block specific IPs with a custom duration" />
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="IP Address"
                value={ipToBan}
                onChange={(e) => setIpToBan(e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value as "30min" | "24hr" | "permanent")}
                className="h-9 px-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="30min">30 min</option>
                <option value="24hr">24 hr</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Reason for ban"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <Button
                onClick={handleBanIP}
                disabled={isBanning || !ipToBan.trim() || !banReason.trim()}
                size="sm"
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white flex-shrink-0"
              >
                <Ban className="h-3.5 w-3.5" />
                {isBanning ? "Banning..." : "Ban"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* IP Management */}
      <TooltipProvider delayDuration={300}>
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <SectionHeading title="IP Management" description="View and manage all tracked IP addresses" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <TabsList className="bg-gray-100 rounded-lg h-8 p-0.5 gap-0.5">
              <TabsTrigger value="blocked" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Ban className="h-3.5 w-3.5 mr-1.5" />
                Banned ({blockedIPs.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Active ({activeIPs.length})
              </TabsTrigger>
            </TabsList>
            {activeTab === "blocked" && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs w-48"
                />
              </div>
            )}
          </div>

          <TabsContent value="blocked" className="mt-0">
            {filteredIPs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No banned IPs found</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredIPs.map((blockedIP) => {
                  const sev = severityConfig[blockedIP.threatLevel] || severityConfig.medium
                  return (
                    <div
                      key={blockedIP.ip}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <code className="text-sm font-mono font-semibold text-gray-900">{blockedIP.ip}</code>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sev.className}`}>
                            {sev.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          <TruncatedText text={blockedIP.reason || ""} maxLen={MAX_REASON_LEN} />
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(blockedIP.blockedAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockIP(blockedIP.ip)}
                        className="gap-1.5 ml-3 h-8 text-xs flex-shrink-0"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Unblock
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-0">
            {activeIPs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Eye className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No active IPs tracked</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeIPs.map((activeIP) => (
                  <div
                    key={activeIP.ip}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono font-semibold text-gray-900">{activeIP.ip}</code>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{activeIP.requestCount} requests</span>
                        {activeIP.suspiciousActivity > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                            Suspicious: {activeIP.suspiciousActivity}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIpToBan(activeIP.ip)
                        setBanReason("Suspicious activity detected from active monitoring")
                        setActiveTab("blocked")
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      className="gap-1.5 ml-3 h-8 text-xs flex-shrink-0"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Ban
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Threat Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <SectionHeading title="Security Threat Logs" description="Recent security events recorded in database" />
        {isLoadingThreats ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-700 mx-auto" />
          </div>
        ) : threats.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No security threats detected</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {threats.map((threat, index) => {
              const sev = severityConfig[threat.severity] || severityConfig.medium
              return (
                <div
                  key={index}
                  className="flex items-start justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <code className="text-sm font-mono font-semibold text-gray-900">{threat.ip}</code>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sev.className}`}>
                        {sev.label}
                      </span>
                      <span className="text-xs text-gray-400 px-2 py-0.5 rounded-full bg-gray-100 inline-flex items-center gap-1">
                        <TruncatedText text={threat.type || ""} maxLen={MAX_TYPE_LEN} />
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-0.5">
                      <TruncatedText text={threat.reason || ""} maxLen={MAX_REASON_LEN} />
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(threat.timestamp).toLocaleString()}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>{threat.action}</span>
                      {threat.requestCount > 0 && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{threat.requestCount} req</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </TooltipProvider>

      {/* Data Migration Section */}
      <div className="space-y-4">
        <SectionHeading title="Data Migrations" description="One-time operations to update system data" />
        <MigrationMilestoneCard />
      </div>
    </div>
  )
}

export default function SecurityDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-700" />
        </div>
      }
    >
      <SecurityDashboardContent />
    </Suspense>
  )
}
