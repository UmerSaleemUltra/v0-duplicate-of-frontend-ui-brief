"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Search, Filter, Download, Eye, Building2, DollarSign, ShoppingCart, MapPin } from "lucide-react"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

function CompaniesContent() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const { toast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("all")
  const [packageFilter, setPackageFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        console.log("[v0] Admin Companies: Loading companies...")
        const token = authService.getToken()
        if (!token) return

        const timestamp = Date.now()
        const response = await fetch(`https://www.buzzfiling.com/api/companies?_t=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        const data = await response.json()
        const allCompanies = data.data || data || []

        console.log("[v0] Admin Companies: Loaded companies:", allCompanies.length)

        const companiesWithMetrics = allCompanies.map((company: any) => {
          const orders = company.orders || []
          const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || order.amount || 0), 0)
          const orderCount = orders.length
          const latestOrder =
            orders.length > 0 ? new Date(Math.max(...orders.map((o: any) => new Date(o.createdAt).getTime()))) : null

          return {
            ...company,
            totalRevenue,
            orderCount,
            latestOrderDate: latestOrder,
          }
        })

        setCompanies(companiesWithMetrics)
        setFilteredCompanies(companiesWithMetrics)

        console.log("[v0] Admin Companies: Companies with metrics calculated")
      } catch (error) {
        console.error("[v0] Admin Companies: Error loading companies:", error)
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (!isLoading && isAuthenticated) {
      loadCompanies()
    }
  }, [isLoading, isAuthenticated, toast])

  useEffect(() => {
    let filtered = companies

    if (searchQuery) {
      filtered = filtered.filter(
        (company) =>
          company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.ein?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.businessId?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((company) => company.state?.toLowerCase() === stateFilter.toLowerCase())
    }

    if (packageFilter !== "all") {
      filtered = filtered.filter((company) => company.packageType?.toLowerCase() === packageFilter.toLowerCase())
    }

    setFilteredCompanies(filtered)
  }, [searchQuery, stateFilter, packageFilter, companies])

  const handleExportCompanies = () => {
    const csvContent = [
      ["Company Name", "EIN", "Business ID", "State", "Package", "Revenue", "Orders", "Status", "Created Date"].join(
        ",",
      ),
      ...filteredCompanies.map((company) =>
        [
          company.name,
          company.ein || "N/A",
          company.businessId || "N/A",
          company.state,
          company.packageType || "N/A",
          company.totalRevenue || 0,
          company.orderCount || 0,
          company.status || "active",
          new Date(company.createdAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `companies-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Companies</h1>
          <p className="text-slate-600 mt-1">Manage all company formations and orders</p>
        </div>
        <Button
          className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 transition-opacity duration-200"
          onClick={handleExportCompanies}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Companies
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{companies.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              ${companies.reduce((sum, c) => sum + (c.totalRevenue || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {companies.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              $
              {companies.length > 0
                ? Math.round(companies.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) / companies.length)
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search companies, EIN, Business ID..."
                className="pl-10 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="delaware">Delaware</SelectItem>
                <SelectItem value="wyoming">Wyoming</SelectItem>
                <SelectItem value="nevada">Nevada</SelectItem>
                <SelectItem value="florida">Florida</SelectItem>
              </SelectContent>
            </Select>
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            All Companies ({filteredCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No companies found</p>
              <p className="text-sm text-slate-500 mt-2">Companies will appear here once formations are completed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Company Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">EIN</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">State</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Package</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Orders</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{company.name}</p>
                          <p className="text-xs text-slate-500">{company.businessId || "Pending"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700 font-mono">{company.ein || "Pending"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">{company.state}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {company.packageType || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-slate-900">
                          ${company.totalRevenue?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">{company.orderCount || 0}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="default" className="text-xs capitalize">
                          {company.status || "active"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/companies/${company.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminCompaniesPage() {
  return (
    <Suspense fallback={null}>
      <CompaniesContent />
    </Suspense>
  )
}
