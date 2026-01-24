"use client"

import { ClientShell } from "@/components/client/client-shell"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  CreditCard,
  Package,
  FileText,
  Download,
  Eye,
  Hash,
  ExternalLink,
  Users,
  Clock,
  Home,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ClientOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setLoading(true)
        const token = authService.getToken()

        if (!token) {
          router.push("/login")
          return
        }

        const response = await ApiClient.orders.getById(orderId, token)

        setOrder(response.data)
        setError(null)
      } catch (err) {
        setError("Failed to load order details")
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId, router])

  const handleDownloadPassport = async (passportId: string, fileName: string, fileUrl: string) => {
    try {
      if (!fileUrl) {
        toast({
          title: "Error",
          description: "Document URL is not available",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error("Failed to fetch passport file")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName || "document.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      })
    } catch (error) {
      console.error("[v0] Download error:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download passport document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewPassport = (fileUrl: string) => {
    if (!fileUrl) {
      toast({
        title: "Error",
        description: "Document URL is not available",
        variant: "destructive",
      })
      return
    }
    window.open(fileUrl, "_blank")
  }

  if (loading) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
            <p className="text-slate-600">Loading order details...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (error || !order) {
    return (
      <ClientShell>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <Button onClick={() => router.push("/client/dashboard")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </ClientShell>
    )
  }

  const pricing = order.pricing || {}
  const paymentInfo = order.paymentInfo || {}
  const company = order.company
  const user = order.user
  const passports = order.passportDocuments || []

  return (
    <ClientShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/client/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
              <p className="text-sm text-slate-600">Order ID: {order.id}</p>
            </div>
          </div>
          <Badge
            className={
              order.status === "completed"
                ? "bg-green-100 text-green-700 border-green-200"
                : order.status === "pending"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
            }
          >
            {order.status || "Processing"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Order Type</p>
                    <p className="font-semibold text-slate-900">{order.orderType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Package Type</p>
                    <p className="font-semibold text-slate-900">{order.packageType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">State</p>
                    <p className="font-semibold text-slate-900">{order.state || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Created At</p>
                    <p className="font-semibold text-slate-900">
                      {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            {company && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Company Name</p>
                    <p className="font-semibold text-slate-900">{company.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Entity Type</p>
                      <p className="font-semibold text-slate-900">{company.type || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">State</p>
                      <p className="font-semibold text-slate-900">{company.state || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <Badge className="bg-green-100 text-green-700 border-green-200 capitalize">
                        {company.status || "Active"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Package Type</p>
                      <p className="font-semibold text-slate-900 capitalize">{company.packageType || "N/A"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Tax IDs & Registration
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">EIN</p>
                        <p className="font-mono font-semibold text-slate-900">{company.ein || "Not assigned"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">ITIN</p>
                        <p className="font-mono font-semibold text-slate-900">{company.itin || "Not assigned"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Business ID</p>
                        <p className="font-mono font-semibold text-slate-900">{company.businessId || "Not assigned"}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {(company.businessCategory || company.businessDescription || company.businessWebsite) && (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-3">Business Details</p>
                        <div className="space-y-3">
                          {company.businessCategory && (
                            <div>
                              <p className="text-sm text-slate-500">Category</p>
                              <p className="font-semibold text-slate-900">{company.businessCategory}</p>
                            </div>
                          )}
                          {company.businessDescription && (
                            <div>
                              <p className="text-sm text-slate-500">Description</p>
                              <p className="text-sm text-slate-900">{company.businessDescription}</p>
                            </div>
                          )}
                          {company.businessWebsite && (
                            <div>
                              <p className="text-sm text-slate-500">Website</p>
                              <a
                                href={company.businessWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                              >
                                {company.businessWebsite}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {company.address && (
                    <>
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Business Address</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                          <p className="font-semibold text-slate-900">
                            {typeof company.address === "string"
                              ? company.address
                              : `${company.address.street || ""}, ${company.address.city || ""}, ${company.address.state || ""} ${company.address.zip || ""}`}
                          </p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {company.mailingAddress && (
                    <>
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Mailing Address</p>
                        <div className="flex items-start gap-2">
                          <Home className="w-4 h-4 text-slate-400 mt-1" />
                          <p className="font-semibold text-slate-900">
                            {typeof company.mailingAddress === "string"
                              ? company.mailingAddress
                              : `${company.mailingAddress.street || ""}, ${company.mailingAddress.city || ""}, ${company.mailingAddress.state || ""} ${company.mailingAddress.zip || ""}`}
                          </p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {company.members && company.members.length > 0 && (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Company Members/Owners ({company.members.length})
                        </p>
                        <div className="space-y-3">
                          {company.members.map((member: any, index: number) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {member.firstName} {member.middleName || ""} {member.lastName}
                                  </p>
                                  <p className="text-sm text-slate-600">{member.role || "Member"}</p>
                                </div>
                                {member.ownershipPercentage && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-lg font-semibold">
                                    {member.ownershipPercentage}%
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-slate-500">Email</p>
                                  <p className="text-slate-900">{member.email || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Phone</p>
                                  <p className="text-slate-900">{member.phone || "N/A"}</p>
                                </div>
                                {member.address && (
                                  <div className="col-span-2">
                                    <p className="text-slate-500">Address</p>
                                    <p className="text-slate-900">
                                      {typeof member.address === "string"
                                        ? member.address
                                        : `${member.address}, ${member.city || ""}, ${member.state || ""} ${member.zip || ""}`}
                                    </p>
                                  </div>
                                )}
                                {member.dateOfBirth && (
                                  <div>
                                    <p className="text-slate-500">Date of Birth</p>
                                    <p className="text-slate-900">{member.dateOfBirth}</p>
                                  </div>
                                )}
                                {member.isResponsiblePerson && (
                                  <div>
                                    <p className="text-slate-500">Responsible Person</p>
                                    <Badge className="bg-green-100 text-green-700 border-green-200">Yes</Badge>
                                  </div>
                                )}
                                {member.needsItin && (
                                  <div>
                                    <p className="text-slate-500">Needs ITIN</p>
                                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Yes</Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {company.registeredAgent && (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-3">Registered Agent</p>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-900">{company.registeredAgent.name}</p>
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                {company.registeredAgent.status || "Active"}
                              </Badge>
                            </div>
                            {company.registeredAgent.company && (
                              <p className="text-sm text-slate-600">{company.registeredAgent.company}</p>
                            )}
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-slate-900">{company.registeredAgent.address}</p>
                                {company.registeredAgent.city && (
                                  <p className="text-slate-600">
                                    {company.registeredAgent.city}, {company.registeredAgent.state}{" "}
                                    {company.registeredAgent.zip}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {(company.milestones || company.customMilestones) && (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Company Milestones
                        </p>
                        <div className="space-y-2">
                          {company.milestones &&
                            Object.entries(company.milestones).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium text-slate-900 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <Badge
                                  className={
                                    value === true || value === "completed"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }
                                >
                                  {value === true || value === "completed" ? "Completed" : value || "Pending"}
                                </Badge>
                              </div>
                            ))}
                          {company.customMilestones &&
                            company.customMilestones.map((milestone: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium text-slate-900">{milestone.name}</span>
                                <Badge
                                  className={
                                    milestone.completed
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }
                                >
                                  {milestone.completed ? "Completed" : "Pending"}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {company.purchasedAddons && company.purchasedAddons.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Purchased Add-ons
                      </p>
                      <div className="space-y-2">
                        {company.purchasedAddons.map((addon: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                              <span className="text-sm font-medium text-slate-900">{addon.name || addon}</span>
                              {addon.serviceId && (
                                <p className="text-xs text-slate-500">ID: {addon.serviceId}</p>
                              )}
                            </div>
                            {addon.price && (
                              <span className="text-sm font-semibold text-slate-900">${addon.price.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                        {order.pricing?.addonsTotal > 0 && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200 mt-3">
                            <span className="font-semibold text-slate-900">Total Add-ons</span>
                            <span className="font-bold text-blue-600">${order.pricing.addonsTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {passports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Passport Documents ({passports.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {passports.map((passport: any) => (
                      <div
                        key={passport.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {passport.memberName || "Member Document"}
                            </p>
                            <p className="text-sm text-slate-600 truncate">{passport.fileName || "passport.pdf"}</p>
                            {passport.fileSize && (
                              <p className="text-xs text-slate-500">{(passport.fileSize / 1024).toFixed(2)} KB</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {passport.fileUrl && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleViewPassport(passport.fileUrl)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDownloadPassport(
                                    passport.id,
                                    passport.fileName || "passport.pdf",
                                    passport.fileUrl,
                                  )
                                }
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Name</p>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-semibold text-slate-900">{user.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Package Price</span>
                    <span className="font-semibold text-slate-900">${(pricing.packagePrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">State Filing Fee</span>
                    <span className="font-semibold text-slate-900">${(pricing.stateFilingFee || 0).toFixed(2)}</span>
                  </div>
                  {pricing.addonsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Add-ons</span>
                      <span className="font-semibold text-slate-900">${(pricing.addonsTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
                      ${(pricing.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Payment Method</span>
                    <span className="font-semibold text-slate-900 capitalize">{paymentInfo.method || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Payment Status</span>
                    <Badge
                      className={
                        paymentInfo.status === "completed"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }
                    >
                      {paymentInfo.status || "pending"}
                    </Badge>
                  </div>
                  {paymentInfo.transactionId && (
                    <div className="text-sm">
                      <span className="text-slate-600">Transaction ID:</span>
                      <p className="font-mono text-xs text-slate-900 mt-1 break-all">{paymentInfo.transactionId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Add-ons */}
            {order.selectedAddons && order.selectedAddons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.selectedAddons.map((addon: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-900">{addon.name}</span>
                        <span className="text-sm font-semibold text-slate-900">${addon.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
