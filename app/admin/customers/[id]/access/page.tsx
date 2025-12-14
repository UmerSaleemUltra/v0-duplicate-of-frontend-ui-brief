"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Phone,
  User,
  AlertCircle,
} from "lucide-react"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"

export default function AdminUserAccessPage() {
  const { isAuthenticated, isLoading } = useAuthGuard("admin")
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadUserData()
    }
  }, [isLoading, isAuthenticated, userId])

  const loadUserData = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      // Load user details
      const userResponse = await ApiClient.users.getById(userId, token)
      setUser(userResponse.data)

      // Load user's companies
      const companiesResponse = await ApiClient.companies.getAll(token)
      const allCompanies = Array.isArray(companiesResponse.data) ? companiesResponse.data : []

      const userCompanies = allCompanies.filter((c: any) => {
        const companyUserId = c.userId?.toString ? c.userId.toString() : String(c.userId || "")
        return companyUserId === userId
      })

      setCompanies(userCompanies)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleAccessCompany = (company: any) => {
    if (typeof window !== "undefined") {
      const companyId = company.id || company._id?.toString()
      localStorage.setItem("admin_accessed_company_id", companyId)
      localStorage.setItem("admin_accessed_user_id", userId)

      toast({
        title: "Access Granted",
        description: `You are now viewing ${company.name}`,
      })

      // Redirect to company details or client dashboard
      router.push(`/admin/orders/${company.orderId || companyId}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getMilestoneProgress = (milestones: any) => {
    if (!milestones || typeof milestones !== "object") return { completed: 0, total: 0, percentage: 0 }

    const allMilestones = [...(milestones.system || []), ...(milestones.custom || [])]
    const completed = allMilestones.filter((m: any) => m.completed).length
    const total = allMilestones.length

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading user access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">User Not Found</h3>
              <p className="text-slate-600 mb-4">The user you're trying to access doesn't exist.</p>
              <Button onClick={() => router.push("/admin/customers")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </div>

      {/* User Info Card */}
      <Card className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarFallback className="bg-white text-primary text-xl font-bold">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </span>
                )}
                <Badge variant="outline" className="bg-white text-primary border-white">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {companies.filter((c) => c.formationStatus === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {companies.filter((c) => c.formationStatus !== "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            User Companies ({companies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No companies found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => {
                const progress = getMilestoneProgress(company.milestones)
                const companyId = company.id || company._id?.toString()

                return (
                  <Card key={companyId} className="border-slate-200 hover:border-primary/20 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{company.name}</h3>
                            <Badge className={getStatusColor(company.formationStatus)}>
                              {company.formationStatus || "pending"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {company.type} - {company.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Created {new Date(company.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              ID: {companyId}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAccessCompany(company)}
                          className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Access Company
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Formation Progress</span>
                          <span className="font-semibold text-slate-900">
                            {progress.completed} / {progress.total} milestones
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Key Milestones */}
                      {company.milestones?.system && company.milestones.system.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Key Milestones</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {company.milestones.system.slice(0, 4).map((milestone: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {milestone.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                )}
                                <span className={milestone.completed ? "text-slate-900" : "text-slate-500"}>
                                  {milestone.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
