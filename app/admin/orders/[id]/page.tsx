"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  ArrowLeft,
  Package,
  User,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Hash,
  UserCheck,
  Home,
  MapPin,
  Receipt,
  Calendar,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/use-auth-guard"

const getDisplayValue = (value: any, defaultValue = "N/A"): string => {
  if (value === null || value === undefined || value === "") return defaultValue
  return String(value)
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({ requireAdmin: true })

  const [order, setOrder] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadOrderData()
    }
  }, [authLoading, isAuthenticated, params.id])

  const loadOrderData = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to load order")

      const result = await response.json()
      setOrder(result.data)
      setCompany(result.data.company)
      setCustomer(result.data.customer)
    } catch (error) {
      console.error("Error loading order:", error)
      setError(error instanceof Error ? error.message : "Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-4">{error || "The order doesn't exist."}</p>
          <Button onClick={() => router.push("/admin/orders")} className="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />
      case "processing":
        return <Clock className="w-4 h-4" />
      case "pending":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/admin/orders")} className="h-10 w-10 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
            <p className="text-sm text-slate-500 mt-1">Order ID: {order.id}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1.5 px-3 py-1.5 text-sm`}>
          {getStatusIcon(order.status)}
          {order.status}
        </Badge>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Package</p>
                <p className="text-lg font-semibold text-slate-900">
                  {company?.packageType || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Receipt className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="text-lg font-semibold text-slate-900">
                  ${(order?.pricing?.total || order?.amount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Business</p>
                <p className="text-lg font-semibold text-slate-900 truncate max-w-[150px]">
                  {company?.name || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Order Date</p>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons with Drawers */}
      <div className="flex flex-wrap gap-3">
        {/* Customer Details Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="gap-2">
              <User className="w-4 h-4" />
              Customer Details
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Customer Information</DrawerTitle>
              <DrawerDescription>Complete customer details for this order</DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 overflow-auto">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Name</p>
                <p className="text-base text-slate-900">{getDisplayValue(customer?.name)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="text-base text-slate-900">{getDisplayValue(customer?.email)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Phone</p>
                <p className="text-base text-slate-900">{getDisplayValue(customer?.phone)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Customer ID</p>
                <p className="text-base text-slate-900 font-mono">{getDisplayValue(customer?.id)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Joined Date</p>
                <p className="text-base text-slate-900">
                  {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Business Details Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Building2 className="w-4 h-4" />
              Business Details
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Business Information</DrawerTitle>
              <DrawerDescription>Complete business details and formation information</DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 overflow-auto">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Business Name</p>
                <p className="text-base font-semibold text-slate-900">{getDisplayValue(company?.name)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">State</p>
                <p className="text-base text-slate-900">{getDisplayValue(company?.state)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Business Category</p>
                <p className="text-base text-slate-900">{getDisplayValue(company?.businessCategory)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Package Type</p>
                <p className="text-base text-slate-900">{getDisplayValue(company?.packageType)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">EIN</p>
                <p className="text-base text-slate-900 font-mono">{getDisplayValue(company?.ein)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Business ID</p>
                <p className="text-base text-slate-900 font-mono">{getDisplayValue(company?.businessId)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Business Description</p>
                <p className="text-base text-slate-900">{getDisplayValue(company?.businessDescription)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Website</p>
                <p className="text-base text-slate-900">{getDisplayValue(company?.businessWebsite)}</p>
              </div>
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Registered Agent Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Registered Agent
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Registered Agent Details</DrawerTitle>
              <DrawerDescription>Assigned registered agent information</DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 overflow-auto">
              {company?.registeredAgent ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Agent Name</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.registeredAgent.name)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Agent Address</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.registeredAgent.address)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">City</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.registeredAgent.city)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">State</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.registeredAgent.state)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">ZIP Code</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.registeredAgent.zipCode)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Service Status</p>
                    <Badge className={getStatusColor(company.registeredAgent.status || "pending")}>
                      {company.registeredAgent.status || "Not Set"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No registered agent assigned yet</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Mailing Address Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="gap-2">
              <MapPin className="w-4 h-4" />
              Mailing Address
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Mailing Address</DrawerTitle>
              <DrawerDescription>Business mailing address details</DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 overflow-auto">
              {company?.mailingAddress ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Street Address</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.mailingAddress.street)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">City</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.mailingAddress.city)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">State</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.mailingAddress.state)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">ZIP Code</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.mailingAddress.zipCode)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Country</p>
                    <p className="text-base text-slate-900">{getDisplayValue(company.mailingAddress.country)}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No mailing address provided</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Notes Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Order Notes</DrawerTitle>
              <DrawerDescription>Internal notes and comments for this order</DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 overflow-auto max-h-[70vh]">
              {order?.notes && order.notes.length > 0 ? (
                <div className="space-y-3">
                  {order.notes.map((note: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">{note.author || "Admin"}</p>
                        <p className="text-xs text-slate-500">
                          {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Recently"}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700">{note.content || note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No notes added yet</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Payment Details Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Receipt className="w-4 h-4" />
              Payment Details
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Payment Information</DrawerTitle>
              <DrawerDescription>Complete payment and pricing breakdown</DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 overflow-auto">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Payment Status</p>
                <Badge className={getStatusColor(order?.paymentInfo?.status || "pending")}>
                  {order?.paymentInfo?.status || "Pending"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Payment Method</p>
                <p className="text-base text-slate-900">{getDisplayValue(order?.paymentInfo?.method)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Package Price</p>
                <p className="text-base text-slate-900">
                  ${(order?.pricing?.packagePrice || 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">State Filing Fee</p>
                <p className="text-base text-slate-900">
                  ${(order?.pricing?.stateFilingFee || 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Add-ons Total</p>
                <p className="text-base text-slate-900">
                  ${(order?.pricing?.addonsTotal || 0).toFixed(2)}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-slate-900">Total Amount</p>
                  <p className="text-2xl font-bold text-[#880000]">
                    ${(order?.pricing?.total || order?.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {order?.selectedAddons && order.selectedAddons.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-slate-500 mb-3">Selected Add-ons</p>
                  <div className="space-y-2">
                    {order.selectedAddons.map((addon: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <p className="text-sm text-slate-900">{addon.name}</p>
                        <p className="text-sm font-medium text-slate-900">${addon.price?.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Order Status</p>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Created Date</p>
              <p className="text-base font-medium text-slate-900">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Last Updated</p>
              <p className="text-base font-medium text-slate-900">
                {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
