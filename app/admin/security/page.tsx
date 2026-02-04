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
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Zap,
  Lock,
  Unlock,
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch threats")
      }

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

    const interval = setInterval(() => {
      loadSecurityData()
    }, 30000)

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

  const statsCards = [
    {
      name: "Blocked IPs",
      value: stats.blockedIPs.toString(),
      subtitle: "Currently blocked",
      icon: Ban,
      color: "from-red-500 to-red-600",
      trend: stats.blockedIPs > 0 ? "up" : "stable",
    },
    {
      name: "Total Threats",
      value: stats.totalThreats.toString(),
      subtitle: "Detected today",
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      trend: stats.totalThreats > 0 ? "up" : "stable",
    },
    {
      name: "Requests Today",
      value: stats.requestsToday.toLocaleString(),
      subtitle: "Total tracked",
      icon: Activity,
      color: "from-blue-500 to-blue-600",
      trend: "stable",
    },
    {
      name: "Active IPs",
      value: activeIPs.length.toString(),
      subtitle: "Currently connected",
      icon: Eye,
      color: "from-purple-500 to-purple-600",
      trend: "stable",
    },
  ]

  if (isAuthenticating || isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-4 bg-slate-100 rounded w-96"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-24"></div>
                  <div className="h-7 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded-lg">
          <div className="border-b p-4">
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-200 rounded w-32"></div>
              ))}
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-100 rounded w-32"></div>
              <div className="h-10 bg-slate-100 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-5 bg-slate-200 rounded w-32"></div>
                        <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                      </div>
                      <div className="h-4 bg-slate-100 rounded w-64"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 w-20 bg-slate-200 rounded"></div>
                      <div className="h-9 w-20 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Security Dashboard</h1>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3" />
                All systems operational
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Real-time security monitoring and threat management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            <Activity className={`h-4 w-4 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 bg-white">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Your Connection Status card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Your Connection Status
            </div>
            <Badge className="bg-green-500 text-white">ALLOWED</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Your IP Address:</span>
              <code className="text-sm bg-white px-3 py-1 rounded font-mono text-slate-900 border border-blue-200">
                {currentUserIP}
              </code>
            </div>
            <div className="text-xs text-slate-600 mt-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Your IP has full admin access and is not blocked
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card
            key={stat.name}
            className="bg-white border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`}
            />
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
              <div className="flex items-end justify-between">
                <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
                {stat.trend === "up" && <Badge className="bg-orange-500 text-white text-xs">Active</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-300 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Whitelist IP Address</CardTitle>
              <CardDescription className="text-slate-600">
                Add trusted IP addresses that bypass all security measures
              </CardDescription>
            </div>
          </div>
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
              className="flex-1 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
            <Button
              onClick={handleWhitelistIP}
              disabled={isWhitelisting || !whitelistIP.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              {isWhitelisting ? "Adding..." : "Whitelist"}
            </Button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-blue-900 font-medium flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              Whitelisted IPs bypass all security checks
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-2 border-red-300 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
              <Ban className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Manual IP Ban Control</CardTitle>
              <CardDescription className="text-slate-600">
                Ban specific IP addresses with custom duration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">IP Address</label>
              <Input
                placeholder="Enter IP address"
                value={ipToBan}
                onChange={(e) => setIpToBan(e.target.value)}
                className="bg-white border-red-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Ban Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value as "30min" | "24hr" | "permanent")}
                className="w-full h-10 px-3 rounded-md border border-red-200 bg-white text-sm"
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
              placeholder="Enter reason (e.g., DDoS attack detected)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="bg-white border-red-200"
            />
          </div>
          <Button
            onClick={handleBanIP}
            disabled={isBanning || !ipToBan.trim() || !banReason.trim()}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 gap-2"
          >
            <Ban className="h-4 w-4" />
            {isBanning ? "Banning..." : "Ban IP Address"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">IP Management</CardTitle>
          <CardDescription>View and manage IP addresses</CardDescription>
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

            <TabsContent value="blocked" className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search blocked IPs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto" />
                </div>
              ) : filteredIPs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Ban className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No banned IPs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredIPs.map((blockedIP) => (
                    <div
                      key={blockedIP.ip}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono font-semibold text-slate-900">{blockedIP.ip}</code>
                          <Badge className="bg-red-500 text-white text-xs">{blockedIP.threatLevel}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-1">{blockedIP.reason}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(blockedIP.blockedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockIP(blockedIP.ip)}
                        className="gap-2 bg-white"
                      >
                        <Unlock className="h-4 w-4" />
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                </div>
              ) : activeIPs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No active IPs tracked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeIPs.map((activeIP) => (
                    <div
                      key={activeIP.ip}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <code className="text-sm font-mono font-semibold text-slate-900">{activeIP.ip}</code>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>{activeIP.requestCount} requests</span>
                          {activeIP.suspiciousActivity > 0 && (
                            <Badge className="bg-yellow-500 text-white text-xs">
                              Suspicious: {activeIP.suspiciousActivity}
                            </Badge>
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
                        className="gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Ban
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Threat Logs section */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Security Threat Logs
          </CardTitle>
          <CardDescription>Recent security events and threats from database</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingThreats ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" />
            </div>
          ) : threats.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>No security threats detected</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {threats.map((threat, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono font-semibold text-slate-900">{threat.ip}</code>
                      <Badge
                        className={
                          threat.severity === "critical"
                            ? "bg-red-600 text-white"
                            : threat.severity === "high"
                              ? "bg-orange-500 text-white"
                              : threat.severity === "medium"
                                ? "bg-yellow-500 text-white"
                                : "bg-blue-500 text-white"
                        }
                      >
                        {threat.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {threat.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">{threat.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(threat.timestamp).toLocaleString()}
                      </span>
                      <span>Action: {threat.action}</span>
                      {threat.requestCount > 0 && <span>Requests: {threat.requestCount}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SecurityDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      }
    >
      <SecurityDashboardContent />
    </Suspense>
  )
}
