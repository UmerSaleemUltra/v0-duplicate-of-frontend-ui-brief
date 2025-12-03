"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Mail, Edit, Save, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [editingCompany, setEditingCompany] = useState<string | null>(null)
  const [companyEdits, setCompanyEdits] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [savingCompany, setSavingCompany] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const normalizeId = (id: any) => {
    if (!id) return ""
    return id.toString()
  }

  const loadData = async () => {
    setLoading(true)
    setUser(null)

    try {
      const token = authService.getToken()
      if (!token) {
        console.log("[v0] No auth token found")
        router.push("/login")
        return
      }

      console.log("[v0] Loading user data for ID:", params.id)

      const [userResponse, compResponse, ordersResponse, docsResponse] = await Promise.allSettled([
        fetch(`/api/users/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/companies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (userResponse.status === "fulfilled" && userResponse.value.ok) {
        const userResult = await userResponse.value.json()
        console.log("[v0] User API response:", userResult)

        const userData = userResult.data || userResult

        if (userData && (userData.id || userData._id || userData.email)) {
          const normalizedUser = {
            ...userData,
            id: userData.id || userData._id || params.id,
          }
          console.log("[v0] User loaded successfully:", normalizedUser.email)
          setUser(normalizedUser)
        } else {
          console.log("[v0] Invalid user data structure:", userData)
          toast({
            title: "Error",
            description: "User not found or invalid data",
            variant: "destructive",
          })
          setTimeout(() => router.push("/admin/users"), 1500)
          return
        }
      } else {
        console.log(
          "[v0] User API failed:",
          userResponse.status === "fulfilled" ? userResponse.value.status : "rejected",
        )
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        })
        setTimeout(() => router.push("/admin/users"), 1500)
        return
      }

      if (compResponse.status === "fulfilled" && compResponse.value.ok) {
        const compResult = await compResponse.value.json()
        const allCompanies = compResult.data || compResult.companies || []
        const userCompanies = allCompanies.filter((c: any) => {
          return normalizeId(c.userId) === normalizeId(params.id)
        })
        setCompanies(userCompanies)
      } else {
        console.log("[v0] Failed to load companies")
      }

      if (ordersResponse.status === "fulfilled" && ordersResponse.value.ok) {
        const ordersResult = await ordersResponse.value.json()
        const allOrders = ordersResult.data || ordersResult.orders || []
        const userOrders = allOrders.filter((o: any) => {
          return normalizeId(o.userId) === normalizeId(params.id)
        })
        setOrders(userOrders)
      } else {
        console.log("[v0] Failed to load orders")
      }

      if (docsResponse.status === "fulfilled" && docsResponse.value.ok) {
        const docsResult = await docsResponse.value.json()
        const allDocs = docsResult.data || docsResult.documents || []
        const userDocs = allDocs.filter((d: any) => {
          return normalizeId(d.userId) === normalizeId(params.id)
        })
        setDocuments(userDocs)
      } else {
        console.log("[v0] Failed to load documents")
      }
    } catch (error) {
      console.log("[v0] Error loading user details:", error)
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      })
      setTimeout(() => router.push("/admin/users"), 1500)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCompany = (company: any) => {
    setEditingCompany(company.id)
    setCompanyEdits({
      ein: company.ein || "",
      itin: company.itin || "",
      businessId: company.businessId || "",
    })
  }

  const validateEIN = (ein: string) => {
    if (!ein) return true // Optional field
    const einRegex = /^\d{2}-\d{7}$/
    return einRegex.test(ein)
  }

  const validateITIN = (itin: string) => {
    if (!itin) return true // Optional field
    const itinRegex = /^9\d{2}-\d{2}-\d{4}$/
    return itinRegex.test(itin)
  }

  const handleSaveCompany = async (companyId: string) => {
    if (companyEdits.ein && !validateEIN(companyEdits.ein)) {
      toast({
        title: "Validation Error",
        description: "EIN must be in format XX-XXXXXXX",
        variant: "destructive",
      })
      return
    }

    if (companyEdits.itin && !validateITIN(companyEdits.itin)) {
      toast({
        title: "Validation Error",
        description: "ITIN must be in format 9XX-XX-XXXX",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingCompany(true)
      const token = authService.getToken()
      if (!token) return

      let requestBody
      try {
        requestBody = JSON.stringify(companyEdits)
      } catch (jsonError) {
        console.log("[v0] JSON serialization error:", jsonError)
        throw new Error("Failed to process company data")
      }

      const response = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: requestBody,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update company")
      }

      toast({
        title: "Success",
        description: "Company updated successfully",
      })

      setEditingCompany(null)
      setCompanyEdits({})
      loadData()
    } catch (error) {
      console.log("[v0] Error updating company:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update company",
        variant: "destructive",
      })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    try {
      setChangingPassword(true)
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Changing password for user:", params.id)

      const response = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Password change failed:", response.status, errorText)

        let errorMessage = "Failed to change password"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // Use default error message if JSON parse fails
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("[v0] Password changed successfully:", result)

      toast({
        title: "Success",
        description: "Password changed successfully",
      })

      setShowPasswordDialog(false)
      setNewPassword("")
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => router.push("/admin/users")}>Back to Users</Button>
        </div>
      </div>
    )
  }

  const userOrders = orders
  const userDocuments = documents

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge
                variant="outline"
                className={
                  user.status === "active" ? "bg-brand/10 text-brand border-brand/20" : "bg-muted text-muted-foreground"
                }
              >
                {user.status}
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={() => setShowPasswordDialog(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Companies ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No companies found for this user</p>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company.entityType} • {company.state}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingCompany === company.id ? (
                        <Button size="sm" onClick={() => handleSaveCompany(company.id)} disabled={savingCompany}>
                          {savingCompany ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditCompany(company)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit IDs
                        </Button>
                      )}
                      <Link href={`/admin/customers/${company.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {editingCompany === company.id ? (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>EIN</Label>
                        <Input
                          placeholder="XX-XXXXXXX"
                          value={companyEdits.ein || ""}
                          onChange={(e) => setCompanyEdits({ ...companyEdits, ein: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Format: XX-XXXXXXX</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Business ID</Label>
                        <Input
                          placeholder="BIZ-XXXXXXXX"
                          value={companyEdits.businessId || ""}
                          onChange={(e) => setCompanyEdits({ ...companyEdits, businessId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ITIN</Label>
                        <Input
                          placeholder="9XX-XX-XXXX"
                          value={companyEdits.itin || ""}
                          onChange={(e) => setCompanyEdits({ ...companyEdits, itin: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Format: 9XX-XX-XXXX</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div>
                        <Label className="text-muted-foreground text-xs">EIN</Label>
                        <p className="font-mono text-sm">{company.ein || "Not assigned"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Business ID</Label>
                        <p className="font-mono text-sm">{company.businessId || "Not assigned"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">ITIN</Label>
                        <p className="font-mono text-sm">{company.itin || "Not assigned"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userOrders.length}</div>
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:underline">
              View all orders
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userDocuments.length}</div>
            <Link href="/admin/documents" className="text-xs text-muted-foreground hover:underline">
              View all documents
            </Link>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for {user.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changingPassword}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false)
                setNewPassword("")
              }}
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
