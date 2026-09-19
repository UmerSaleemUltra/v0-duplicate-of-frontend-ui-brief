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
}

export function CompanyModal({
  open,
  onOpenChange,
  companyId,
  passportDocuments: propPassportDocuments,
  orderDate: propOrderDate,
  showOwnerDetails = false,
}: CompanyModalProps) {
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
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
          {/* Customer Information Section */}
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
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Details Section */}
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
            </CardContent>
          </Card>

          {/* Business Information */}
          {(company.businessCategory || company.businessDescription || company.businessWebsite) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.businessCategory && (
                  <div>
                    <p className="text-sm text-slate-600">Business Category</p>
                    <p className="font-medium">{company.businessCategory}</p>
                  </div>
                )}

                {company.businessDescription && (
                  <>
                    {company.businessCategory && <Separator className="my-3" />}
                    <div>
                      <p className="text-sm text-slate-600">Business Description</p>
                      <p className="text-sm">{company.businessDescription}</p>
                    </div>
                  </>
                )}

                {company.businessWebsite && (
                  <>
                    {(company.businessCategory || company.businessDescription) && <Separator className="my-3" />}
                    <div>
                      <p className="text-sm text-slate-600">Business Website</p>
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
          )}

          {/* Registered Agent */}
          {company.registeredAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registered Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {company.registeredAgent.name && (
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-medium">{company.registeredAgent.name}</p>
                    </div>
                  )}
                  {(company.registeredAgent.address ||
                    company.registeredAgent.city ||
                    company.registeredAgent.state ||
                    company.registeredAgent.zip) && (
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
                  )}
                  {company.registeredAgent.status && (
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <Badge variant="outline" className="capitalize">
                        {company.registeredAgent.status}
                      </Badge>
                    </div>
                  )}
                  {company.registeredAgent.company && (
                    <div>
                      <p className="text-sm text-slate-600">Company</p>
                      <p className="font-medium">{company.registeredAgent.company}</p>
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
                <div className="grid grid-cols-2 gap-4">
                  {company.mailingAddress.name && (
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-medium">{company.mailingAddress.name}</p>
                    </div>
                  )}
                  {(company.mailingAddress.address ||
                    company.mailingAddress.city ||
                    company.mailingAddress.state ||
                    company.mailingAddress.zip) && (
                    <div>
                      <p className="text-sm text-slate-600">Address</p>
                      <p className="font-medium">
                        {formatAddress({
                          street: company.mailingAddress.address,
                          city: company.mailingAddress.city,
                          state: company.mailingAddress.state,
                          zip: company.mailingAddress.zip,
                        })}
                      </p>
                    </div>
                  )}
                  {company.mailingAddress.status && (
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <Badge variant="outline" className="capitalize">
                        {company.mailingAddress.status}
                      </Badge>
                    </div>
                  )}
                  {company.mailingAddress.company && (
                    <div>
                      <p className="text-sm text-slate-600">Company</p>
                      <p className="font-medium">{company.mailingAddress.company}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax IDs & Registration */}
          {(company.taxClassification ||
            company.itin ||
            company.businessId ||
            company.ein ||
            company.annualReportFilingDate ||
            company.formationDate ||
            company.irsFilingDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax IDs & Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {company.taxClassification && (
                    <div>
                      <p className="text-sm text-slate-600">Tax Classification</p>
                      <p className="font-medium capitalize">{company.taxClassification}</p>
                    </div>
                  )}
                  {company.itin && (
                    <div>
                      <p className="text-sm text-slate-600">ITIN/SSN</p>
                      <p className="font-mono font-medium">{company.itin}</p>
                    </div>
                  )}
                  {company.businessId && (
                    <div>
                      <p className="text-sm text-slate-600">Business ID</p>
                      <p className="font-mono font-medium">{company.businessId}</p>
                    </div>
                  )}
                  {company.ein && (
                    <div>
                      <p className="text-sm text-slate-600">EIN</p>
                      <p className="font-mono font-medium">{company.ein}</p>
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
                  {company.formationDate && (
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
                  )}
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
