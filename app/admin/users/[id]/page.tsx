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

      const timestamp = Date.now()
      const [userResponse, compResponse, docsResponse] = await Promise.allSettled([
        fetch(`/api/users/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/companies?_t=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
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
        console.log("[v0] Companies loaded:", userCompanies.length)

        const userOrders = userCompanies.flatMap((company: any) => {
          const companyOrders = company.orders || []
          return companyOrders.map((order: any) => ({
            ...order,
            companyId: company.id,
            companyName: company.name,
          }))
        })

        setOrders(userOrders)
        console.log("[v0] Orders extracted from companies:", userOrders.length)
      } else {
        console.log("[v0] Failed to load companies")
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
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="hover:bg-slate-100" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="text-xl font-semibold">User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="font-semibold text-lg text-slate-900">{user.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
              <p className="font-semibold text-lg text-slate-900">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
              <p className="font-semibold text-lg text-slate-900">{user.phone || "Not provided"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
              <Badge
                variant="outline"
                className={
                  user.status === "active"
                    ? "bg-green-50 text-green-700 border-green-200 font-medium px-3 py-1"
                    : "bg-amber-50 text-amber-700 border-amber-200 font-medium px-3 py-1"
                }
              >
                {user.status}
              </Badge>
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button
              onClick={() => setShowPasswordDialog(true)}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="text-xl font-semibold">Companies ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {companies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No companies found for this user</p>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id}
                  className="border-2 border-slate-200 rounded-xl p-5 space-y-4 hover:border-slate-300 transition-colors bg-gradient-to-br from-white to-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{company.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {company.entityType} • {company.state}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 bg-transparent"
                        onClick={() => router.push(`/admin/customers/${company.id}`)}
                      >
                        View Customer
                      </Button>
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
        <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardTitle className="text-base font-semibold">Total Orders</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {userOrders.length}
            </div>
            <Link
              href="/admin/orders"
              className="text-sm text-purple-600 hover:underline mt-2 inline-block font-medium"
            >
              View all orders →
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardTitle className="text-base font-semibold">Total Documents</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {userDocuments.length}
            </div>
            <Link
              href="/admin/documents"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block font-medium"
            >
              View all documents →
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
