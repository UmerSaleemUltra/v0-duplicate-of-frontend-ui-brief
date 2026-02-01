"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
      // 24 months of data (2 years) - optimized for performance
      const data: RevenueData[] = []
      const baseDate = new Date()
      baseDate.setFullYear(baseDate.getFullYear() - 2)
      baseDate.setDate(1)
      baseDate.setHours(0, 0, 0, 0)

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

      for (let i = 0; i < 24; i++) {
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
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }, [])

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
    <Card className="bg-white border-slate-200 w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
            <p className="text-sm text-slate-600 mt-1">{description}</p>
          </div>

          {/* View Type Selector */}
          <div className="flex gap-2">
            <Button
              variant={viewType === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("month")}
              className="text-xs sm:text-sm"
            >
              24 Months
            </Button>
            <Button
              variant={viewType === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("day")}
              className="text-xs sm:text-sm"
            >
              Daily
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        {viewType === "day" && (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium text-slate-700 text-center flex-1">{monthDisplay}</span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No data available for this period</p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Chart Container with optimized rendering */}
            <div className="w-full overflow-x-auto -mx-6 px-6">
              <ResponsiveContainer width="100%" height={300} minWidth={500}>
                {viewType === "month" ? (
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      interval={Math.floor(chartData.length / 6)}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#f1f5f9" }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                      cursor={{ stroke: "#ff0d13", strokeOpacity: 0.3 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ff0d13"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                      name="Revenue"
                    />
                  </LineChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      interval={Math.floor(chartData.length / 12)}
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#f1f5f9" }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                      cursor={{ fill: "#ff0d13", fillOpacity: 0.1 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      dataKey="revenue"
                      fill="#ff0d13"
                      isAnimationActive={false}
                      name="Revenue"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Summary Stats - optimized with memoized totals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
                <p className="text-lg font-semibold text-slate-900">
                  ${totals.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Total Orders</p>
                <p className="text-lg font-semibold text-slate-900">
                  {totals.totalOrders}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Avg Revenue</p>
                <p className="text-lg font-semibold text-slate-900">
                  ${totals.avgRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
