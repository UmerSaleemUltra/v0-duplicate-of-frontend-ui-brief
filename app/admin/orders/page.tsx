"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Building2,
  DollarSign,
  ShoppingCart,
  Search,
  Filter,
  X,
  Calendar,
  ChevronDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { CompanyModal } from "@/components/company-modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Added Popover for date picker

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const { toast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("current-month")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  })
  const [dateRangeLabel, setDateRangeLabel] = useState("This Month")
  const router = useRouter()
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [paginatedOrders, setPaginatedOrders] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-24"></div>
                  <div className="h-8 bg-slate-200 rounded w-20"></div>
                </div>
                <div className="h-10 w-10 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-100 rounded w-32"></div>
          <div className="h-10 bg-slate-100 rounded w-32"></div>
          <div className="h-10 bg-slate-100 rounded w-40"></div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-b p-4">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border-b p-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = authService.getToken()
        if (!token) return

        const timestamp = Date.now()
        const [usersResponse, companiesResponse, ordersResponse] = await Promise.all([
          fetch(`/api/users?_t=${timestamp}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }),
          fetch(`/api/companies?_t=${timestamp}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }),
          fetch(`/api/orders?_t=${timestamp}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }),
        ])

        if (!usersResponse.ok || !companiesResponse.ok || !ordersResponse.ok) {
          throw new Error("Failed to fetch data")
        }

        const usersData = await usersResponse.json()
        const companiesData = await companiesResponse.json()
        const ordersData = await ordersResponse.json()

        console.log("[v0] Orders API Response:", ordersData)
        
        const allUsers = usersData.data || usersData || []
        const allCompanies = companiesData.data || companiesData || []
        const apiOrders = ordersData.data || ordersData || []
        
        console.log("[v0] Loaded orders count:", apiOrders.length)

        // Use orders from API or fallback to extracting from companies
        let allOrders = apiOrders.length > 0 
          ? apiOrders 
          : allCompanies.flatMap((company: any) => {
              const companyOrders = company.orders || []
              return companyOrders.map((order: any) => ({
                ...order,
                companyId: company.id || company._id,
                companyName: company.name,
                state: company.state,
                packageType: order.packageType || company.packageType || "N/A",
              }))
            })
        
        console.log("[v0] All orders after merge:", allOrders.length)

        // Normalize order IDs and ensure required fields exist
        allOrders = allOrders.map((order: any) => ({
          ...order,
          id: order.id || order._id,
          companyId: order.companyId || order.companyId,
        }))

        const ordersWithDetails = allOrders.map((order: any) => {
          const company = allCompanies.find((c: any) => {
            const companyId = c.id || c._id?.toString?.()
            return String(companyId) === String(order.companyId)
          })
          const user = allUsers.find((u: any) => String(u.id || u._id) === String(company?.userId))

          return {
            ...order,
            companyName: order.companyName || company?.name || "N/A",
            state: order.state || company?.state || "N/A",
            customerName: user?.name || company?.members?.[0]?.name || "Unknown",
            customerEmail: user?.email || "N/A",
            userId: company?.userId,
          }
        })

        const sortedOrders = ordersWithDetails.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        setCompanies(allCompanies)
        setOrders(sortedOrders)
        setFilteredOrders(sortedOrders)

        const totalRev = sortedOrders.reduce(
          (acc, order) => acc + (order.pricing?.total || order.amount || order.total || 0),
          0,
        )
        setTotalRevenue(totalRev)
        setTotalOrders(sortedOrders.length)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (!isLoading && isAuthenticated) {
      loadOrders()
    }
  }, [isLoading, isAuthenticated, toast])

  useEffect(() => {
    let filtered = [...orders]

    // Date filtering
    if (dateFilter === "current-month") {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })
    } else if (dateFilter === "last-month") {
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= lastMonth && orderDate <= lastMonthEnd
      })
    } else if (dateFilter === "last-3-months") {
      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= threeMonthsAgo
      })
    } else if (dateFilter === "custom" && customDateRange.from && customDateRange.to) {
      const fromDate = new Date(customDateRange.from)
      fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(customDateRange.to)
      toDate.setHours(23, 59, 59, 999)

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= fromDate && orderDate <= toDate
      })
    }
    // "all-time" doesn't filter by date

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (order) =>
          (order.id && order.id.toLowerCase().includes(query)) ||
          (order.customerName && order.customerName.toLowerCase().includes(query)) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(query)) ||
          (order.companyName && order.companyName.toLowerCase().includes(query)),
      )
    }

    // Status filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status && order.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // State filtering
    if (stateFilter !== "all") {
      filtered = filtered.filter((order) => order.state && order.state.toLowerCase() === stateFilter.toLowerCase())
    }

    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to first page when filters change
    setTotalRevenue(
      filtered.reduce((acc, order) => acc + (order.pricing?.total || order.amount || order.total || 0), 0),
    )
    setTotalOrders(filtered.length)
  }, [searchQuery, statusFilter, stateFilter, dateFilter, orders, customDateRange])

  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginated = filteredOrders.slice(startIndex, endIndex)
    setPaginatedOrders(paginated)
    setStartIndex(startIndex)
    setEndIndex(endIndex)
    setTotalPages(Math.ceil(filteredOrders.length / ITEMS_PER_PAGE))
  }, [currentPage, filteredOrders])

  const handleDateRangeSelect = (range: string, label: string) => {
    setDateFilter(range)
    setDateRangeLabel(label)
    if (range !== "custom") {
      setCustomDateRange({ from: null, to: null })
    }
  }

  const handleCustomDateRange = (from: Date, to: Date) => {
    setCustomDateRange({ from, to })
    setDateFilter("custom")
    setDateRangeLabel(`${from.toLocaleDateString()} - ${to.toLocaleDateString()}`)
  }

  const handleExportOrders = () => {
    // Placeholder for export functionality
  }

  const handleViewCompanyDetails = (order: any) => {
    setSelectedCompanyId(order.companyId)
    setCompanyModalOpen(true)
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
        })
        return
      }

      // Find the order to get company ID - search in full orders array, not filtered
      const order = orders.find((o: any) => o.id === orderId)
      if (!order) {
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete order")
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      })

      // Reload the orders list
      const timestamp = Date.now()
      const [usersResponse, companiesResponse, ordersResponse] = await Promise.all([
        fetch(`/api/users?_t=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }),
        fetch(`/api/companies?_t=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }),
        fetch(`/api/orders?_t=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }),
      ])

      const usersData = await usersResponse.json()
      const companiesData = await companiesResponse.json()

      const allUsers = usersData.data || usersData || []
      const allCompanies = companiesData.data || companiesData || []

      const allOrdersData = allCompanies.flatMap((company: any) => {
        const companyOrders = company.orders || []
        return companyOrders.map((order: any) => ({
          ...order,
          companyId: company.id,
          companyName: company.name,
          state: company.state,
          packageType: order.packageType || company.packageType || "N/A",
        }))
      })

      const ordersWithDetails = allOrdersData.map((order: any) => {
        const company = allCompanies.find((c: any) => c.id === order.companyId)
        const user = allUsers.find((u: any) => String(u.id) === String(company?.userId))

        return {
          ...order,
          customerName: user?.name || company?.members?.[0]?.name || "Unknown",
          customerEmail: user?.email || "N/A",
          userId: company?.userId,
        }
      })

      const sortedOrders = ordersWithDetails.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      setCompanies(allCompanies)
      setOrders(sortedOrders)
      setFilteredOrders(sortedOrders)
    } catch (error: any) {
      console.error("[v0] Delete error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Orders & Companies</h1>
          <p className="text-slate-600 mt-1">
            {dateFilter === "current-month" ? "Current month orders" : "All orders"}
          </p>
        </div>
        <Button
          className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 transition-opacity duration-200"
          onClick={handleExportOrders}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Orders
        </Button>
      </div>

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
            <div className="text-2xl font-semibold text-slate-900">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              ${totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Order ID, Customer, Email, or Company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 border-slate-300 focus:border-red-500 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Status:</span>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className={
                      statusFilter === "all"
                        ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                        : "hover:bg-slate-100"
                    }
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                    className={
                      statusFilter === "pending"
                        ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                        : "hover:bg-slate-100"
                    }
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === "processing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("processing")}
                    className={
                      statusFilter === "processing"
                        ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                        : "hover:bg-slate-100"
                    }
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Processing
                  </Button>
                  <Button
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                    className={
                      statusFilter === "completed"
                        ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
                        : "hover:bg-slate-100"
                    }
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Period:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-slate-300 hover:bg-slate-50 hover:border-slate-400 bg-transparent"
                    >
                      {dateRangeLabel}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => handleDateRangeSelect("current-month", "This Month")}>
                      This Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDateRangeSelect("last-month", "Last Month")}>
                      Last Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDateRangeSelect("last-3-months", "Last 3 Months")}>
                      Last 3 Months
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDateRangeSelect("all-time", "All Time")}>
                      All Time
                    </DropdownMenuItem>
                    <div className="border-t my-1" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Calendar className="h-3 w-3 mr-2" />
                          Custom Range...
                        </DropdownMenuItem>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="start">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700">From Date</label>
                            <Input
                              type="date"
                              onChange={(e) => {
                                const from = new Date(e.target.value)
                                if (customDateRange.to && from <= customDateRange.to) {
                                  handleCustomDateRange(from, customDateRange.to)
                                } else if (!customDateRange.to) {
                                  setCustomDateRange({ ...customDateRange, from })
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">To Date</label>
                            <Input
                              type="date"
                              onChange={(e) => {
                                const to = new Date(e.target.value)
                                if (customDateRange.from && to >= customDateRange.from) {
                                  handleCustomDateRange(customDateRange.from, to)
                                } else if (!customDateRange.from) {
                                  setCustomDateRange({ ...customDateRange, to })
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {(searchQuery || statusFilter !== "all" || stateFilter !== "all") && (
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="secondary" className="text-xs">
                    {filteredOrders.length} results
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                      setStateFilter("all")
                    }}
                    className="h-8 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Orders</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {filteredOrders.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {paginatedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No orders found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || statusFilter !== "all" || stateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers complete checkout"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Order ID</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Customer</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Company</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">State</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Status</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Date</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => {
                      const amount = order.pricing?.total || order.amount || order.total || 0
                      const statusColor =
                        order.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : order.status === "processing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"

                      return (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <code className="text-xs font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              {order.id?.substring(0, 8)}...
                            </code>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{order.customerName || "N/A"}</p>
                              <p className="text-xs text-slate-500 truncate">{order.customerEmail || "N/A"}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-slate-700">{order.companyName || "N/A"}</span>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="text-xs">
                              {order.state || "N/A"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-semibold text-slate-900">${amount.toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`text-xs capitalize border ${statusColor}`}>
                              {order.status || "pending"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-slate-600">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewCompanyDetails(order)}>
                                  <Building2 className="h-4 w-4 mr-2" />
                                  View Company
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    handleDeleteOrder(order.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                    <span className="font-semibold">{Math.min(endIndex, filteredOrders.length)}</span> of{" "}
                    <span className="font-semibold">{filteredOrders.length}</span> orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === page ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : ""
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CompanyModal
        open={companyModalOpen}
        onOpenChange={setCompanyModalOpen}
        companyId={selectedCompanyId}
        companies={companies}
      />
    </div>
  )
}
