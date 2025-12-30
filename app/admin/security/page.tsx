"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  AlertTriangle,
  Ban,
  Activity,
  Globe,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  Eye,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"

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

interface ThreatLog {
  id: string
  ip: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  details: string
  blocked: boolean
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
  const [threatLogs, setThreatLogs] = useState<ThreatLog[]>([])
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch security data")
      }

      const data = await response.json()

      setStats(data.stats || stats)
      setBlockedIPs(data.blockedIPs || [])
      setActiveIPs(data.activeIPs || [])
      setThreatLogs(data.threats || [])
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading security data:", error)
      toast.error("Failed to load security data")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticating) return
    loadSecurityData()
  }, [isAuthenticating])

  useEffect(() => {
    if (!autoRefresh || isAuthenticating) return

    const interval = setInterval(() => {
      loadSecurityData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticating])

  const handleUnblockIP = async (ip: string) => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/admin/security/unblock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ip }),
      })

      if (!response.ok) {
        throw new Error("Failed to unblock IP")
      }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ip: whitelistIP.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to whitelist IP")
      }

      toast.success(`IP ${whitelistIP} has been whitelisted and will never be blocked`)
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ip: ipToBan.trim(),
          duration: banDuration,
          reason: banReason.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to ban IP")
      }

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

  const getThreatBadgeColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const statsCards = [
    {
      name: "Blocked IPs",
      value: stats.blockedIPs.toString(),
      subtitle: "Currently blocked",
      icon: Ban,
      color: "from-red-500 to-red-600",
    },
    {
      name: "Total Threats",
      value: stats.totalThreats.toString(),
      subtitle: "Detected today",
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
    },
    {
      name: "Requests Today",
      value: stats.requestsToday.toLocaleString(),
      subtitle: "Total requests",
      icon: Activity,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Active Threats",
      value: stats.activeThreats.toString(),
      subtitle: "Ongoing attacks",
      icon: Shield,
      color: "from-purple-500 to-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Security Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Real-time security monitoring and threat management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 bg-transparent">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.name} className="bg-white border-slate-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">{stat.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Whitelist IP Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Whitelist IP Address
          </CardTitle>
          <CardDescription>Add trusted IP addresses that will never be blocked by security measures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.1)"
              value={whitelistIP}
              onChange={(e) => setWhitelistIP(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleWhitelistIP()
              }}
              className="flex-1 bg-white"
            />
            <Button
              onClick={handleWhitelistIP}
              disabled={isWhitelisting || !whitelistIP.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
            >
              <Plus className="h-4 w-4" />
              {isWhitelisting ? "Adding..." : "Whitelist"}
            </Button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Whitelisted IPs bypass all security checks including DDoS protection and rate limiting
          </p>
        </CardContent>
      </Card>

      {/* Manual Ban Section */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600" />
            Manual IP Ban
          </CardTitle>
          <CardDescription>Ban specific IP addresses with custom duration and reason</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">IP Address</label>
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={ipToBan}
                onChange={(e) => setIpToBan(e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Ban Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value as "30min" | "24hr" | "permanent")}
                className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
              >
                <option value="30min">30 Minutes</option>
                <option value="24hr">24 Hours</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Reason for Ban</label>
            <Input
              placeholder="Enter reason (e.g., Suspicious activity, DDoS attempt, etc.)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBanIP}
              disabled={isBanning || !ipToBan.trim() || !banReason.trim()}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 gap-2"
            >
              <Ban className="h-4 w-4" />
              {isBanning ? "Banning..." : "Ban IP Address"}
            </Button>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-medium mb-1">Ban Methods Explained:</p>
            <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
              <li>
                <strong>30 Minutes:</strong> Temporary ban for minor violations or suspicious activity
              </li>
              <li>
                <strong>24 Hours:</strong> Medium-term ban for repeated violations or moderate threats
              </li>
              <li>
                <strong>Permanent:</strong> Blacklist the IP permanently for severe threats or attacks
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* IP Management with Tabs */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">IP Management</CardTitle>
          <CardDescription>View active IPs and manage banned addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="blocked" className="gap-2">
                <Ban className="h-4 w-4" />
                Banned IPs ({blockedIPs.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                <Eye className="h-4 w-4" />
                Active IPs ({activeIPs.length})
              </TabsTrigger>
            </TabsList>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by IP or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <TabsContent value="blocked">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <p className="text-center text-slate-500 py-8">Loading...</p>
                ) : filteredIPs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    {searchQuery ? "No matching IPs found" : "No banned IPs"}
                  </p>
                ) : (
                  filteredIPs.map((ip) => (
                    <div
                      key={ip.ip}
                      className="p-4 rounded-lg border border-slate-200 hover:border-red-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-slate-500" />
                            <p className="text-sm font-mono font-semibold text-slate-900">{ip.ip}</p>
                            <Badge className={getThreatBadgeColor(ip.threatLevel)}>{ip.threatLevel}</Badge>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{ip.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {ip.requestCount} attempts
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ip.blockedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockIP(ip.ip)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          Unblock
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <p className="text-center text-slate-500 py-8">Loading...</p>
                ) : activeIPs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No active connections</p>
                ) : (
                  activeIPs
                    .filter((ip) => ip.ip.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((ip) => (
                      <div
                        key={ip.ip}
                        className="p-4 rounded-lg border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="h-4 w-4 text-green-500" />
                              <p className="text-sm font-mono font-semibold text-slate-900">{ip.ip}</p>
                              <Badge className="bg-green-500 text-white">Active</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {ip.requestCount} requests
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last seen: {new Date(ip.lastSeen).toLocaleTimeString()}
                              </span>
                            </div>
                            {ip.suspiciousActivity > 0 && (
                              <div className="flex items-center gap-1 text-xs text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                {ip.suspiciousActivity} suspicious actions detected
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIpToBan(ip.ip)
                              setBanReason("Suspicious activity detected")
                              window.scrollTo({ top: 0, behavior: "smooth" })
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Threat Logs */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Threats</CardTitle>
          <CardDescription>Real-time threat detection logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-slate-500 py-8">Loading...</p>
            ) : threatLogs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">All Clear</p>
                <p className="text-sm text-slate-500">No threats detected</p>
              </div>
            ) : (
              threatLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {log.blocked ? (
                        <Ban className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm font-semibold text-slate-900">{log.type}</span>
                    </div>
                    <Badge className={getThreatBadgeColor(log.severity)}>{log.severity}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{log.details}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Globe className="h-3 w-3" />
                      {log.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.blocked && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3 w-3" />
                      Blocked automatically
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Security Status</CardTitle>
          <CardDescription>Current protection levels and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">DDoS Protection Active</span>
              </div>
              <Badge className="bg-green-600 text-white">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">XSS Protection Active</span>
              </div>
              <Badge className="bg-green-600 text-white">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Rate Limiting Active</span>
              </div>
              <Badge className="bg-green-600 text-white">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Security Headers Configured</span>
              </div>
              <Badge className="bg-green-600 text-white">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SecurityDashboard() {
  return (
    <Suspense fallback={null}>
      <SecurityDashboardContent />
    </Suspense>
  )
}
