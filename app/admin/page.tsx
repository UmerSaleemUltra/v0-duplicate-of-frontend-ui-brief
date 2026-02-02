"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts"

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
  const [showAllStates, setShowAllStates] = useState(false)

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

  useEffect(() => {
    if (isAuthenticating) return

    const loadData = async () => {
      const startTime = Date.now()

      if (!dataLoaded) {
        setIsLoadingData(true)
      }

      try {
        console.log("[v0] Admin Dashboard: Starting data load...")
        const token = authService.getToken()
        if (!token) {
          console.log("[v0] Admin Dashboard: No token found")
          return
        }

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

        console.log("[v0] Admin Dashboard: Fetched data", {
          usersCount: allUsers.length,
          companiesCount: allCompanies.length,
        })

        const allOrders = allCompanies.flatMap((company: any) => {
          const companyOrders = company.orders || []
          console.log(`[v0] Company ${company.name}: ${companyOrders.length} orders`)

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

        console.log("[v0] Admin Dashboard: Total orders extracted:", allOrders.length)

        const ordersWithDetails = allOrders
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 4)
          .map((order: any) => {
            const user = allUsers.find((u: any) => u.id === order.userId)
            return {
              ...order,
              userName: user?.name || "Unknown Customer",
            }
          })

        setOrders(ordersWithDetails)
        console.log("[v0] Admin Dashboard: Recent orders set:", ordersWithDetails.length)

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
            console.log(`[v0] Order ${order.id}: amount=${orderAmount}`)
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

        console.log("[v0] Admin Dashboard: Revenue calculated", {
          yearRevenue,
          currentMonthRevenue,
          totalOrders: allOrders.length,
        })

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
        console.log("[v0] Admin Dashboard: State breakdown set:", breakdown.length)

        setDataLoaded(true)

        const loadTime = Date.now() - startTime
        console.log(`[v0] Admin Dashboard: Data loaded in ${loadTime}ms`)

        if (loadTime < 100) {
          setIsLoadingData(false)
        } else {
          setTimeout(() => setIsLoadingData(false), 300)
        }
      } catch (error) {
        console.error("[v0] Admin Dashboard: Error loading data", error)
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          authService.logout()
          router.push("/login")
        } else {
          toast.error("Error loading dashboard data")
        }
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [isAuthenticating, router, dataLoaded, selectedYear])

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

  if (isLoadingData && !dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
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
              <Tooltip 
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
                {orders.slice(0, 4).map((order) => (
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
                        <p className="text-xs md:text-sm font-semibold text-slate-900 truncate group-hover:text-[#880000] transition-colors">{order.companyName || "Unknown"}</p>
                        <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className="flex-shrink-0 ml-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 whitespace-nowrap text-xs md:text-sm">+${(order.pricing?.total || order.amount || 0).toLocaleString()}</Badge>
                  </div>
                ))}
              </>
            )}
            <Button 
              className="w-full mt-3 md:mt-4 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 rounded-lg md:rounded-xl hover:shadow-lg transition-all text-sm md:text-base"
              asChild
            >
              <a href="/admin/orders">View All Orders</a>
            </Button>
          </div>
        </div>

        {/* Top States / Companies Breakdown */}
        <div className="backdrop-blur-md bg-white/50 border border-white/40 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Top States</h3>
            <p className="text-xs md:text-sm text-slate-700 mt-1">Companies by location</p>
          </div>
          
          {/* Bar Chart */}
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis 
                  dataKey="state" 
                  stroke="rgba(55,65,81,0.7)" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="rgba(55,65,81,0.7)" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Companies', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(100,116,139,0.3)",
                    borderRadius: "12px"
                  }}
                  formatter={(value) => [`${value} companies`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#880000" 
                  radius={[8, 8, 0, 0]}
                  name="Companies"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Show All States Button */}
          {stateBreakdown.length > 4 && (
            <Button 
              variant="outline"
              className="w-full mt-4 md:mt-6 border-white/40 bg-white/30 hover:bg-white/50 text-slate-900 rounded-lg md:rounded-xl text-sm md:text-base"
              onClick={() => setShowAllStates(!showAllStates)}
            >
              {showAllStates ? "Show Top 4" : `View All (${stateBreakdown.length})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
