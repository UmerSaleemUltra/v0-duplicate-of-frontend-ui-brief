"use client"

import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Search, UserPlus, Edit, Building2, FileText, Key, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { User, Company, Order } from "@/lib/types"
import UsersIcon from "@/components/UsersIcon" // Placeholder for Users component
import UserCheckIcon from "@/components/UserCheckIcon" // Placeholder for UserCheck component
import ClockIcon from "@/components/ClockIcon" // Placeholder for Clock component

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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

      if (!token) {
        return
      }

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
        console.log("[v0] Extracted orders from companies:", extractedOrders.length)
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
    return companies.filter((c) => {
      return normalizeId(c.userId) === normalizeId(userId)
    })
  }

  const getUserOrders = (userId: string) => {
    if (!Array.isArray(orders)) return []
    return orders.filter((o) => {
      return normalizeId(o.userId) === normalizeId(userId)
    })
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!selectedUser) return

    if (updates.email && !isValidEmail(updates.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    if (updates.name && updates.name.trim().length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      const token = authService.getToken()

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await loadData()
        setEditModalOpen(false)
        setSelectedUser(null)

        toast({
          title: "Success",
          description: "User updated successfully",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Update failed")
      }
    } catch (error) {
      console.log("[v0] User update error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordModalOpen(true)
  }

  const handleChangePassword = async () => {
    if (!selectedUser) return

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      const token = authService.getToken()

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Password updated for ${selectedUser.name}`,
        })

        setPasswordModalOpen(false)
        setSelectedUser(null)
        setNewPassword("")
        setConfirmPassword("")
      } else {
        throw new Error("Password change failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      })
    }
  }

  const handleLoginAsUser = async (user: User) => {
    try {
      console.log("[v0] Starting login as user process:", user.email)

      if (!authService || typeof authService.getToken !== "function") {
        console.error("[v0] authService not properly initialized")
        toast({
          title: "Error",
          description: "Authentication service error. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      const token = authService.getToken()

      if (!token) {
        console.log("[v0] No admin token found")
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const adminData = authService.getCurrentUser()

      if (!adminData) {
        console.log("[v0] No admin user data found")
        toast({
          title: "Error",
          description: "Admin session expired. Please log in again.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!user.id || !user.name || !user.email) {
        console.log("[v0] Invalid user data:", user)
        toast({
          title: "Error",
          description: "Invalid user data. Cannot access account.",
          variant: "destructive",
        })
        return
      }

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("admin_impersonation_token", token)
          sessionStorage.setItem("admin_impersonation_data", JSON.stringify(adminData))
          sessionStorage.setItem("impersonating_user_id", user.id)
          sessionStorage.setItem("impersonating_user_name", user.name)
          sessionStorage.setItem("impersonating_user_email", user.email)
          console.log("[v0] Session storage set successfully")

          // Create a client user object and set it in authService
          const clientUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "client" as const,
          }

          // Use the admin token but set the user as client
          authService.setAuth(token, clientUser)
          console.log("[v0] Auth context updated to client user")
        } catch (storageError) {
          console.error("[v0] Failed to set session storage:", storageError)
          toast({
            title: "Error",
            description: "Failed to initialize admin mode. Please try again.",
            variant: "destructive",
          })
          return
        }
      }

      console.log("[v0] Admin accessing user account:", user.name, user.id)

      toast({
        title: "Logged in as User",
        description: `You are now viewing as ${user.name}. Click "Exit Admin Mode" to return.`,
      })

      setTimeout(() => {
        window.location.href = "/client/dashboard"
      }, 100)
    } catch (error) {
      console.error("[v0] Error logging in as user:", error)
      toast({
        title: "Error",
        description: "Failed to login as user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const normalizeId = (id: any) => {
    if (!id) return ""
    return id.toString()
  }

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            User Management
          </h1>
          <p className="text-slate-600 mt-1">Manage users, companies, and access control</p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{users.length}</div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{orders.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {orders.reduce((sum, order) => sum + (order.pricing?.total || order.amount || order.total || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-slate-300"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700">User</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700">Email</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700">Status</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700">Companies</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700">Orders</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userCompanies = getUserCompanies(user.id)
                    const userOrders = getUserOrders(user.id)

                    return (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.phone || "No phone"}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-700">{user.email}</span>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              user.status === "active"
                                ? "bg-green-50 text-green-700 border-green-200 font-medium"
                                : "bg-amber-50 text-amber-700 border-amber-200 font-medium"
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">{userCompanies.length}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium">{userOrders.length}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link href={`/admin/users/${user.id}`}>
                              <Button size="sm" variant="ghost" className="h-9 px-3 hover:bg-slate-100">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 hover:bg-slate-100"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 hover:bg-slate-100"
                              onClick={() => handleOpenPasswordModal(user)}
                              title="Change Password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 hover:bg-slate-100"
                              onClick={() => handleLoginAsUser(user)}
                              title="Login as User"
                            >
                              <LogIn className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and status</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={selectedUser.phone || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value: any) => setSelectedUser({ ...selectedUser, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateUser(selectedUser)}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
