"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Edit, Building2, FileText, DollarSign, Key, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { userStorage, companyStorage, orderStorage, invoiceStorage, type User, type Company } from "@/lib/local-storage"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { currentUserStorage } from "@/lib/local-storage" // Import currentUserStorage

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setUsers(userStorage.getAll().filter((u) => u.role === "client"))
    setCompanies(companyStorage.getAll())
  }

  const getUserCompanies = (userId: string) => {
    return companies.filter((c) => c.userId === userId)
  }

  const getUserOrders = (userId: string) => {
    return orderStorage.getByUserId(userId)
  }

  const getUserInvoices = (userId: string) => {
    return invoiceStorage.getByUserId(userId)
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

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!selectedUser) return
    userStorage.update(selectedUser.id, updates)
    loadData()
    setEditModalOpen(false)
    setSelectedUser(null)
  }

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordModalOpen(true)
  }

  const handleChangePassword = () => {
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

    userStorage.update(selectedUser.id, { password: newPassword })

    toast({
      title: "Success",
      description: `Password updated for ${selectedUser.name}`,
    })

    setPasswordModalOpen(false)
    setSelectedUser(null)
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleLoginAsUser = (user: User) => {
    const currentAdmin = currentUserStorage.get()
    if (currentAdmin) {
      sessionStorage.setItem("impersonating_admin_id", currentAdmin.id)
    }

    currentUserStorage.set(user)

    toast({
      title: "Logged in as User",
      description: `You are now logged in as ${user.name}`,
    })

    window.location.href = "/client/dashboard"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users, companies, and access control</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold mt-1">{users.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold mt-1">{users.filter((u) => u.status === "active").length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Companies</p>
              <p className="text-2xl font-bold mt-1">{companies.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Users</p>
              <p className="text-2xl font-bold mt-1">{users.filter((u) => u.status === "pending").length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-medium text-sm">User</th>
                <th className="text-left p-4 font-medium text-sm">Email</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Companies</th>
                <th className="text-left p-4 font-medium text-sm">Orders</th>
                <th className="text-left p-4 font-medium text-sm">Invoices</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userCompanies = getUserCompanies(user.id)
                  const userOrders = getUserOrders(user.id)
                  const userInvoices = getUserInvoices(user.id)

                  return (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.phone || "No phone"}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{user.email}</span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={
                            user.status === "active"
                              ? "bg-brand/10 text-brand border-brand/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{userCompanies.length}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{userOrders.length}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{userInvoices.length}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 px-3">
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenPasswordModal(user)}
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
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
      </div>

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
                    <SelectValue />
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
