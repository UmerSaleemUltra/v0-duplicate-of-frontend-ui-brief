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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

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

  const statsData = [
    {
      name: "Annual Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: "Last 12 months",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
    },
    {
      name: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      subtitle: "This month",
      change: "+12.5%",
      trend: "up",
      icon: Calendar,
    },
    {
      name: "Total Orders",
      value: stats.totalOrders.toString(),
      subtitle: "All time",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      name: "Active Customers",
      value: stats.activeCustomers.toString(),
      subtitle: "Current",
      change: "+5.3%",
      trend: "up",
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back! Here's your business overview.</p>
        </div>
      </div>

      {/* Stats Grid - Glassmorphic */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight
          const trendColor = stat.trend === "up" ? "text-green-600" : "text-red-600"

          return (
            <div key={index} className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-6 hover:bg-white/40 transition-all duration-300 shadow-xl">
              <div className="flex flex-row items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{stat.name}</p>
                  <div className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                    <p className={`text-xs font-semibold ${trendColor}`}>{stat.change}</p>
                    <p className="text-xs text-slate-500">{stat.subtitle}</p>
                  </div>
                </div>
                <Icon className="h-8 w-8 text-slate-300 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Chart Section with Year Navigation */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">12-Month Revenue</h2>
            <p className="text-slate-600 text-sm mt-1">Revenue analysis for {selectedYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="rounded-full border-white/20 bg-white/20 hover:bg-white/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-slate-900 px-4 py-2 bg-white/50 rounded-full min-w-20 text-center">{selectedYear}</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="rounded-full border-white/20 bg-white/20 hover:bg-white/40"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#880000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#880000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(100,116,139,0.6)" />
            <YAxis stroke="rgba(100,116,139,0.6)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(100,116,139,0.2)",
                borderRadius: "12px"
              }}
              formatter={(value) => `$${value.toLocaleString()}`}
            />
            <Area type="monotone" dataKey="revenue" stroke="#880000" fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Section - Recent Orders and Top States */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Orders</h3>
            <p className="text-slate-600 text-sm mt-1">Latest transactions</p>
          </div>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No orders yet</p>
            ) : (
              <>
                {orders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20 hover:bg-white/60 cursor-pointer transition-all duration-300 group"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#880000] to-[#ff0d13] bg-opacity-20">
                        <ShoppingCart className="h-4 w-4 text-[#880000]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-[#880000] transition-colors">{order.companyName || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0">+${order.pricing?.total || order.amount || 0}</Badge>
                  </div>
                ))}
              </>
            )}
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white border-0 rounded-xl hover:shadow-lg transition-all"
              asChild
            >
              <a href="/admin/orders">View All Orders</a>
            </Button>
          </div>
        </div>

        {/* Top States / Companies Breakdown */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Top States</h3>
            <p className="text-slate-600 text-sm mt-1">Companies by location</p>
          </div>
          <div className="space-y-3">
            {(showAllStates ? stateBreakdown : stateBreakdown.slice(0, 4)).map((state, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20 hover:bg-white/60 transition-all duration-300">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{state.state}</p>
                  <p className="text-xs text-slate-500 mt-1">{state.count} companies</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#880000] to-[#ff0d13] h-2 rounded-full transition-all"
                      style={{width: `${state.percentage}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 min-w-10 text-right">{state.percentage}%</span>
                </div>
              </div>
            ))}
            {stateBreakdown.length > 4 && (
              <Button 
                variant="outline"
                className="w-full mt-4 border-white/20 bg-white/20 hover:bg-white/40 text-slate-900 rounded-xl"
                onClick={() => setShowAllStates(!showAllStates)}
              >
                {showAllStates ? "Show Less" : `View All (${stateBreakdown.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
