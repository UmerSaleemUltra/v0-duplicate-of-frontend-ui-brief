"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const handleRefresh = () => {
    setIsLoading(true)
    loadSecurityData()
  }

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying authentication...</p>
        </div>
      </div>
    )
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Blocked IPs */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Blocked IP Addresses</CardTitle>
                <CardDescription>Manage blocked IPs and view threat details</CardDescription>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by IP or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-slate-500 py-8">Loading...</p>
              ) : filteredIPs.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {searchQuery ? "No matching IPs found" : "No blocked IPs"}
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
      </div>

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
