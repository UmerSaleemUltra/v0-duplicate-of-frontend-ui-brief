"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  User,
  Users,
  FileText,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Hash,
  ExternalLink,
  Trash2,
  Eye,
} from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"

interface CompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  passportDocuments?: any[]
  orderDate?: string
  showOwnerDetails?: boolean
  order?: any
}

export function CompanyModal({
  open,
  onOpenChange,
  companyId,
  passportDocuments: propPassportDocuments,
  orderDate: propOrderDate,
  showOwnerDetails = false,
  order: propOrder,
}: CompanyModalProps) {
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [order, setOrder] = useState<any>(propOrder || null)
  const [passportUrls, setPassportUrls] = useState<string[]>([])
  const [passportDocuments, setPassportDocuments] = useState<any[]>(propPassportDocuments || [])

  useEffect(() => {
    if (open && companyId) {
      if (!companyId || companyId === "undefined" || companyId === "null") {
        setCompany(null)
        setLoading(false)
        return
      }

      loadCompanyData()
    }
  }, [open, companyId])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      const token = authService.getToken()
      if (!token) {
        toast({ title: "Error", description: "Authentication required", variant: "destructive" })
        setLoading(false)
        return
      }

      if (!companyId || companyId === "undefined" || companyId === "null") {
        setCompany(null)
        setLoading(false)
        return
      }

      // Fetch company data
      const companyResponse = await ApiClient.companies.getById(companyId, token)
      const companyData = companyResponse.data

      if (!companyData?.id) {
        setCompany(null)
        setLoading(false)
        toast({ title: "Error", description: "Company not found", variant: "destructive" })
        return
      }

      setCompany(companyData)

      // Fetch user and order data in parallel
      const fetchPromises = []

      if (companyData.userId) {
        fetchPromises.push(
          ApiClient.users
            .getById(companyData.userId, token)
            .then((response) => setUser(response.data))
            .catch(() => setUser(null)),
        )
      }

      fetchPromises.push(
        fetch(`/api/orders?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((response) => {
            const companyOrder = response.data?.[0] || null
            setOrder(companyOrder)
          })
          .catch(() => setOrder(null)),
      )

      await Promise.all(fetchPromises)
    } catch (error) {
      console.error("Error loading company data:", error)
      toast({ title: "Error", description: "Failed to load company data", variant: "destructive" })
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: any) => {
    if (typeof address === "string") return address
    if (!address) return "Not provided"
    const parts = [address.street, address.city, address.state, address.zip].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : "Not provided"
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleDeletePassport = async (passportId: string) => {
    try {
      const token = authService.getToken()
      if (!token) {
        toast({ title: "Error", description: "Authentication required", variant: "destructive" })
        return
      }

      await ApiClient.passports.delete(passportId, token)

      toast({ title: "Success", description: "Passport deleted successfully" })

      // Refetch passports
      const passportsResponse = await fetch(`/api/passports?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (passportsResponse.ok) {
        const passportsResult = await passportsResponse.json()
        const passportsData = passportsResult.data || []
        if (passportsData && Array.isArray(passportsData) && passportsData.length > 0) {
          const urls = passportsData.filter((doc: any) => doc && doc.fileUrl).map((doc: any) => doc.fileUrl)
          setPassportUrls(urls)
          setPassportDocuments(passportsData)
        } else {
          setPassportUrls([])
          setPassportDocuments([])
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete passport", variant: "destructive" })
      loadCompanyData()
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!company) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-12">
            <p className="text-slate-600">Company not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">
          View detailed information about the company including business details, owners, and order information.
        </DialogDescription>

        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {company.name || "Unnamed Company"}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {company.type && <Badge variant="outline">{company.type}</Badge>}
            {company.state && <Badge variant="outline">{company.state}</Badge>}
            {company.status && (
              <Badge variant={company.status === "active" ? "default" : "secondary"} className="capitalize">
                {company.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Business Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Company Name</p>
                  <p className="font-medium">{company.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Entity Type</p>
                  <p className="font-medium">{company.type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">State</p>
                  <p className="font-medium">{company.state || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <Badge variant="outline" className="capitalize">
                    {company.status || "unknown"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Package Type</p>
                  <p className="font-medium capitalize">{order?.packageType || company.packageType || "Standard"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Order Date</p>
                  <p className="font-medium">
                    {propOrderDate
                      ? new Date(propOrderDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : order?.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : company.createdAt
                          ? new Date(company.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <p className="text-sm text-slate-600 mb-2">Business Address</p>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-slate-400" />
                  {formatAddress(company.address)}
                </p>
              </div>

              {company.businessCategory && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-slate-600">Business Category</p>
                    <p className="font-medium">{company.businessCategory}</p>
                  </div>
                </>
              )}

              {company.businessDescription && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-slate-600">Business Description</p>
                    <p className="text-sm">{company.businessDescription}</p>
                  </div>
                </>
              )}

              {company.businessWebsite && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-slate-600">Website</p>
                    <a
                      href={company.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {company.businessWebsite}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tax IDs & Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax IDs & Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">EIN</p>
                  <p className="font-mono font-medium">{company.ein || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">ITIN</p>
                  <p className="font-mono font-medium">{company.itin || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Business ID</p>
                  <p className="font-mono font-medium">{company.businessId || "Not assigned"}</p>
                </div>
                {company.taxClassification && (
                  <div>
                    <p className="text-sm text-slate-600">Tax Classification</p>
                    <p className="font-medium">{company.taxClassification}</p>
                  </div>
                )}
              </div>

              {company.formationDate && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Formation Date</p>
                      <p className="font-medium">
                        {new Date(company.formationDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {company.irsFilingDate && (
                      <div>
                        <p className="text-sm text-slate-600">IRS Filing Date</p>
                        <p className="font-medium">
                          {new Date(company.irsFilingDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {company.annualReportFilingDate && (
                      <div>
                        <p className="text-sm text-slate-600">Annual Report Filing Date</p>
                        <p className="font-medium">
                          {new Date(company.annualReportFilingDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Registered Agent */}
          {company.registeredAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registered Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-medium">{company.registeredAgent.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Company</p>
                    <p className="font-medium">{company.registeredAgent.company || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Address</p>
                    <p className="font-medium">
                      {formatAddress({
                        street: company.registeredAgent.address,
                        city: company.registeredAgent.city,
                        state: company.registeredAgent.state,
                        zip: company.registeredAgent.zip,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge variant="outline">{company.registeredAgent.status || "Active"}</Badge>
                  </div>
                </div>

                {(company.registeredAgent.phone || company.registeredAgent.email || company.registeredAgent.servicePeriod || company.registeredAgent.expiryDate) && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {company.registeredAgent.phone && (
                        <div>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone
                          </p>
                          <p className="font-medium">{company.registeredAgent.phone}</p>
                        </div>
                      )}
                      {company.registeredAgent.email && (
                        <div>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </p>
                          <p className="font-medium">{company.registeredAgent.email}</p>
                        </div>
                      )}
                      {company.registeredAgent.servicePeriod && (
                        <div>
                          <p className="text-sm text-slate-600">Service Period</p>
                          <p className="font-medium">{company.registeredAgent.servicePeriod}</p>
                        </div>
                      )}
                      {company.registeredAgent.expiryDate && (
                        <div>
                          <p className="text-sm text-slate-600">Expiry Date</p>
                          <p className="font-medium">
                            {new Date(company.registeredAgent.expiryDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Business Address */}
          {company.businessAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Business Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {company.businessAddress.companyName && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Company Name</p>
                      <p className="font-medium">{company.businessAddress.companyName}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">Address</p>
                    <p className="font-medium">
                      {formatAddress({
                        street: company.businessAddress.street,
                        city: company.businessAddress.city,
                        state: company.businessAddress.state,
                        zip: company.businessAddress.zip,
                      })}
                    </p>
                  </div>
                  {company.businessAddress.expiryDate && (
                    <div>
                      <p className="text-sm text-slate-600">Expiry Date</p>
                      <p className="font-medium">
                        {new Date(company.businessAddress.expiryDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {company.businessAddress.status && (
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <Badge variant="outline">{company.businessAddress.status}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Information */}
          {(company.companyStatus || company.registeredAgentStatus || company.businessAddressStatus || company.serviceStatus) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {company.companyStatus && (
                    <div>
                      <p className="text-sm text-slate-600">Company Status</p>
                      <Badge variant="outline" className="capitalize">
                        {company.companyStatus}
                      </Badge>
                    </div>
                  )}
                  {company.registeredAgentStatus && (
                    <div>
                      <p className="text-sm text-slate-600">Registered Agent Status</p>
                      <Badge variant="outline" className="capitalize">
                        {company.registeredAgentStatus}
                      </Badge>
                    </div>
                  )}
                  {company.businessAddressStatus && (
                    <div>
                      <p className="text-sm text-slate-600">Business Address Status</p>
                      <Badge variant="outline" className="capitalize">
                        {company.businessAddressStatus}
                      </Badge>
                    </div>
                  )}
                  {company.serviceStatus && (
                    <div>
                      <p className="text-sm text-slate-600">Service Status</p>
                      <Badge variant="outline" className="capitalize">
                        {company.serviceStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mailing Address */}
          {company.mailingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mailing Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-slate-400" />
                  {formatAddress(company.mailingAddress)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {company.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Details Section */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Status & Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Order ID</p>
                    <p className="font-mono font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Order Status</p>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "default"
                          : order.status === "processing"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {order.status || "unknown"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Customer Name</p>
                    <p className="font-medium">{order.customerName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">User ID</p>
                    <p className="font-mono text-sm">{order.userId}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Pricing Breakdown */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Pricing Breakdown</p>
                  <div className="grid grid-cols-2 gap-3">
                    {order.pricing?.packagePrice && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium mb-1">Package Price</p>
                        <p className="text-base font-bold text-slate-900">${order.pricing.packagePrice.toFixed(2)}</p>
                      </div>
                    )}
                    {order.pricing?.stateFilingFee && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium mb-1">Filing Fee</p>
                        <p className="text-base font-bold text-slate-900">${order.pricing.stateFilingFee.toFixed(2)}</p>
                      </div>
                    )}
                    {order.pricing?.addonsTotal && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-700 font-medium mb-1">Add-ons Total</p>
                        <p className="text-base font-bold text-blue-900">${order.pricing.addonsTotal.toFixed(2)}</p>
                      </div>
                    )}
                    {order.pricing?.total && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs text-green-700 font-medium mb-1">Order Total</p>
                        <p className="text-base font-bold text-green-900">${order.pricing.total.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchased Addons */}
                {order.purchasedAddons && order.purchasedAddons.length > 0 && (
                  <div>
                    <Separator className="my-3" />
                    <p className="text-sm font-semibold text-slate-900 mb-3">Purchased Add-ons ({order.purchasedAddons.length})</p>
                    <div className="space-y-2">
                      {order.purchasedAddons.map((addon: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{addon.name}</p>
                              <p className="text-xs text-slate-600 mt-1">Price: <span className="font-semibold text-slate-900">${addon.price?.toFixed(2) || '0.00'}</span></p>
                            </div>
                          </div>
                          {addon.paymentDetails && (
                            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                              {addon.paymentDetails.paymentMethod && (
                                <p>Payment: <span className="font-medium capitalize">{addon.paymentDetails.paymentMethod}</span></p>
                              )}
                              {addon.paymentDetails.createdAt && (
                                <p>Purchased: <span className="font-medium">{new Date(addon.paymentDetails.createdAt).toLocaleDateString()}</span></p>
                              )}
                              {addon.paymentDetails.phoneNumber && (
                                <p>Phone: <span className="font-medium">{addon.paymentDetails.phoneNumber}</span></p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* User Information Section */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Full Name</p>
                    <p className="font-medium">{user.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Role</p>
                    <Badge variant="outline" className="capitalize">
                      {user.role || "user"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium">{user.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="font-medium">{user.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Joined
                    </p>
                    <p className="font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owners/Members Section */}
          {showOwnerDetails && company.members && company.members.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Owners & Members
              </h3>
              {company.members.map((member: any, index: number) => {
                const fullName =
                  member.name ||
                  [member.firstName, member.middleName, member.lastName].filter(Boolean).join(" ") ||
                  "N/A"

                // Extract passport filename
                const passport = member.passports?.[0] || {}
                const passportFileName = passport.fileName
                  ? passport.fileName.split("/").pop()?.split("-").slice(1).join("-") || passport.fileName
                  : null

                return (
                  <Card key={index} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{fullName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Address</p>
                        <p className="font-medium text-sm">
                          {formatAddress({
                            street: member.address,
                            city: member.city,
                            state: member.state,
                            zip: member.zip,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Responsible Person</p>
                        <Badge variant={member.isResponsiblePerson ? "default" : "secondary"} className="text-xs">
                          {member.isResponsiblePerson ? "Yes" : "No"}
                        </Badge>
                      </div>

                      {/* Passport Document */}
                      {passportFileName && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-sm text-slate-600 mb-2">Passport Document</p>
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm text-blue-900 font-medium truncate">{passportFileName}</span>
                            </div>
                            {passport.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0"
                                onClick={() => window.open(passport.url, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Order & Checkout Information */}
          {order && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Order & Checkout Information
              </h3>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Order ID</p>
                      <p className="font-medium">{order.id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Order Status</p>
                      <Badge variant="outline" className="capitalize">
                        {order.status || "pending"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Order Date</p>
                      <p className="font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Package Type</p>
                      <p className="font-medium capitalize">{order.packageType || "Standard"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {order.pricing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pricing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Package Price</span>
                        <span className="font-medium">${order.pricing.packagePrice || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">State Filing Fee</span>
                        <span className="font-medium">${order.pricing.stateFilingFee || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Add-ons Total</span>
                        <span className="font-medium">${order.pricing.addonsTotal || 0}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total Amount</span>
                        <span>${order.pricing.total || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.paymentInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Payment Method</p>
                        <p className="font-medium capitalize">{order.paymentInfo.method?.replace("_", " ") || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Payment Status</p>
                        <Badge variant="outline" className="capitalize">
                          {order.paymentInfo.status || "pending"}
                        </Badge>
                      </div>
                      {order.paymentInfo.transactionId && (
                        <div>
                          <p className="text-sm text-slate-600">Transaction ID</p>
                          <p className="font-mono text-xs">{order.paymentInfo.transactionId}</p>
                        </div>
                      )}
                      {order.paymentInfo.date && (
                        <div>
                          <p className="text-sm text-slate-600">Payment Date</p>
                          <p className="font-medium">{new Date(order.paymentInfo.date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {order.paymentInfo.terms && (
                        <div className="col-span-2">
                          <p className="text-sm text-slate-600">Payment Terms</p>
                          <p className="text-sm">{order.paymentInfo.terms}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.selectedAddons && order.selectedAddons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Add-ons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.selectedAddons.map((addon: any, index: number) => (
                        <div key={index} className="border rounded p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{addon.name || "Unknown Add-on"}</span>
                            <span className="text-slate-600 font-medium">${addon.price || 0}</span>
                          </div>
                          {addon.paymentDetails && (
                            <div className="bg-slate-50 p-2 rounded text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-700">
                                  {addon.paymentDetails.paymentMethod === "whatsapp" ? "WhatsApp Payment" : "Payment"}
                                </span>
                              </div>
                              {addon.paymentDetails.phoneNumber && (
                                <p className="text-slate-600 ml-6">Phone: {addon.paymentDetails.phoneNumber}</p>
                              )}
                              {addon.paymentDetails.receiptUrl && (
                                <a
                                  href={addon.paymentDetails.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline ml-6 flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Receipt
                                </a>
                              )}
                              <p className="text-slate-600 ml-6">
                                Status:{" "}
                                <Badge variant={addon.paymentDetails.paymentStatus === "verified" ? "default" : "secondary"}>
                                  {addon.paymentDetails.paymentStatus === "pending_verification"
                                    ? "Pending Verification"
                                    : addon.paymentDetails.paymentStatus === "verified"
                                      ? "Verified"
                                      : addon.paymentDetails.paymentStatus}
                                </Badge>
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Passport Documents Section */}
          {passportDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Passport Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {passportDocuments.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {doc.fileName}
                      </a>
                      <Button variant="ghost" onClick={() => handleDeletePassport(doc.id)} className="ml-auto">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
