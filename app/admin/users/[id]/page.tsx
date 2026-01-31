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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
              <p className="text-sm font-semibold mt-1">{user.name}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Email Address</Label>
              <p className="text-sm font-semibold mt-1">{user.email}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
              <p className="text-sm font-semibold mt-1">{user.phone || "Not provided"}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={() => setShowPasswordDialog(true)}
              variant="destructive"
              size="sm"
            >
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
                <div key={company.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company.state}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/companies/${company.id}`)}
                    >
                      View Company
                    </Button>
                  </div>

                  {editingCompany === company.id ? (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs">EIN</Label>
                        <Input
                          placeholder="XX-XXXXXXX"
                          value={companyEdits.ein || ""}
                          onChange={(e) => setCompanyEdits({ ...companyEdits, ein: e.target.value })}
                          size={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Business ID</Label>
                        <Input
                          placeholder="BIZ-XXXXXXXX"
                          value={companyEdits.businessId || ""}
                          onChange={(e) => setCompanyEdits({ ...companyEdits, businessId: e.target.value })}
                          size={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">ITIN</Label>
                        <Input
                          placeholder="9XX-XX-XXXX"
                          value={companyEdits.itin || ""}
                          onChange={(e) => setCompanyEdits({ ...companyEdits, itin: e.target.value })}
                          size={1}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">EIN</Label>
                        <p className="font-mono">{company.ein || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Business ID</Label>
                        <p className="font-mono">{company.businessId || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">ITIN</Label>
                        <p className="font-mono">{company.itin || "—"}</p>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{userOrders.length}</p>
            <Link
              href="/admin/orders"
              className="text-sm text-[#ff0d13] hover:underline mt-3 inline-block font-medium"
            >
              View all orders →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{userDocuments.length}</p>
            <Link
              href="/admin/documents"
              className="text-sm text-[#ff0d13] hover:underline mt-3 inline-block font-medium"
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
