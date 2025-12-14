"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Landmark, Search, Filter, CheckCircle2, Clock, XCircle, Eye, Building2 } from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "react-toastify"

export default function AdminBankingPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [bankFilter, setBankFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const user = authService.getCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/client/dashboard")
        return
      }

      loadApplications()
    }

    checkAuth()
  }, [router])

  const loadApplications = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch("/api/banking-applications", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to load applications")

      const data = await response.json()
      setApplications(data.data || [])
      setFilteredApplications(data.data || [])
    } catch (error) {
      toast.error("Failed to load banking applications")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    if (bankFilter !== "all") {
      filtered = filtered.filter((app) => app.bank_name === bankFilter)
    }

    setFilteredApplications(filtered)
  }, [searchTerm, statusFilter, bankFilter, applications])

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    setIsUpdating(true)
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch(`/api/banking-applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      })

      if (!response.ok) throw new Error("Failed to update application")

      toast.success("Application updated successfully")
      setIsDetailsOpen(false)
      loadApplications()
    } catch (error) {
      toast.error("Failed to update application")
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getBankColor = (bankName: string) => {
    switch (bankName) {
      case "Airwallex":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Sunrate":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "Aspire":
        return "bg-teal-100 text-teal-700 border-teal-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    airwallex: applications.filter((a) => a.bank_name === "Airwallex").length,
    sunrate: applications.filter((a) => a.bank_name === "Sunrate").length,
    aspire: applications.filter((a) => a.bank_name === "Aspire").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Banking Applications</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">Manage client banking account applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-700">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-700">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-700">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Airwallex
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-900">{stats.airwallex}</div>
            <p className="text-xs text-blue-700 mt-1">applications</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Sunrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-purple-900">{stats.sunrate}</div>
            <p className="text-xs text-purple-700 mt-1">applications</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-900 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Aspire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-teal-900">{stats.aspire}</div>
            <p className="text-xs text-teal-700 mt-1">applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, business, company, email, or bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger>
                  <Landmark className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  <SelectItem value="Airwallex">Airwallex</SelectItem>
                  <SelectItem value="Sunrate">Sunrate</SelectItem>
                  <SelectItem value="Aspire">Aspire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Applications ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Landmark className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">No banking applications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-[#880000] hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{app.full_name}</p>
                        <p className="text-xs text-slate-600">{app.business_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-2">
                      {app.company_name && (
                        <>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                            <Building2 className="w-3 h-3" />
                            <span className="font-medium">Company:</span> {app.company_name}
                          </span>
                          {app.company_state && (
                            <span className="bg-slate-100 px-2 py-1 rounded">
                              <span className="font-medium">State:</span> {app.company_state}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <Badge className={getBankColor(app.bank_name)}>
                        <Landmark className="h-3 w-3 mr-1" />
                        {app.bank_name}
                      </Badge>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Email:</span> {app.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Revenue:</span> ${app.expected_monthly_revenue}
                      </span>
                      <span>•</span>
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge className={getStatusColor(app.status)}>
                      {getStatusIcon(app.status)}
                      <span className="ml-1 capitalize">{app.status}</span>
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#880000] hover:bg-red-50"
                      onClick={() => {
                        setSelectedApplication(app)
                        setAdminNotes(app.admin_notes || "")
                        setIsDetailsOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 mt-4">
              {selectedApplication.company_name && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#880000]" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-600 text-xs">Company Name</Label>
                      <p className="text-slate-900 font-medium">{selectedApplication.company_name}</p>
                    </div>
                    {selectedApplication.company_state && (
                      <div>
                        <Label className="text-slate-600 text-xs">State</Label>
                        <p className="text-slate-900 font-medium">{selectedApplication.company_state}</p>
                      </div>
                    )}
                    {selectedApplication.company_package && (
                      <div>
                        <Label className="text-slate-600 text-xs">Package</Label>
                        <p className="text-slate-900 font-medium capitalize">{selectedApplication.company_package}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-600">Bank Name</Label>
                  <Badge className={getBankColor(selectedApplication.bank_name)}>
                    <Landmark className="h-3 w-3 mr-1" />
                    {selectedApplication.bank_name}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-600">Status</Label>
                  <Badge className={getStatusColor(selectedApplication.status)}>
                    {getStatusIcon(selectedApplication.status)}
                    <span className="ml-1 capitalize">{selectedApplication.status}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-600">Full Name</Label>
                  <p className="text-slate-900 font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Email</Label>
                  <p className="text-slate-900 font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Phone</Label>
                  <p className="text-slate-900 font-medium">{selectedApplication.phone}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Business Name</Label>
                  <p className="text-slate-900 font-medium">{selectedApplication.business_name}</p>
                </div>
                <div>
                  <Label className="text-slate-600">EIN</Label>
                  <p className="text-slate-900 font-medium">{selectedApplication.ein}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Expected Revenue</Label>
                  <p className="text-slate-900 font-medium">${selectedApplication.expected_monthly_revenue}/month</p>
                </div>
                <div>
                  <Label className="text-slate-600">Funding Source</Label>
                  <p className="text-slate-900 font-medium capitalize">
                    {selectedApplication.funding_source?.replace("-", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-600">Submitted Date</Label>
                  <p className="text-slate-900 font-medium">
                    {new Date(selectedApplication.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-slate-600">Business Description</Label>
                <p className="text-slate-900 mt-1">{selectedApplication.business_description}</p>
              </div>

              {selectedApplication.additional_notes && (
                <div>
                  <Label className="text-slate-600">Additional Notes</Label>
                  <p className="text-slate-900 mt-1">{selectedApplication.additional_notes}</p>
                </div>
              )}

              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this application..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                {selectedApplication.status !== "rejected" && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedApplication.id, "rejected")}
                    disabled={isUpdating}
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                )}
                {selectedApplication.status !== "approved" && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedApplication.id, "approved")}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#660000] hover:to-[#cc0a10]"
                  >
                    {isUpdating ? "Updating..." : "Approve"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
