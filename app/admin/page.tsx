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
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Top Section: Chart and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart - Left (spans 2 columns) */}
        <div className="lg:col-span-2">
          <RevenueChartCarousel 
            orders={orders.length > 0 ? orders : []} 
            title="Revenue Over the Last 7 Months" 
            description="Your monthly revenue trend"
          />
        </div>

        {/* Stats Cards Grid - Right (2x2) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Companies */}
          <Card className="bg-gray-100 border-0 rounded-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stateBreakdown.reduce((acc, item) => acc + item.count, 0)}</p>
                <p className="text-gray-600 text-xs mt-3 font-medium">Company</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="bg-gray-100 border-0 rounded-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stats.activeCustomers}</p>
                <p className="text-gray-600 text-xs mt-3 font-medium">Users</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Documents */}
          <Card className="bg-gray-100 border-0 rounded-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-gray-600 text-xs mt-3 font-medium">Documents</p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="bg-gray-100 border-0 rounded-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">0</p>
                <p className="text-gray-600 text-xs mt-3 font-medium">Feedback</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: This Month & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Month So Far */}
        <Card className="bg-gray-100 border-0 rounded-lg">
          <CardHeader className="pb-6 border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">This Month So Far</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Sales</p>
                <p className="text-xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Companies</p>
                <p className="text-xl font-bold text-gray-900">{stateBreakdown.reduce((acc, item) => acc + item.count, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Users</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeCustomers}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Documents</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>

            {/* Last Month Summary */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-6">Last Month Summary</p>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Sales</p>
                  <p className="text-xl font-bold text-gray-900">$14,211</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Companies</p>
                  <p className="text-xl font-bold text-gray-900">46</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Users</p>
                  <p className="text-xl font-bold text-gray-900">65</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Documents</p>
                  <p className="text-xl font-bold text-gray-900">142</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-gray-100 border-0 rounded-lg">
          <CardHeader className="pb-6 border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-center text-gray-600 py-12 text-sm">No orders yet</p>
              ) : (
                <>
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <ShoppingCart className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm text-gray-900 truncate flex-1 font-medium">{order.companyName || "Unknown"}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full mt-6 font-semibold py-2.5"
              asChild
            >
              <a href="/admin/orders">View All</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
