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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your customer base and view their activity</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search customers by name, email, or company..."
          className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Customers</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{customers.length}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Orders</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {customers.reduce((sum, c) => sum + c.orders, 0)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Revenue</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {customers.reduce((sum, c) => {
              const spent = typeof c.totalSpent === 'string' ? parseFloat(c.totalSpent.replace('$', '')) || 0 : c.totalSpent || 0
              return sum + spent
            }, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">All Customers</span>
          <span className="text-xs text-slate-400">{filteredCustomers.length} total</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-500">No customers found</p>
            </div>
          ) : (
            <>
              {paginatedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                        {customer.name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
                      <p className="text-xs text-slate-500 truncate line-clamp-1">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-slate-900">{customer.totalSpent}</p>
                      <p className="text-xs text-slate-400">{customer.orders} orders</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/admin/customers/${customer.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4">
                  <p className="text-xs text-slate-400">
                    {startIndex + 1}–{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-3 text-xs">
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant="ghost" size="sm" onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600"}`}>
                        {page}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-3 text-xs">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
