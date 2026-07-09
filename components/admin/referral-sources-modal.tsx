"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Search, TrendingUp } from "lucide-react"

interface ReferralSourcesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: any[]
}

const REFERRAL_COLORS = {
  "Google Search": "#3b82f6",
  "Social Media": "#ec4899",
  "Word of Mouth": "#10b981",
  "Direct Link": "#f59e0b",
  "Email": "#8b5cf6",
  "Advertisement": "#ef4444",
  "Other": "#6b7280",
}

export function ReferralSourcesModal({ open, onOpenChange, orders }: ReferralSourcesModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Calculate referral source statistics
  const referralStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number; percentage: number }> = {}
    let totalOrders = 0

    orders.forEach((order) => {
      const source = (order.referralSource || "Direct") as string
      if (!stats[source]) {
        stats[source] = { count: 0, revenue: 0, percentage: 0 }
      }
      stats[source].count += 1
      stats[source].revenue += order.pricing?.total || order.amount || order.total || 0
      totalOrders += 1
    })

    // Calculate percentages
    Object.keys(stats).forEach((source) => {
      stats[source].percentage = Math.round((stats[source].count / totalOrders) * 100)
    })

    return Object.entries(stats)
      .map(([source, data]) => ({
        name: source,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
  }, [orders])

  const chartData = referralStats.map((stat) => ({
    name: stat.name,
    value: stat.count,
    fill: REFERRAL_COLORS[stat.name as keyof typeof REFERRAL_COLORS] || "#6b7280",
  }))

  const barChartData = referralStats.map((stat) => ({
    source: stat.name.length > 12 ? stat.name.substring(0, 12) + "..." : stat.name,
    fullName: stat.name,
    count: stat.count,
    revenue: stat.revenue,
  }))

  const filteredStats = referralStats.filter((stat) =>
    stat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalRevenue = referralStats.reduce((sum, stat) => sum + stat.revenue, 0)
  const topSource = referralStats[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Referral Sources Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-slate-600 mb-1">Total Orders</div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{orders.length}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <TrendingUp className="w-3 h-3" />
                  From all sources
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-slate-600 mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-slate-900 mb-2">${(totalRevenue / 1000).toFixed(1)}K</div>
                <div className="text-xs text-slate-500">From referrals</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-slate-600 mb-1">Top Source</div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{topSource?.percentage}%</div>
                <div className="text-xs text-slate-500 truncate">{topSource?.name}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribution</h3>
                <div className="w-full h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} orders`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Orders by Source</h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="source" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `${value} orders`}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search referral source..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 border-slate-200"
                  />
                </div>

                <div className="space-y-3">
                  {filteredStats.map((stat, index) => {
                    const barWidth = (stat.count / referralStats[0].count) * 100
                    return (
                      <div key={`${stat.name}-${index}`} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  REFERRAL_COLORS[stat.name as keyof typeof REFERRAL_COLORS] ||
                                  "#6b7280",
                              }}
                            />
                            <span className="font-medium text-slate-900">{stat.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline">{stat.percentage}%</Badge>
                            <span className="text-slate-600 font-medium w-16 text-right">
                              {stat.count} orders
                            </span>
                            <span className="text-slate-500 w-24 text-right">
                              ${(stat.revenue / 1000).toFixed(1)}K
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor:
                                REFERRAL_COLORS[stat.name as keyof typeof REFERRAL_COLORS] ||
                                "#6b7280",
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
