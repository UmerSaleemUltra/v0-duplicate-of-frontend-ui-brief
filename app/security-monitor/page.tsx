"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Shield, AlertTriangle, Ban, RefreshCw, Zap, Eye, TrendingUp } from "lucide-react"

interface SecurityStats {
  blockedIPs: number
  totalThreats: number
  requestsToday: number
  activeThreats: number
  yourIP: string
  yourStatus: string
}

interface RecentActivity {
  timestamp: string
  action: string
  severity: "low" | "medium" | "high" | "critical"
  ip?: string
}

export default function SecurityMonitorPage() {
  const [stats, setStats] = useState<SecurityStats>({
    blockedIPs: 0,
    totalThreats: 0,
    requestsToday: 0,
    activeThreats: 0,
    yourIP: "Loading...",
    yourStatus: "checking",
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/security/public-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch security data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "allowed":
        return "text-green-600 bg-green-50"
      case "blocked":
        return "text-red-600 bg-red-50"
      case "whitelisted":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-10 w-10 text-red-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Security Monitor</h1>
                <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3" />
                  Real-time protection active
                </p>
              </div>
            </div>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Live security monitoring - Updates every 5 seconds
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
            <Button variant="outline" size="sm" onClick={fetchSecurityData} className="gap-2 bg-transparent">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Your IP Status */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Your Connection Status
              </div>
              <Badge className={getStatusColor(stats.yourStatus)}>{stats.yourStatus.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Your IP Address:</span>
                <code className="text-sm bg-white px-3 py-1 rounded font-mono text-slate-900">{stats.yourIP}</code>
              </div>
              <div className="text-xs text-slate-600 mt-2">
                {stats.yourStatus === "allowed" && "✓ Your IP is not blocked and has normal access"}
                {stats.yourStatus === "blocked" && "✗ Your IP is currently blocked due to security policy"}
                {stats.yourStatus === "whitelisted" && "✓ Your IP is whitelisted and bypasses all security checks"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-red-200 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 opacity-10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Blocked IPs</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Currently blocked</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                <Ban className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stats.blockedIPs}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-orange-200 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 opacity-10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Total Threats</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Detected today</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stats.totalThreats}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Requests Today</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Total requests</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stats.requestsToday.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Active Threats</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Ongoing attacks</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-semibold text-slate-900">{stats.activeThreats}</div>
                {stats.activeThreats > 0 && <Badge className="bg-red-500 text-white text-xs">Active</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Security Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No recent security events</p>
                </div>
              ) : (
                recentActivity.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Badge className={getSeverityColor(activity.severity)}>{activity.severity.toUpperCase()}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      {activity.ip && <p className="text-xs text-slate-600 mt-1">IP: {activity.ip}</p>}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Status Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                DDoS Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600">Active monitoring and blocking</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                XSS Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600">Script injection prevention active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                SQL Injection Guard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600">Database attack prevention enabled</p>
            </CardContent>
          </Card>
        </div>

        {/* Last Update */}
        <div className="text-center text-xs text-slate-500">
          Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh: {autoRefresh ? "ON" : "OFF"}
        </div>
      </div>
    </div>
  )
}
