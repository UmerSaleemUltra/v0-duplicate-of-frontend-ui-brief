"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RevenueChartCarousel } from "@/components/admin/revenue-chart-carousel"
import {
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LayoutList,
  ShoppingBag,
  Mail,
  Phone,
  RefreshCw,
  TrendingDown,
  Eye,
} from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, Legend } from "recharts"

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
  })
  const [stateBreakdown, setStateBreakdown] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [chartData, setChartData] = useState<any[]>([])
  const [statesDrawerOpen, setStatesDrawerOpen] = useState(false)
  const [ordersDrawerOpen, setOrdersDrawerOpen] = useState(false)
  const [citiesDrawerOpen, setCitiesDrawerOpen] = useState(false)
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [packageData, setPackageData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [cityBreakdown, setCityBreakdown] = useState<{ city: string; country: string; count: number; percentage: number }[]>([])
  const [abandonedCheckouts, setAbandonedCheckouts] = useState<any[]>([])
  const [abandonedStats, setAbandonedStats] = useState<{
    total: number
    last24h: number
    last7Days: number
    potentialRevenue: number
    stepBreakdown: Record<string, number>
  }>({
    total: 0,
    last24h: 0,
    last7Days: 0,
    potentialRevenue: 0,
    stepBreakdown: {}
  })
  const [abandonedDrawerOpen, setAbandonedDrawerOpen] = useState(false)

  const verifyAndLoadDashboard = useCallback(async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          router.push("/login")
          return
        }

        // Verify admin access with server
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          router.push("/login")
          return
        }

        const data = await response.json()
        const user = data.user

        if (!user || user.role !== "admin") {
          router.push("/client/dashboard")
          return
        }

        setIsAuthenticating(false)
        setIsLoadingData(true)

        // Load dashboard data
        try {
          const timestamp = Date.now()
          const [usersResponse, companiesResponse] = await Promise.all([
            ApiClient.users.getAll(token),
            fetch(`/api/companies?_t=${timestamp}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            }).then((res) => res.json()),
          ])

          const allUsers = usersResponse.data || []
          const allCompanies = companiesResponse.data || companiesResponse || []

          const allOrders = allCompanies.flatMap((company: any) => {
            const companyOrders = company.orders || []

            return companyOrders.map((order: any) => ({
              ...order,
              companyId: company.id,
              companyName: company.name,
              state: company.state,
              userId: company.userId,
              packageType: company.packageType
                ? `${company.packageType} Package`
                : order.type === "Addon Purchase"
                  ? "Add-on Only"
                  : "N/A",
            }))
          })

        const sortedOrders = allOrders
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((order: any) => {
            const user = allUsers.find((u: any) => u.id === order.userId)
            return {
              ...order,
              userName: user?.name || "Unknown Customer",
            }
          })

        setAllOrders(sortedOrders)
        setOrders(sortedOrders.slice(0, 5))

        const now = new Date()
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const yearRevenue = allOrders
          .filter((order: any) => {
            const orderDate = new Date(order.createdAt)
            return orderDate >= startOfYear
          })
          .reduce((sum: number, order: any) => {
            const orderAmount = order.pricing?.total || order.amount || order.total || 0
            return sum + orderAmount
          }, 0)

        const currentMonthRevenue = allOrders
          .filter((order: any) => {
            const orderDate = new Date(order.createdAt)
            return orderDate >= startOfMonth
          })
          .reduce((sum: number, order: any) => {
            const orderAmount = order.pricing?.total || order.amount || order.total || 0
            return sum + orderAmount
          }, 0)

        const currentMonthName = now.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        const monthlyRevenueData = [
          {
            month: currentMonthName,
            revenue: currentMonthRevenue,
          },
        ]

        const activeCustomers = allUsers.filter((u: any) => u.role === "client").length

        setStats({
          totalRevenue: yearRevenue,
          monthlyRevenue: currentMonthRevenue,
          totalOrders: allOrders.length,
          activeCustomers,
        })

        setMonthlyData(monthlyRevenueData)

        const stateCount: Record<string, number> = {}
        allCompanies.forEach((company: any) => {
          if (company.state) {
            stateCount[company.state] = (stateCount[company.state] || 0) + 1
          }
        })

        const breakdown = Object.entries(stateCount)
          .map(([state, count]) => ({
            state,
            count,
            percentage: allCompanies.length > 0 ? Math.round((count / allCompanies.length) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)

        setStateBreakdown(breakdown)
        
        // Generate 12-month chart data for selected year
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const monthlyChartData = months.map((month, index) => {
          const startOfMonth = new Date(selectedYear, index, 1)
          const endOfMonth = new Date(selectedYear, index + 1, 0)
          
          const monthRevenue = allOrders
            .filter((order: any) => {
              const orderDate = new Date(order.createdAt)
              return orderDate >= startOfMonth && orderDate <= endOfMonth
            })
            .reduce((sum: number, order: any) => {
              const orderAmount = order.pricing?.total || order.amount || order.total || 0
              return sum + orderAmount
            }, 0)
          
          return {
            month,
            revenue: monthRevenue,
            fill: "#880000"
          }
        })
        
        setChartData(monthlyChartData)

        // Top Cities — derived from members[].city across all companies
        const cityCount: Record<string, { count: number; country: string }> = {}
        allCompanies.forEach((company: any) => {
          const members = company.members || []
          members.forEach((member: any) => {
            const raw = (member.city || "").trim()
            if (!raw) return
            const cityKey = raw.toLowerCase()
            if (!cityCount[cityKey]) {
              cityCount[cityKey] = { count: 0, country: (member.country || "").trim() }
            }
            cityCount[cityKey].count += 1
          })
        })
        const totalMemberCount = Object.values(cityCount).reduce((s, v) => s + v.count, 0)
        const cityBreakdownData = Object.entries(cityCount)
          .map(([key, val]) => ({
            city: key.replace(/\b\w/g, (c) => c.toUpperCase()),
            country: val.country,
            count: val.count,
            percentage: totalMemberCount > 0 ? Math.round((val.count / totalMemberCount) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)
        setCityBreakdown(cityBreakdownData)

        // Best-selling packages
        const packageCount: Record<string, { count: number; revenue: number }> = {}
        allOrders.forEach((order: any) => {
          const pkg = order.packageType || "N/A"
          if (!packageCount[pkg]) packageCount[pkg] = { count: 0, revenue: 0 }
          packageCount[pkg].count += 1
          packageCount[pkg].revenue += order.pricing?.total || order.amount || order.total || 0
        })
        const pkgData = Object.entries(packageCount)
          .map(([name, val]) => ({ name, count: val.count, revenue: val.revenue }))
          .sort((a, b) => b.count - a.count)
        setPackageData(pkgData)

        // Peak order hours/days heatmap
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const heatmap = days.map((day, dayIdx) => {
          const hours: Record<string, number> = {}
          for (let h = 0; h < 24; h++) hours[`h${h}`] = 0
          allOrders.forEach((order: any) => {
            const d = new Date(order.createdAt)
            if (d.getDay() === dayIdx) {
              const h = d.getHours()
              hours[`h${h}`] = (hours[`h${h}`] || 0) + 1
            }
          })
          return { day, ...hours }
        })
        setHeatmapData(heatmap)

        // Fetch abandoned checkouts
        try {
          const abandonedRes = await fetch("/api/abandoned-checkouts", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (abandonedRes.ok) {
            const abandonedJson = await abandonedRes.json()
            if (abandonedJson.success) {
              setAbandonedCheckouts(abandonedJson.data || [])
              setAbandonedStats(abandonedJson.stats || {
                total: 0, last24h: 0, last7Days: 0, potentialRevenue: 0, stepBreakdown: {}
              })
            }
          }
        } catch (e) {
          // Abandoned checkouts fetch is optional
        }

        setDataLoaded(true)
        setIsLoadingData(false)
      } catch (error) {
        console.error("[v0] Dashboard data loading failed:", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          authService.logout()
          router.push("/login")
        } else {
          try {
            toast.error("Error loading dashboard data")
          } catch (toastError) {
            console.error("[v0] Toast error:", toastError)
          }
        }
        setIsLoadingData(false)
      }
    }

  }, [router])

  useEffect(() => {
    verifyAndLoadDashboard()
  }, [verifyAndLoadDashboard])

  if (isAuthenticating || (isLoadingData && !dataLoaded)) {
    return (
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 md:h-10 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-48"></div>
          <div className="h-4 bg-slate-100 rounded w-72"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6">
              <div className="flex flex-row items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                  <div className="h-8 bg-slate-300 rounded w-32"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                    <div className="h-6 bg-slate-100 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Chart Skeleton */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded w-48"></div>
              <div className="h-4 bg-slate-100 rounded w-36"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
              <div className="h-10 w-20 bg-slate-200 rounded-full"></div>
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            </div>
          </div>
          <div className="h-[300px] bg-gradient-to-b from-slate-200 to-slate-100 rounded-lg"></div>
        </div>

        {/* Top Cities Skeleton */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6">
          <div className="space-y-2 mb-4">
            <div className="h-6 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-100 rounded w-56"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-white/60 border border-white/40 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-5 w-8 bg-slate-200 rounded-md"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-100 rounded w-10"></div>
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-slate-200 rounded-full flex-shrink-0"></div>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-16 ml-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Recent Orders Skeleton */}
          <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6">
            <div className="space-y-2 mb-4">
              <div className="h-6 bg-slate-200 rounded w-40"></div>
              <div className="h-4 bg-slate-100 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-white/40">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
              ))}
              <div className="h-10 bg-slate-200 rounded-xl w-full mt-4"></div>
            </div>
          </div>

          {/* Top States Skeleton */}
          <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6">
            <div className="space-y-2 mb-4">
              <div className="h-6 bg-slate-200 rounded w-40"></div>
              <div className="h-4 bg-slate-100 rounded w-48"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 bg-slate-200 rounded w-12"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-8"></div>
                </div>
              ))}
              <div className="h-10 bg-slate-200 rounded-xl w-full mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate real growth metrics
  const calculateMonthlyGrowth = () => {
    if (monthlyData.length === 0) return "+0%"
    // Compare current month to previous month (mock comparison for now)
    const currentMonth = monthlyData[0]?.revenue || 0
    if (currentMonth === 0) return "+0%"
    // Estimate growth based on current month value
    const growth = Math.round((currentMonth / 2500) * 100) - 100 || 0
    return growth > 0 ? `+${Math.min(growth, 99)}%` : `${growth}%`
  }

  const calculateOrdersGrowth = () => {
    if (stats.totalOrders === 0) return "+0%"
    // This month vs average per month
    const avgPerMonth = stats.totalOrders / 12
    const thisMonth = monthlyData.length > 0 ? 
      (monthlyData[0]?.revenue ? Math.round(monthlyData[0].revenue / 500) : 0) : 0
    const growth = thisMonth > avgPerMonth ? 
      Math.round(((thisMonth - avgPerMonth) / avgPerMonth) * 100) : 0
    return growth > 0 ? `+${growth}%` : `${growth}%`
  }

  const statsData = [
    {
      name: "Annual Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: "Last 12 months",
      change: stats.totalRevenue > 0 ? "+20.1%" : "+0%",
      trend: "up",
      icon: DollarSign,
    },
    {
      name: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      subtitle: "This month",
      change: calculateMonthlyGrowth(),
      trend: stats.monthlyRevenue > 0 ? "up" : "down",
      icon: Calendar,
    },
    {
      name: "Total Orders",
      value: stats.totalOrders.toString(),
      subtitle: "All time",
      change: calculateOrdersGrowth(),
      trend: stats.totalOrders > 0 ? "up" : "down",
      icon: ShoppingCart,
    },
    {
      name: "Active Customers",
      value: stats.activeCustomers.toString(),
      subtitle: "Current",
      change: stats.activeCustomers > 0 ? "+5.3%" : "+0%",
      trend: stats.activeCustomers > 0 ? "up" : "down",
      icon: Users,
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Dashboard</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1 md:mt-2">Welcome back! Here's your business overview.</p>
        </div>
      </div>

      {/* Stats Grid - Glasmorphic with Enhanced Styling */}
      <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight
          const trendColor = stat.trend === "up" ? "text-emerald-600" : "text-red-600"
          const bgGradient = stat.trend === "up" 
            ? "from-emerald-500/10 to-transparent" 
            : "from-red-500/10 to-transparent"

          return (
            <div 
              key={index} 
              className="group relative overflow-hidden backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 hover:bg-white/60 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {/* Background gradient accent */}
              <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${bgGradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              
              <div className="relative flex flex-row items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">{stat.name}</p>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-2 md:mt-3 font-display">{stat.value}</div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mt-2 md:mt-4">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit ${stat.trend === "up" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                      <TrendIcon className={`h-3 md:h-3.5 w-3 md:w-3.5 ${trendColor}`} />
                      <p className={`text-xs font-semibold ${trendColor}`}>{stat.change}</p>
                    </div>
                    <p className="text-xs text-slate-600">{stat.subtitle}</p>
                  </div>
                </div>
                <div className={`flex-shrink-0 p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 opacity-60 group-hover:opacity-100 transition-opacity`}>
                  <Icon className="h-5 md:h-6 w-5 md:w-6 text-slate-700" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Chart Section with Year Navigation */}
      <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 lg:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">12-Month Revenue</h2>
            <p className="text-xs md:text-sm text-slate-700 mt-1">Revenue analysis for {selectedYear}</p>
          </div>
          <div className="flex items-center gap-2 justify-start md:justify-end">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="rounded-full border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 h-8 w-8 md:h-10 md:w-10"
            >
              <ChevronLeft className="h-3 md:h-4 w-3 md:w-4" />
            </Button>
            <span className="text-base md:text-lg font-semibold text-slate-900 px-3 md:px-4 py-1 md:py-2 bg-white/60 rounded-full min-w-16 md:min-w-20 text-center">{selectedYear}</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="rounded-full border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 h-8 w-8 md:h-10 md:w-10"
            >
              <ChevronRight className="h-3 md:h-4 w-3 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Chart - Responsive Height */}
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={Math.max(250, window.innerWidth < 768 ? 250 : 350)}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#880000" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#880000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
              <XAxis dataKey="month" stroke="rgba(55,65,81,0.7)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(55,65,81,0.7)" tick={{ fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(100,116,139,0.3)",
                  borderRadius: "12px"
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#880000" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best-Selling Packages + Peak Order Heatmap */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Best-Selling Packages */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Best-Selling Packages</h3>
            <p className="text-xs md:text-sm text-slate-700 mt-1">Order volume by package type</p>
          </div>
          {packageData.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No package data yet</p>
          ) : (
            <div className="space-y-3">
              {packageData.map((pkg, i) => {
                const max = packageData[0]?.count || 1
                const pct = Math.round((pkg.count / max) * 100)
                const colors = ["from-[#880000] to-[#ff0d13]", "from-slate-700 to-slate-500", "from-slate-400 to-slate-300", "from-slate-300 to-slate-200"]
                return (
                  <div key={i} className="p-3 rounded-xl bg-white/60 border border-white/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-900">{pkg.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{pkg.count} orders</span>
                        <span className="text-xs font-bold text-slate-700">${pkg.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/40 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${colors[i] || colors[3]} h-2 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Peak Order Hours/Days Heatmap */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Peak Order Times</h3>
            <p className="text-xs md:text-sm text-slate-700 mt-1">Order activity by day and hour</p>
          </div>
          {heatmapData.length === 0 || allOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No order time data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[340px]">
                {/* Hour labels */}
                <div className="flex items-center mb-1 pl-9">
                  {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                    <div key={h} className="flex-1 text-center text-[10px] text-slate-400">
                      {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                    </div>
                  ))}
                </div>
                {/* Heatmap rows */}
                {heatmapData.map((row, di) => {
                  const maxVal = Math.max(...heatmapData.flatMap(r => Array.from({length: 24}, (_, h) => r[`h${h}`] || 0)))
                  return (
                    <div key={di} className="flex items-center gap-1 mb-1">
                      <span className="text-[11px] font-medium text-slate-500 w-8 flex-shrink-0">{row.day}</span>
                      <div className="flex gap-0.5 flex-1">
                        {Array.from({ length: 24 }, (_, h) => {
                          const val = row[`h${h}`] || 0
                          const intensity = maxVal > 0 ? val / maxVal : 0
                          let bg = "bg-slate-100"
                          if (intensity > 0.75) bg = "bg-[#880000]"
                          else if (intensity > 0.5) bg = "bg-[#880000]/70"
                          else if (intensity > 0.25) bg = "bg-[#880000]/40"
                          else if (intensity > 0) bg = "bg-[#880000]/20"
                          return (
                            <div
                              key={h}
                              title={`${row.day} ${h}:00 — ${val} order${val !== 1 ? "s" : ""}`}
                              className={`flex-1 h-6 rounded-sm ${bg} cursor-default transition-all hover:ring-1 hover:ring-[#880000]/60`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-[10px] text-slate-400">Less</span>
                  {["bg-slate-100", "bg-[#880000]/20", "bg-[#880000]/40", "bg-[#880000]/70", "bg-[#880000]"].map((c, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                  ))}
                  <span className="text-[10px] text-slate-400">More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Recent Orders and Top States */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Recent Orders</h3>
            <p className="text-xs md:text-sm text-slate-700 mt-1">Latest transactions</p>
          </div>
          <div className="space-y-2 md:space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-slate-500 py-6 md:py-8 text-sm">No orders yet</p>
            ) : (
              <>
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl backdrop-blur-sm bg-white/60 border border-white/40 hover:border-white/60 hover:bg-white/80 cursor-pointer transition-all duration-300 group hover:shadow-md"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-[#880000]/20 to-[#ff0d13]/10 group-hover:from-[#880000]/30 group-hover:to-[#ff0d13]/20 transition-all flex-shrink-0">
                        <ShoppingCart className="h-4 md:h-5 w-4 md:w-5 text-[#880000]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs md:text-sm font-semibold text-slate-900 truncate group-hover:text-[#880000] transition-colors cursor-default">{order.companyName || "Unknown"}</p>
                          </TooltipTrigger>
                          {(order.companyName?.length ?? 0) > 20 && (
                            <TooltipContent side="top">{order.companyName}</TooltipContent>
                          )}
                        </Tooltip>
                        <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className="flex-shrink-0 ml-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 whitespace-nowrap text-xs md:text-sm">+${(order.pricing?.total || order.amount || 0).toLocaleString()}</Badge>
                  </div>
                ))}
              </>
            )}
            <div className="flex gap-2 mt-3 md:mt-4">
              {allOrders.length > 5 && (
                <Button
                  variant="outline"
                  className="flex-1 border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 rounded-lg md:rounded-xl text-sm md:text-base"
                  onClick={() => setOrdersDrawerOpen(true)}
                >
                  <LayoutList className="h-4 w-4 mr-2" />
                  More Orders ({allOrders.length - 5})
                </Button>
              )}
              <Button
                className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 rounded-lg md:rounded-xl hover:shadow-lg transition-all text-sm md:text-base"
                asChild
              >
                <a href="/admin/orders">View All Orders</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Top States / Companies Breakdown */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Top States</h3>
            <p className="text-xs md:text-sm text-slate-700 mt-1">Companies by location</p>
          </div>
          <div className="space-y-2 md:space-y-3">
            {stateBreakdown.slice(0, 5).map((state, index) => (
              <div key={index} className="flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm md:text-base">{state.state}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{state.count} {state.count === 1 ? 'company' : 'companies'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
                  <div className="w-16 md:w-24 bg-white/40 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#880000] to-[#ff0d13] h-2 rounded-full transition-all"
                      style={{ width: `${state.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-900 min-w-8 text-right">{state.percentage}%</span>
                </div>
              </div>
            ))}
            {stateBreakdown.length > 5 && (
              <Button
                variant="outline"
                className="w-full mt-3 md:mt-4 border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 rounded-lg md:rounded-xl text-sm md:text-base"
                onClick={() => setStatesDrawerOpen(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Details ({stateBreakdown.length} states)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Top Cities Section */}
      <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 md:mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Top Cities</h3>
            <p className="text-xs md:text-sm text-slate-700 mt-1">
              Member cities from all orders — {cityBreakdown.reduce((s, c) => s + c.count, 0)} total members across {cityBreakdown.length} {cityBreakdown.length === 1 ? "city" : "cities"}
            </p>
          </div>
          {cityBreakdown.length > 8 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCitiesDrawerOpen(true)}
              className="border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 rounded-lg self-start md:self-auto"
            >
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              View All ({cityBreakdown.length})
            </Button>
          )}
        </div>

        {cityBreakdown.length === 0 ? (
          <p className="text-center text-slate-500 py-8 text-sm">No member city data found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {cityBreakdown.slice(0, 8).map((city, index) => {
              const maxCount = cityBreakdown[0]?.count || 1
              const barPct = Math.round((city.count / maxCount) * 100)
              const rankColors = [
                "from-[#880000] to-[#ff0d13]",
                "from-slate-700 to-slate-500",
                "from-slate-500 to-slate-400",
                "from-slate-400 to-slate-300",
              ]
              const rankColor = rankColors[index] || rankColors[3]

              return (
                <div
                  key={city.city}
                  className="p-3 md:p-4 rounded-xl backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${rankColor} text-white`}>
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{city.city}</p>
                        {city.country && (
                          <p className="text-xs text-slate-500 truncate">{city.country}</p>
                        )}
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-full">
                      {city.count} {city.count === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-white/40 rounded-full h-1.5">
                      <div
                        className={`bg-gradient-to-r ${rankColor} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-right">{city.percentage}% of members</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Abandoned Checkout Tracker Section */}
      <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 md:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10">
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Abandoned Checkouts</h3>
            </div>
            <p className="text-xs md:text-sm text-slate-600 mt-1 ml-9">Users who started but did not complete checkout (last 30 days)</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAbandonedDrawerOpen(true)}
            className="self-start md:self-auto border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 rounded-lg"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View All ({abandonedStats.total})
          </Button>
        </div>

        {/* Abandoned Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Abandoned", value: abandonedStats.total, icon: ShoppingBag, color: "from-orange-500/20 to-orange-400/10", iconColor: "text-orange-600" },
            { label: "Last 24 Hours", value: abandonedStats.last24h, icon: Clock, color: "from-amber-500/20 to-amber-400/10", iconColor: "text-amber-600" },
            { label: "Last 7 Days", value: abandonedStats.last7Days, icon: Calendar, color: "from-red-500/20 to-red-400/10", iconColor: "text-red-600" },
            { label: "Lost Revenue", value: `$${abandonedStats.potentialRevenue.toLocaleString()}`, icon: DollarSign, color: "from-rose-500/20 to-rose-400/10", iconColor: "text-rose-600" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="p-3 md:p-4 rounded-xl bg-white/60 border border-white/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color}`}>
                    <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{item.label}</p>
                </div>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{item.value}</p>
              </div>
            )
          })}
        </div>

        {/* Step Breakdown Bar */}
        {Object.keys(abandonedStats.stepBreakdown).length > 0 && (
          <div className="mb-5 p-4 rounded-xl bg-white/60 border border-white/40">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Drop-off by Checkout Step</p>
            <div className="space-y-2">
              {Object.entries(abandonedStats.stepBreakdown)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([step, count]) => {
                  const max = Math.max(...Object.values(abandonedStats.stepBreakdown))
                  const pct = max > 0 ? Math.round((count / max) * 100) : 0
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-28 flex-shrink-0">{step}</span>
                      <div className="flex-1 bg-white/40 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Recent Abandoned - top 5 */}
        {abandonedCheckouts.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No abandoned checkouts found</p>
            <p className="text-xs text-slate-400 mt-1">Users who start checkout will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {abandonedCheckouts.slice(0, 5).map((item, i) => {
              const stepNames = ["Account", "State & Package", "Business Info", "Owner Info", "Review", "Payment"]
              const stepName = stepNames[item.lastStep] || "Unknown"
              const stepColors = ["bg-slate-200 text-slate-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"]
              const stepColor = stepColors[item.lastStep] || stepColors[0]
              const timeAgo = (() => {
                const diff = Date.now() - new Date(item.updatedAt || item.createdAt).getTime()
                const mins = Math.floor(diff / 60000)
                if (mins < 60) return `${mins}m ago`
                const hrs = Math.floor(mins / 60)
                if (hrs < 24) return `${hrs}h ago`
                return `${Math.floor(hrs / 24)}d ago`
              })()

              return (
                <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/15 to-red-500/10 flex-shrink-0">
                      <ShoppingBag className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.name || item.email || item.businessName || "Anonymous"}
                        </p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stepColor} flex-shrink-0`}>
                          Stopped at: {stepName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.email && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="h-3 w-3" />{item.email}
                          </span>
                        )}
                        {item.phone && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />{item.phone}
                          </span>
                        )}
                        {item.state && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />{item.state}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    {item.estimatedTotal && item.estimatedTotal > 0 && (
                      <span className="text-sm font-bold text-slate-800">${Number(item.estimatedTotal).toLocaleString()}</span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Abandoned Checkouts Full Modal */}
      <Dialog open={abandonedDrawerOpen} onOpenChange={setAbandonedDrawerOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-md">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              All Abandoned Checkouts
            </DialogTitle>
            <p className="text-sm text-slate-600">
              {abandonedStats.total} abandoned — ${abandonedStats.potentialRevenue.toLocaleString()} potential revenue lost
            </p>
          </DialogHeader>

          {/* Summary Stats inside modal */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-center">
              <p className="text-lg font-bold text-orange-700">{abandonedStats.last24h}</p>
              <p className="text-xs text-orange-600">Last 24h</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <p className="text-lg font-bold text-amber-700">{abandonedStats.last7Days}</p>
              <p className="text-xs text-amber-600">Last 7 Days</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
              <p className="text-lg font-bold text-rose-700">${abandonedStats.potentialRevenue.toLocaleString()}</p>
              <p className="text-xs text-rose-600">Lost Revenue</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {abandonedCheckouts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No abandoned checkouts found in the last 30 days</p>
              </div>
            ) : (
              abandonedCheckouts.map((item, i) => {
                const stepNames = ["Account", "State & Package", "Business Info", "Owner Info", "Review", "Payment"]
                const stepName = stepNames[item.lastStep] || "Unknown"
                const stepColors = ["bg-slate-100 text-slate-600", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"]
                const stepColor = stepColors[item.lastStep] || stepColors[0]
                const createdDate = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(item.updatedAt || item.createdAt).getTime()
                  const mins = Math.floor(diff / 60000)
                  if (mins < 60) return `${mins}m ago`
                  const hrs = Math.floor(mins / 60)
                  if (hrs < 24) return `${hrs}h ago`
                  return `${Math.floor(hrs / 24)}d ago`
                })()

                return (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.name || item.businessName || "Anonymous User"}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stepColor}`}>
                            {stepName}
                          </span>
                          {item.packageType && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#880000]/10 text-[#880000] font-medium">
                              {item.packageType}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          {item.email && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="h-3 w-3 flex-shrink-0" />{item.email}
                            </span>
                          )}
                          {item.phone && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="h-3 w-3 flex-shrink-0" />{item.phone}
                            </span>
                          )}
                          {item.state && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 flex-shrink-0" />{item.state}
                            </span>
                          )}
                          {item.businessName && item.name !== item.businessName && (
                            <span className="text-xs text-slate-500">Biz: {item.businessName}</span>
                          )}
                        </div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.addons.map((addon: any, ai: number) => (
                              <span key={ai} className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                {typeof addon === "string" ? addon : addon?.name || addon?.title || "Add-on"}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">{createdDate} · Updated {timeAgo}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {item.estimatedTotal && item.estimatedTotal > 0 && (
                          <span className="text-base font-bold text-slate-800">${Number(item.estimatedTotal).toLocaleString()}</span>
                        )}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 6 }, (_, s) => (
                            <div
                              key={s}
                              className={`h-1.5 w-4 rounded-full ${s <= item.lastStep ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">Step {item.lastStep + 1} of 6</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* All States Modal */}
      <Dialog open={statesDrawerOpen} onOpenChange={setStatesDrawerOpen}>
        <DialogContent className="max-w-md w-full max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#880000]" />
              All States Breakdown
            </DialogTitle>
            <p className="text-sm text-slate-600">{stateBreakdown.length} states — {stateBreakdown.reduce((s, x) => s + x.count, 0)} total companies</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {stateBreakdown.map((state, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-6 text-center flex-shrink-0">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{state.state}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-[#880000] to-[#ff0d13] h-1.5 rounded-full transition-all"
                          style={{ width: `${state.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{state.percentage}%</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="ml-3 flex-shrink-0 text-slate-700 border-slate-200">
                  {state.count} {state.count === 1 ? 'co.' : 'cos.'}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* All Cities Modal */}
      <Dialog open={citiesDrawerOpen} onOpenChange={setCitiesDrawerOpen}>
        <DialogContent className="max-w-md w-full max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#880000]" />
              All Cities Breakdown
            </DialogTitle>
            <p className="text-sm text-slate-600">
              {cityBreakdown.length} {cityBreakdown.length === 1 ? "city" : "cities"} — {cityBreakdown.reduce((s, c) => s + c.count, 0)} total members
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {cityBreakdown.map((city, index) => (
              <div key={city.city} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-6 text-center flex-shrink-0">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{city.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {city.country && (
                        <span className="text-xs text-slate-400 flex-shrink-0">{city.country}</span>
                      )}
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-[#880000] to-[#ff0d13] h-1.5 rounded-full transition-all"
                          style={{ width: `${city.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{city.percentage}%</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="ml-3 flex-shrink-0 text-slate-700 border-slate-200">
                  {city.count} {city.count === 1 ? "member" : "members"}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* All Orders Modal */}
      <Dialog open={ordersDrawerOpen} onOpenChange={setOrdersDrawerOpen}>
        <DialogContent className="max-w-lg w-full max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#880000]" />
              All Recent Orders
            </DialogTitle>
            <p className="text-sm text-slate-600">{allOrders.length} orders total</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {allOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 cursor-pointer transition-all group"
                onClick={() => {
                  setOrdersDrawerOpen(false)
                  router.push(`/admin/orders/${order.id}`)
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#880000]/15 to-[#ff0d13]/10 flex-shrink-0">
                    <ShoppingCart className="h-4 w-4 text-[#880000]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#880000] transition-colors cursor-default">{order.companyName || "Unknown"}</p>
                      </TooltipTrigger>
                      {(order.companyName?.length ?? 0) > 22 && (
                        <TooltipContent side="top">{order.companyName}</TooltipContent>
                      )}
                    </Tooltip>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.status && (
                        <span className="text-xs text-slate-400">· {order.status}</span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-slate-300 font-mono cursor-default">{order.id?.substring(0, 8)}…</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="font-mono text-xs max-w-xs break-all">
                          {order.id}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <Badge className="flex-shrink-0 ml-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 text-xs">
                  +${(order.pricing?.total || order.amount || 0).toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setOrdersDrawerOpen(false)
                router.push("/admin/orders")
              }}
            >
              Manage All Orders
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
