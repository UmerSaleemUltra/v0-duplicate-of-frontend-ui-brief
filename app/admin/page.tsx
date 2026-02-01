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
} from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"

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
          fetch(`https://www.buzzfiling.com/api/companies?_t=${timestamp}`, {
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
          .slice(0, 5)

        setStateBreakdown(breakdown)
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
  }, [isAuthenticating, router, dataLoaded])

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card
            key={stat.name}
            className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg hover:border-primary/20"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">{stat.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-sm">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-semibold text-slate-900">{stat.value}</div>
              <div className="flex items-center text-xs mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-primary mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-slate-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-primary font-medium" : "text-slate-500"}>
                  {stat.change}
                </span>
                <span className="text-slate-500 ml-1 hidden sm:inline">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <RevenueChartCarousel 
        orders={orders.length > 0 ? orders : []} 
        title="Revenue Trend" 
        description="View your revenue trends over the last 2 years with detailed daily or monthly breakdowns"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 bg-white border-slate-200 transition-all duration-200 hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" className="h-10 transition-colors duration-200" asChild>
                <a href="/admin/orders">View all</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">{order.id}</p>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "processing"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {order.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {order.status === "processing" && <Clock className="h-3 w-3 mr-1" />}
                          {order.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{order.userName || "Unknown"}</p>
                      <p className="text-xs text-slate-500">
                        {order.companyName || "Unknown"} • {order.state || "N/A"} • {order.packageType || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        ${(order.pricing?.total || order.amount || order.total || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* State Breakdown */}
        <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Top States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stateBreakdown.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data yet</p>
              ) : (
                stateBreakdown.map((item) => (
                  <div key={item.state}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{item.state}</span>
                      <span className="text-sm text-slate-600">{item.count} companies</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#880000] to-[#ff0d13] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
