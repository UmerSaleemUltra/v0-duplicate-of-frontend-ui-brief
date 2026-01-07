"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { CompanyModal } from "@/components/company-modal"

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
  const router = useRouter()
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  useEffect(() => {
    const loadOrders = async () => {
      try {
        console.log("[v0] Admin Orders: Loading companies with embedded orders...")
        const token = authService.getToken()
        if (!token) return

        const timestamp = Date.now()
        const [usersResponse, companiesResponse] = await Promise.all([
          fetch(`https://www.buzzfiling.com/api/users?_t=${timestamp}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }),
          fetch(`https://www.buzzfiling.com/api/companies?_t=${timestamp}`, {
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

        console.log("[v0] Admin Orders: Loaded companies:", allCompanies.length)

        const allOrders = allCompanies.flatMap((company: any) => {
          const companyOrders = company.orders || []
          return companyOrders.map((order: any) => ({
            ...order,
            companyId: company.id,
            companyName: company.name,
            state: company.state,
            packageType: order.packageType || company.packageType || "N/A",
          }))
        })

        console.log("[v0] Admin Orders: Extracted orders from companies:", allOrders.length)

        const ordersWithDetails = allOrders.map((order: any) => {
          const company = allCompanies.find((c: any) => c.id === order.companyId)
          const user = allUsers.find((u: any) => String(u.id) === String(company?.userId))

          console.log(
            "[v0] Order mapping - Order ID:",
            order.id,
            "Company ID:",
            order.companyId,
            "Company userId:",
            company?.userId,
            "Found user:",
            user?.name || user?.email,
          )

          return {
            ...order,
            customerName: user?.name || company?.members?.[0]?.name || "Unknown",
            customerEmail: user?.email || "N/A",
            userId: company?.userId, // Add userId for tracking
          }
        })

        console.log("[v0] Admin Orders: Orders with details:", ordersWithDetails.length)
        setCompanies(allCompanies)
        setOrders(ordersWithDetails)
        setFilteredOrders(ordersWithDetails)
      } catch (error) {
        console.error("[v0] Admin Orders: Error loading data:", error)
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
    let filtered = orders

    if (dateFilter === "current-month") {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((order) => order.state.toLowerCase() === stateFilter.toLowerCase())
    }

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, stateFilter, dateFilter, orders])

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, stateFilter, dateFilter])

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return

    try {
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      const orderToDelete = orders.find((o) => o.id === orderId)
      if (!orderToDelete) return

      const response = await fetch(
        `https://www.buzzfiling.com/api/companies/${orderToDelete.companyId}/orders/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to delete order")
      }

      const updatedOrders = orders.filter((order) => order.id !== orderId)
      setOrders(updatedOrders)
      setFilteredOrders(updatedOrders)

      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
    } catch (error) {
      console.error("[v0] Admin Orders: Error deleting order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportOrders = () => {
    const csvContent = [
      ["Order ID", "Customer", "Email", "Company", "State", "Package", "Amount", "Status", "Date"].join(","),
      ...filteredOrders.map((order) =>
        [
          order.id,
          order.customerName,
          order.customerEmail,
          order.companyName,
          order.state,
          order.packageType,
          order.pricing?.total || order.amount || order.total || 0,
          order.status,
          new Date(order.createdAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleViewCompanyDetails = (order: any) => {
    if (order.companyId) {
      setSelectedCompanyId(order.companyId)
      setCompanyModalOpen(true)
    }
  }

  const totalRevenue = orders.reduce((sum, order) => {
    const orderAmount = order.pricing?.total || order.amount || order.total || 0
    return sum + orderAmount
  }, 0)

  console.log("[v0] Admin Orders: Total revenue calculated:", totalRevenue, "from", orders.length, "orders")

  const totalOrders = orders.length

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

      <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No orders found</p>
              <p className="text-sm text-slate-500 mt-2">Orders will appear here once customers complete checkout</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">State</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Package</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-slate-900 font-mono">{order.id}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                            <p className="text-xs text-slate-500">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-700">{order.companyName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-700">{order.state}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="text-xs capitalize">
                            {order.packageType}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-semibold text-slate-900">
                            ${order.pricing?.total || order.amount || order.total || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "processing"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs capitalize"
                          >
                            {order.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {order.status === "processing" && <Clock className="h-3 w-3 mr-1" />}
                            {order.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewCompanyDetails(order)}>
                                <Building2 className="h-4 w-4 mr-2" />
                                View Company
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteOrder(order.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{" "}
                    orders
                  </div>
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : ""}
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
        showOwnerDetails={true}
      />
    </div>
  )
}
