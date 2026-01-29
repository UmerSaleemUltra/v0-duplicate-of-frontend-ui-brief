"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { User, Company, Order } from "@/lib/types"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = authService.getToken()

      if (!token) return

      const [usersRes, companiesRes] = await Promise.all([
        fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/companies", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const allUsers = usersData.data || usersData.users || []
        setUsers(allUsers.filter((u: User) => u.role === "client"))
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        const allCompanies = companiesData.data || companiesData.companies || []
        setCompanies(allCompanies)

        const extractedOrders = allCompanies.flatMap((company: any) => {
          const companyOrders = company.orders || []
          return companyOrders.map((order: any) => ({
            ...order,
            companyId: company.id,
            userId: company.userId,
          }))
        })

        setOrders(extractedOrders)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getUserCompanies = (userId: string) => {
    if (!Array.isArray(companies)) return []
    return companies.filter((c) => c.userId === userId)
  }

  const getUserOrders = (userId: string) => {
    if (!Array.isArray(orders)) return []
    return orders.filter((o) => o.userId === userId)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage user accounts</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Email</th>
              <th className="text-left p-3 font-semibold">Phone</th>
              <th className="text-left p-3 font-semibold">Companies</th>
              <th className="text-left p-3 font-semibold">Orders</th>
              <th className="text-left p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 text-muted-foreground">{user.phone || "-"}</td>
                  <td className="p-3">{getUserCompanies(user.id).length}</td>
                  <td className="p-3">{getUserOrders(user.id).length}</td>
                  <td className="p-3">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
