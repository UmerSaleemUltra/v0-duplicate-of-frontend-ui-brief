"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, BarChart3, LineChart as LineChartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartCarouselProps {
  orders: any[]
  title?: string
  description?: string
}

export function RevenueChartCarousel({ orders, title = "Revenue Trend", description = "2-Year Revenue Analysis" }: RevenueChartCarouselProps) {
  const [viewType, setViewType] = useState<"month" | "day">("month")
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line")
  const SYSTEM_LAUNCH_YEAR = 2026
  const SYSTEM_LAUNCH_MONTH = 0 // January (0-indexed)

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return now
  })

  // Cache parsed orders to avoid repeated date parsing
  const parsedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      _date: new Date(order.createdAt),
      _amount: order.pricing?.total || order.amount || order.total || 0,
    }))
  }, [orders])

  // Generate chart data based on view type with optimized performance
  const chartData = useMemo(() => {
    if (viewType === "month") {
      // Show only 12 months from system launch onwards (or up to current month if in 2026)
      const data: RevenueData[] = []
      const baseDate = new Date(SYSTEM_LAUNCH_YEAR, SYSTEM_LAUNCH_MONTH, 1)
      baseDate.setHours(0, 0, 0, 0)

      // Calculate how many months to display (max 12 from launch, or until now)
      const now = new Date()
      const monthsToDisplay = Math.min(12, Math.floor((now.getFullYear() - SYSTEM_LAUNCH_YEAR) * 12 + (now.getMonth() - SYSTEM_LAUNCH_MONTH) + 1))

      // Create month lookup map for O(1) access instead of O(n) filtering
      const monthMap = new Map<string, { revenue: number; orders: number }>()

      for (const order of parsedOrders) {
        const orderYear = order._date.getFullYear()
        const orderMonth = order._date.getMonth()
        const key = `${orderYear}-${orderMonth}`

        const existing = monthMap.get(key) || { revenue: 0, orders: 0 }
        existing.revenue += order._amount
        existing.orders += 1
        monthMap.set(key, existing)
      }

      for (let i = 0; i < monthsToDisplay; i++) {
        const monthDate = new Date(baseDate)
        monthDate.setMonth(monthDate.getMonth() + i)

        const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
        const monthData = monthMap.get(key) || { revenue: 0, orders: 0 }

        data.push({
          date: monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          revenue: monthData.revenue,
          orders: monthData.orders,
        })
      }
      return data
    } else {
      // Days in current month - optimized
      const data: RevenueData[] = []
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      // Create day lookup map
      const dayMap = new Map<number, { revenue: number; orders: number }>()

      for (const order of parsedOrders) {
        if (order._date.getFullYear() === year && order._date.getMonth() === month) {
          const day = order._date.getDate()
          const existing = dayMap.get(day) || { revenue: 0, orders: 0 }
          existing.revenue += order._amount
          existing.orders += 1
          dayMap.set(day, existing)
        }
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayData = dayMap.get(day) || { revenue: 0, orders: 0 }
        data.push({
          date: `${day}`,
          revenue: dayData.revenue,
          orders: dayData.orders,
        })
      }
      return data
    }
  }, [viewType, currentMonth, parsedOrders])

  // Memoize navigation function to prevent unnecessary re-renders
  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
        // Prevent navigation before system launch date
        if (newDate.getFullYear() < SYSTEM_LAUNCH_YEAR || 
            (newDate.getFullYear() === SYSTEM_LAUNCH_YEAR && newDate.getMonth() < SYSTEM_LAUNCH_MONTH)) {
          return prev
        }
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
        // Prevent navigation beyond current month/year
        const now = new Date()
        if (newDate > now) {
          return prev
        }
      }
      return newDate
    })
  }, [])

  // Check if navigation buttons should be disabled
  const canNavigatePrev = useMemo(() => {
    const testDate = new Date(currentMonth)
    testDate.setMonth(testDate.getMonth() - 1)
    return !(testDate.getFullYear() < SYSTEM_LAUNCH_YEAR || 
             (testDate.getFullYear() === SYSTEM_LAUNCH_YEAR && testDate.getMonth() < SYSTEM_LAUNCH_MONTH))
  }, [currentMonth])

  const canNavigateNext = useMemo(() => {
    const testDate = new Date(currentMonth)
    testDate.setMonth(testDate.getMonth() + 1)
    const now = new Date()
    return testDate <= now
  }, [currentMonth])

  const monthDisplay = useMemo(
    () => currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [currentMonth]
  )

  // Memoize totals to prevent recalculation on every render
  const totals = useMemo(() => {
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
    const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0)
    const avgRevenue = Math.round(totalRevenue / (chartData.length || 1))
    return { totalRevenue, totalOrders, avgRevenue }
  }, [chartData])

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
            </div>
            <p className="text-sm text-slate-300">{description}</p>
          </div>

          {/* Control Panel */}
          <div className="flex flex-col gap-3">
            {/* Period Toggle */}
            <div className="flex gap-2 bg-slate-700 p-1 rounded-lg">
              <Button
                onClick={() => setViewType("month")}
                variant="ghost"
                size="sm"
                className={`text-xs font-semibold transition-all px-3 py-1 rounded ${
                  viewType === "month"
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                24 Mo
              </Button>
              <Button
                onClick={() => setViewType("day")}
                variant="ghost"
                size="sm"
                className={`text-xs font-semibold transition-all px-3 py-1 rounded ${
                  viewType === "day"
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Daily
              </Button>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex gap-2">
              <Button
                onClick={() => setChartType("line")}
                variant="ghost"
                size="sm"
                className={`text-xs font-semibold transition-all px-2 py-1 rounded ${
                  chartType === "line"
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:text-white"
                }`}
                title="Line Chart"
              >
                <LineChartIcon className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setChartType("area")}
                variant="ghost"
                size="sm"
                className={`text-xs font-semibold transition-all px-2 py-1 rounded ${
                  chartType === "area"
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:text-white"
                }`}
                title="Area Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setChartType("bar")}
                variant="ghost"
                size="sm"
                className={`text-xs font-semibold transition-all px-2 py-1 rounded ${
                  chartType === "bar"
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:text-white"
                }`}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4 rotate-90" />
              </Button>
            </div>
          </div>
        </div>

        {/* Date Navigation - Only show in daily view */}
        {viewType === "day" && (
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-700">
            <Button
              onClick={() => navigateMonth("prev")}
              disabled={!canNavigatePrev}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 transition-all ${
                canNavigatePrev
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-semibold text-white min-w-fit">{monthDisplay}</h3>
            <Button
              onClick={() => navigateMonth("next")}
              disabled={!canNavigateNext}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 transition-all ${
                canNavigateNext
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {chartData.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No data available for this period</p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Chart Container with enhanced styling */}
            <div className="w-full bg-white p-4 rounded-lg border border-slate-100 overflow-x-auto">
              <ResponsiveContainer width="100%" height={380} minWidth={500}>
                {chartType === "line" ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff0d13" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff0d13" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" interval={Math.floor(chartData.length / 6)} />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "2px solid #ff0d13",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                      }}
                      labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                      cursor={{ stroke: "#ff0d13", strokeOpacity: 0.5 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ff0d13"
                      dot={false}
                      strokeWidth={2.5}
                      isAnimationActive={false}
                      name="Revenue"
                    />
                  </LineChart>
                ) : chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff0d13" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff0d13" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" interval={Math.floor(chartData.length / 6)} />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "2px solid #ff0d13",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                      }}
                      labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ff0d13"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      isAnimationActive={false}
                      name="Revenue"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" interval={Math.floor(chartData.length / 12)} />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "2px solid #ff0d13",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                      }}
                      labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                      cursor={{ fill: "#ff0d13", fillOpacity: 0.1 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      dataKey="revenue"
                      fill="#ff0d13"
                      isAnimationActive={false}
                      name="Revenue"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Detailed Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-red-50 via-red-50 to-orange-50 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Total Revenue</p>
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  ${totals.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total Orders</p>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {totals.totalOrders}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 via-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Avg Revenue</p>
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <LineChartIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  ${totals.avgRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Daily Average</p>
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-900">
                  {(totals.totalOrders / (chartData.length || 1)).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
