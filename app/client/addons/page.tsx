"use client"

import { useState, useEffect } from "react"
import { Package, DollarSign, Check, ShoppingCart, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addonStorage, type Addon, companyStorage, orderStorage } from "@/lib/local-storage"
import { ClientShell } from "@/components/client/client-shell"
import { useRouter } from "next/navigation"
import { useSelectedCompany } from "@/lib/company-context"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { Spinner } from "@/components/ui/spinner"

export default function ClientAddonsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard()
  const router = useRouter()
  const { selectedCompanyId } = useSelectedCompany()
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [hasAdvancedPackage, setHasAdvancedPackage] = useState(false)

  const loadAddons = () => {
    const activeAddons = addonStorage.getActive()
    setAddons(activeAddons)
  }

  const checkPackageType = () => {
    if (selectedCompanyId) {
      const company = companyStorage.getById(selectedCompanyId)
      if (company) {
        const orders = orderStorage.getAll().filter((o) => o.companyId === selectedCompanyId)
        if (orders.length > 0) {
          const hasAdvanced = orders.some(
            (order) =>
              order.packageType?.toLowerCase() === "advanced" || order.service?.toLowerCase().includes("advanced"),
          )
          setHasAdvancedPackage(hasAdvanced)
        }
      }
    }
  }

  const categories = [
    { value: "all", label: "All Addons" },
    { value: "compliance", label: "Compliance" },
    { value: "tax", label: "Tax" },
    { value: "legal", label: "Legal" },
    { value: "document", label: "Document" },
    { value: "other", label: "Other" },
  ]

  const filteredAddons =
    selectedCategory === "all" ? addons : addons.filter((addon) => addon.category === selectedCategory)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      compliance: "bg-blue-100 text-blue-700 border-blue-200",
      tax: "bg-green-100 text-green-700 border-green-200",
      legal: "bg-purple-100 text-purple-700 border-purple-200",
      document: "bg-orange-100 text-orange-700 border-orange-200",
      other: "bg-slate-100 text-slate-700 border-slate-200",
    }
    return colors[category] || colors.other
  }

  const isResellerCertificate = (addonName: string) => {
    return addonName.toLowerCase().includes("reseller") || addonName.toLowerCase().includes("resale")
  }

  const isAddonDisabled = (addon: Addon) => {
    return hasAdvancedPackage && isResellerCertificate(addon.name)
  }

  const handleBuyAddon = (addonId: string, addon: Addon) => {
    if (isAddonDisabled(addon)) {
      return
    }
    router.push(`/client/addons/checkout?addonId=${addonId}`)
  }

  useEffect(() => {
    if (isAuthenticated && selectedCompanyId) {
      loadAddons()
      checkPackageType()
    }
  }, [isAuthenticated, selectedCompanyId])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ClientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Available Addons</h1>
          <p className="text-slate-600 mt-1">Enhance your business with additional services</p>
        </div>

        {hasAdvancedPackage && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              You have the Advanced package which includes the Reseller Certificate. Some addons may not be available.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value ? "bg-gradient-to-r from-[#880000] to-[#ff0d13]" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAddons.map((addon) => {
            const disabled = isAddonDisabled(addon)
            return (
              <Card key={addon.id} className={`hover:shadow-lg transition-shadow ${disabled ? "opacity-60" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <CardDescription className="mt-2">{addon.description}</CardDescription>
                    </div>
                    <Badge className={getCategoryColor(addon.category)}>{addon.category}</Badge>
                  </div>
                  {disabled && (
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                      Included in Your Package
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-slate-500" />
                      <span className="text-3xl font-bold text-slate-900">${addon.price}</span>
                      <span className="text-sm text-slate-500">one-time</span>
                    </div>

                    {addon.features && addon.features.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-medium text-slate-700">What's included:</p>
                        <ul className="space-y-2">
                          {addon.features.map((feature, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                              <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => handleBuyAddon(addon.id, addon)}
                      disabled={disabled}
                      className={`w-full mt-4 gap-2 ${disabled ? "cursor-not-allowed" : "bg-gradient-to-r from-[#880000] to-[#ff0d13]"}`}
                    >
                      {disabled ? (
                        <>
                          <Check className="w-4 h-4" />
                          Already Included
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Buy Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredAddons.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-600 text-center">
                  {selectedCategory === "all"
                    ? "No addons available at the moment. Check back later!"
                    : `No ${selectedCategory} addons available.`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ClientShell>
  )
}
