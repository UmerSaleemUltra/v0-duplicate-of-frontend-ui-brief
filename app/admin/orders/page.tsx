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
  DollarSign,
  ShoppingCart,
  Search,
  Filter,
  X,
  Calendar,
  ChevronDown,
  SlidersHorizontal,
  MapPin,
  CreditCard,
  Package,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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

const ORDER_STATUSES = ["all", "pending", "processing", "completed", "Order Proceeded", "cancelled"]
const PACKAGE_TYPES = ["all", "starter", "advanced"]
const PAYMENT_METHODS = ["all", "stripe", "bank_transfer", "whatsapp"]

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const { toast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [packageFilter, setPackageFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all-time")
  const [dateRangeLabel, setDateRangeLabel] = useState("All Time")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const router = useRouter()
  const [dataLoading, setDataLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [paginatedOrders, setPaginatedOrders] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(0)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; companyName: string } | null>(null)

  useEffect(() => {
    const loadOrders = async () => {
      setDataLoading(true)
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

        console.log(" Orders API Response:", ordersData)
        
        const allUsers = usersData.data || usersData || []
        const allCompanies = companiesData.data || companiesData || []
        const apiOrders = ordersData.data || ordersData || []
        
        console.log(" Loaded orders count:", apiOrders.length)

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
        
        console.log(" All orders after merge:", allOrders.length)

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
      } finally {
        setDataLoading(false)
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
    } else if (dateFilter === "custom" && customDateFrom && customDateTo) {
      const fromDate = new Date(customDateFrom)
      const toDate = new Date(customDateTo)
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

    // Package type filtering
    if (packageFilter !== "all") {
      filtered = filtered.filter((order) => {
        const pkg = order.packageType?.toLowerCase() || ""
        return pkg.includes(packageFilter.toLowerCase())
      })
    }

    // Payment method filtering
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((order) => {
        const method = order.paymentMethod?.toLowerCase() || order.paymentInfo?.method?.toLowerCase() || ""
        return method.includes(paymentMethodFilter.toLowerCase())
      })
    }

    // Amount range filtering
    if (minAmount) {
      const min = parseFloat(minAmount)
      if (!isNaN(min)) {
        filtered = filtered.filter((order) => {
          const amount = order.pricing?.total || order.amount || order.total || 0
          return amount >= min
        })
      }
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount)
      if (!isNaN(max)) {
        filtered = filtered.filter((order) => {
          const amount = order.pricing?.total || order.amount || order.total || 0
          return amount <= max
        })
      }
    }

    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to first page when filters change
    setTotalRevenue(
      filtered.reduce((acc, order) => acc + (order.pricing?.total || order.amount || order.total || 0), 0),
    )
    setTotalOrders(filtered.length)
  }, [searchQuery, statusFilter, stateFilter, packageFilter, paymentMethodFilter, dateFilter, customDateFrom, customDateTo, minAmount, maxAmount, orders])

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
      setCustomDateFrom("")
      setCustomDateTo("")
    }
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setStateFilter("all")
    setPackageFilter("all")
    setPaymentMethodFilter("all")
    setDateFilter("all-time")
    setDateRangeLabel("All Time")
    setCustomDateFrom("")
    setCustomDateTo("")
    setMinAmount("")
    setMaxAmount("")
  }

  const activeFilterCount = [
    statusFilter !== "all",
    stateFilter !== "all",
    packageFilter !== "all",
    paymentMethodFilter !== "all",
    dateFilter !== "all-time",
    minAmount !== "",
    maxAmount !== "",
  ].filter(Boolean).length

  const handleExportOrders = () => {
    try {
      // Create CSV content
      const headers = ["Order ID", "Customer Name", "Customer Email", "Company Name", "State", "Amount", "Status", "Package Type", "Date"]
      const rows = filteredOrders.map(order => [
        order.id || "N/A",
        order.customerName || "N/A",
        order.customerEmail || "N/A",
        order.companyName || "N/A",
        order.state || "N/A",
        (order.pricing?.total || order.amount || order.total || 0).toString(),
        order.status || "pending",
        order.packageType || "N/A",
        order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Exported ${filteredOrders.length} orders to CSV`,
      })
    } catch (error) {
      console.error(" Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive",
      })
    }
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
      const ordersData = await ordersResponse.json()

      const allUsers = usersData.data || usersData || []
      const allCompanies = companiesData.data || companiesData || []
      const apiOrders = ordersData.data || ordersData || []

      let allOrdersData = apiOrders.length > 0
        ? apiOrders
        : allCompanies.flatMap((company: any) => {
            const companyOrders = company.orders || []
            return companyOrders.map((order: any) => ({
              ...order,
              companyId: company.id,
              companyName: company.name,
              state: company.state,
              packageType: order.packageType || company.packageType || "N/A",
            }))
          })

      allOrdersData = allOrdersData.map((order: any) => ({
        ...order,
        id: order.id || order._id,
      }))

      const ordersWithDetails = allOrdersData.map((order: any) => {
        const company = allCompanies.find((c: any) => {
          const cId = c.id || c._id?.toString?.()
          return String(cId) === String(order.companyId)
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
    } catch (error: any) {
      console.error(" Delete error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  if (isLoading || dataLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded"></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-slate-200 rounded"></div>
                <div className="h-6 w-20 bg-slate-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {dateFilter === "current-month" ? "Current month orders" : "All orders"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-700 text-xs rounded-xl" onClick={handleExportOrders}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Companies</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{companies.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Orders</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{totalOrders}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Value</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            ${totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Order ID, Customer, Email, or Company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 border-slate-200 text-sm rounded-xl"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            size="sm"
            className={`h-10 px-4 rounded-xl gap-2 ${showAdvancedFilters ? "bg-slate-900 text-white" : "border-slate-200"}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">{activeFilterCount}</span>
            )}
          </Button>
        </div>

        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400">Status:</span>
          {["all", "pending", "processing", "completed", "Order Proceeded"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {s === "all" ? "All" : s === "Order Proceeded" ? "Proceeded" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-2">Period:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-slate-200 rounded-full">
                {dateRangeLabel}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => handleDateRangeSelect("current-month", "This Month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeSelect("last-month", "Last Month")}>Last Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeSelect("last-3-months", "Last 3 Months")}>Last 3 Months</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeSelect("all-time", "All Time")}>All Time</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeSelect("custom", "Custom Range")}>Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium">
              Clear All Filters
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* State Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> State
                </label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state.toLowerCase()}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Package Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Package className="h-3 w-3" /> Package
                </label>
                <Select value={packageFilter} onValueChange={setPackageFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="All Packages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Payment
                </label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Amount Range
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="h-9 text-xs rounded-xl border-slate-200 w-full"
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="h-9 text-xs rounded-xl border-slate-200 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Custom Date Range:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="h-9 text-xs rounded-xl border-slate-200 w-36"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="h-9 text-xs rounded-xl border-slate-200 w-36"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">Orders</span>
          <span className="text-xs text-slate-400">{filteredOrders.length} total</span>
        </div>
        <div className="overflow-x-auto">
          {paginatedOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-400">
                {searchQuery || statusFilter !== "all" || stateFilter !== "all" ? "No matching orders" : "No orders yet"}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Order ID</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Company</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">State</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-6 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => {
                    const amount = order.pricing?.total || order.amount || order.total || 0
                    const statusCls =
                      order.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : order.status === "processing"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded cursor-default select-none">
                                {order.id?.substring(0, 8)}…
                              </code>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="font-mono text-xs max-w-xs break-all">
                              {order.id || "N/A"}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-6 py-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium text-slate-900 max-w-[140px] truncate cursor-default">{order.customerName || "N/A"}</p>
                            </TooltipTrigger>
                            {(order.customerName?.length ?? 0) > 18 && (
                              <TooltipContent side="top">{order.customerName}</TooltipContent>
                            )}
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-slate-400 max-w-[140px] truncate cursor-default">{order.customerEmail || "N/A"}</p>
                            </TooltipTrigger>
                            {(order.customerEmail?.length ?? 0) > 20 && (
                              <TooltipContent side="top">{order.customerEmail}</TooltipContent>
                            )}
                          </Tooltip>
                        </td>
                        <td className="px-6 py-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-slate-700 max-w-[130px] truncate block cursor-default">{order.companyName || "N/A"}</span>
                            </TooltipTrigger>
                            {(order.companyName?.length ?? 0) > 18 && (
                              <TooltipContent side="top">{order.companyName}</TooltipContent>
                            )}
                          </Tooltip>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500">{order.state || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">${amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusCls}`}>
                            {order.status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setOrderToDelete({ id: order.id, companyName: order.companyName || "this order" }); setDeleteConfirmOpen(true) }}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">{startIndex + 1}–{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-3 text-xs">Previous</Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant="ghost" size="sm" onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600"}`}>
                        {page}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-3 text-xs">Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the order for{" "}
              <span className="font-semibold text-slate-900">
                {orderToDelete?.companyName}
              </span>
              ? This action cannot be undone and will permanently remove the order and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false)
                setOrderToDelete(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              onClick={() => {
                if (orderToDelete) {
                  handleDeleteOrder(orderToDelete.id)
                }
                setDeleteConfirmOpen(false)
                setOrderToDelete(null)
              }}
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
