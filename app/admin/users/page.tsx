"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Edit, Building2, FileText, Key, LogIn, Users, UserCheck, Clock, ShoppingCart, DollarSign, Copy, Check, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { User, Company, Order } from "@/lib/types"

const MAX_LEN = 28

function TruncatedCell({ text, maxLen = MAX_LEN }: { text: string; maxLen?: number }) {
  const [copied, setCopied] = useState(false)
  if (!text || text === "—") return <span className="text-slate-400">—</span>
  const isTruncated = text.length > maxLen
  const display = isTruncated ? text.slice(0, maxLen) + "…" : text

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!isTruncated) return <span>{text}</span>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 cursor-default">
          <span className="truncate max-w-[160px]">{display}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy() }}
            className="shrink-0 text-slate-300 hover:text-slate-600 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

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
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const ITEMS_PER_PAGE = 8
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      setDeleting(true)
      const token = authService.getToken()
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        await loadData()
        toast({ title: "User deleted", description: `${userToDelete.name} has been permanently deleted.` })
      } else {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || "Delete failed")
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete user", variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-10 bg-slate-200 rounded w-full max-w-md"></div>

        {/* Table Skeleton */}
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
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-100 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-slate-200 rounded"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage users, companies, and access control</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm max-w-md"
        />
      </div>

      <TooltipProvider delayDuration={300}>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Companies</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Orders</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const userCompanies = getUserCompanies(user.id)
                  const userOrders = getUserOrders(user.id)

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          <TruncatedCell text={user.name} />
                        </p>
                        <p className="text-xs text-slate-400">{user.phone || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <TruncatedCell text={user.email} maxLen={30} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 font-medium">{userCompanies.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 font-medium">{userOrders.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-slate-600">View</Button>
                          </Link>
                          {userOrders.length > 0 && (
                            <Link href={`/admin/orders/${userOrders[0].id}`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" title="View First Order">
                                <ShoppingCart className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={() => handleEditUser(user)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={() => handleOpenPasswordModal(user)} title="Change Password">
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={() => handleLoginAsUser(user)} title="Login as User">
                            <LogIn className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete User"
                            onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true) }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {startIndex + 1}–{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </p>
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
      </div>
      </TooltipProvider>

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong>? This will also remove all
              their companies, orders, documents, and associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Deleting…" : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
