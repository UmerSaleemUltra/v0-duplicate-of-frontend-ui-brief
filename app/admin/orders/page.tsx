"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Calendar,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { orderStorage, userStorage, companyStorage } from "@/lib/local-storage"
import { useAuthGuard } from "@/lib/use-auth-guard"

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
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("current-month")
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [newOrderId, setNewOrderId] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Load all orders from localStorage
    const allOrders = orderStorage.getAll()
    const ordersWithDetails = allOrders.map((order) => {
      const user = userStorage.getById(order.userId)
      const company = companyStorage.getById(order.companyId)
      return {
        ...order,
        customerName: user?.name || "Unknown",
        customerEmail: user?.email || "N/A",
        companyName: company?.name || "N/A",
        state: company?.state || "N/A",
        entityType: company?.entityType || "LLC",
        packageType: company?.packageType || "starter",
      }
    })
    setOrders(ordersWithDetails)
    setFilteredOrders(ordersWithDetails)
  }, [])

  useEffect(() => {
    // Filter orders based on search and filters
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

  const handleEditOrderId = (order: any) => {
    setSelectedOrder(order)
    setNewOrderId(order.id)
    setEditOrderOpen(true)
  }

  const handleSaveOrderId = () => {
    if (selectedOrder && newOrderId) {
      orderStorage.update(selectedOrder.id, { id: newOrderId })
      // Refresh orders
      const allOrders = orderStorage.getAll()
      const ordersWithDetails = allOrders.map((order) => {
        const user = userStorage.getById(order.userId)
        const company = companyStorage.getById(order.companyId)
        return {
          ...order,
          customerName: user?.name || "Unknown",
          customerEmail: user?.email || "N/A",
          companyName: company?.name || "N/A",
          state: company?.state || "N/A",
          entityType: company?.entityType || "LLC",
          packageType: company?.packageType || "starter",
        }
      })
      setOrders(ordersWithDetails)
      setFilteredOrders(ordersWithDetails)
      setEditOrderOpen(false)
    }
  }

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      orderStorage.delete(orderId)
      const updatedOrders = orders.filter((order) => order.id !== orderId)
      setOrders(updatedOrders)
      setFilteredOrders(updatedOrders)
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
          order.amount,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Orders</h1>
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

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search orders..."
                className="pl-10 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state.toLowerCase().replace(/\s+/g, "")}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
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
                  {filteredOrders.map((order) => (
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
                        <span className="text-sm font-semibold text-slate-900">${order.amount}</span>
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
                        <span className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</span>
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
                            <DropdownMenuItem onClick={() => handleEditOrderId(order)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Order ID
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
          )}
        </CardContent>
      </Card>

      <Dialog open={editOrderOpen} onOpenChange={setEditOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Order ID</DialogTitle>
            <DialogDescription>Update the order ID for this customer order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={newOrderId}
                onChange={(e) => setNewOrderId(e.target.value)}
                placeholder="Enter new order ID"
                className="h-10 font-mono"
              />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-600">
                <strong>Note:</strong> Changing the order ID will update it across the entire system. Make sure the new
                ID is unique.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditOrderOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button
                onClick={handleSaveOrderId}
                className="h-10 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
