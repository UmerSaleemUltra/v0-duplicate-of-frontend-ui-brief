"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Mail, Phone, Eye, Trash2, MoreVertical, Building2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"

export default function CustomersPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadCustomers()
    }
  }, [isLoading, isAuthenticated])

  const loadCustomers = async () => {
    setDataLoading(true)
    try {
      const token = authService.getToken()
      if (!token) return

      const [usersResponse, companiesResponse] = await Promise.all([
        ApiClient.users.getAll(token),
        ApiClient.companies.getAll(token),
      ])

      const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : []
      const allCompanies = Array.isArray(companiesResponse.data) ? companiesResponse.data : []

      console.log("[v0] Loaded customers data:", {
        users: allUsers.length,
        companies: allCompanies.length,
      })

      const allOrders = allCompanies.flatMap((company: any) => {
        const companyOrders = company.orders || []
        return companyOrders.map((order: any) => ({
          ...order,
          companyId: company.id,
          userId: company.userId,
        }))
      })

      console.log("[v0] Extracted orders from companies:", allOrders.length)

      const normalizedCompanies = allCompanies.map((c: any) => ({
        ...c,
        id: c.id || (c._id?.toString ? c._id.toString() : String(c._id || "")),
      }))

      const customersWithDetails = allUsers
        .filter((user: any) => user.role !== "admin")
        .map((user: any) => {
          const userId = user.id?.toString ? user.id.toString() : String(user.id || "")

          const userCompanies = normalizedCompanies.filter((c: any) => {
            const companyUserId = c.userId?.toString ? c.userId.toString() : String(c.userId || "")
            return companyUserId === userId
          })

          const userOrders = allOrders.filter((o: any) => {
            const orderUserId = o.userId?.toString ? o.userId.toString() : String(o.userId || "")
            return orderUserId === userId
          })

          const totalSpent = userOrders.reduce(
            (sum: number, order: any) => sum + (order.amount || order.pricing?.total || 0),
            0,
          )

          return {
            ...user,
            id: userId,
            company: userCompanies[0]?.name || "N/A",
            companyType: userCompanies[0]?.type || "LLC",
            state: userCompanies[0]?.state || "N/A",
            companies: userCompanies,
            orders: userOrders.length,
            totalSpent: `$${totalSpent}`,
            joinDate: new Date(user.createdAt).toLocaleDateString(),
          }
        })

      setCustomers(customersWithDetails)
      setFilteredCustomers(customersWithDetails)

      console.log("[v0] Customers loaded successfully:", customersWithDetails.length)
    } catch (error) {
      console.error("[v0] Error loading customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter((customer) => {
        const name = customer.name?.toLowerCase() || ""
        const email = customer.email?.toLowerCase() || ""
        const company = customer.company?.toLowerCase() || ""
        const query = searchQuery.toLowerCase()

        return name.includes(query) || email.includes(query) || company.includes(query)
      })
      setFilteredCustomers(filtered)
      setCurrentPage(1) // Reset pagination when filtering
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchQuery, customers])

  const handleDeleteCustomer = async (customerId: string) => {
    if (typeof window === "undefined") return

    if (
      !confirm(
        "Are you sure you want to delete this customer? This will permanently delete their account, all companies, orders, and documents.",
      )
    ) {
      return
    }

    try {
      const token = authService.getToken()
      if (!token) return

      await ApiClient.users.delete(customerId, token)

      console.log("[v0] Customer deleted successfully:", customerId)

      toast({
        title: "Success",
        description: "Customer and all related data deleted successfully",
      })

      loadCustomers()
    } catch (error) {
      console.error("[v0] Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  if (isLoading || dataLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-10 bg-slate-200 rounded w-full max-w-md"></div>

        {/* Cards Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-100 rounded w-40"></div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <div className="flex-1 h-9 bg-slate-200 rounded"></div>
                <div className="h-9 w-9 bg-slate-200 rounded"></div>
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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Customers</h1>
        <p className="text-slate-600 mt-1">Manage your customer base and view their activity</p>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customers by name, email, or company..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">{customers.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
              {customers.reduce((sum, c) => sum + c.orders, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
              {customers.reduce((sum, c) => {
                const spent = typeof c.totalSpent === 'string' ? parseFloat(c.totalSpent.replace('$', '')) || 0 : c.totalSpent || 0
                return sum + spent
              }, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200 transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            All Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No customers found</p>
              <p className="text-sm text-slate-500 mt-2">Customers will appear here once they complete registration</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-primary/20 hover:shadow-md transition-all duration-200 gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white font-semibold">
                          {customer.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {customer.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{customer.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{customer.totalSpent}</p>
                        <p className="text-xs text-slate-500">{customer.orders} orders</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/customers/${customer.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of{" "}
                    {filteredCustomers.length} customers
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
    </div>
  )
}
