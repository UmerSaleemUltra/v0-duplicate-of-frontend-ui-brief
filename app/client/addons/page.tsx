"use client"

import { useState, useEffect } from "react"
import { Package, DollarSign, Check, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Addon } from "@/lib/local-storage"
import { ClientShell } from "@/components/client/client-shell"
import { useRouter } from "next/navigation"
import { useSelectedCompany } from "@/lib/company-context"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { AddonsSkeleton } from "@/components/client/addons-skeleton"

interface AddonWithBilling extends Addon {
  billingType?: "one_time" | "recurring_monthly" | "recurring_quarterly" | "recurring_annual" | "custom"
  customDuration?: string
}

export default function ClientAddonsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard()
  const router = useRouter()
  const { selectedCompanyId } = useSelectedCompany()
  const [addons, setAddons] = useState<AddonWithBilling[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [hasAdvancePackage, setHasAdvancePackage] = useState(false)
  const [isLoadingAddons, setIsLoadingAddons] = useState(true)

  const loadAddons = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        setIsLoadingAddons(false)
        return
      }

      const response = await fetch("/api/addons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const addonsList = data.data?.addons || data.addons || []
        setAddons(addonsList)
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoadingAddons(false)
    }
  }

  const checkPackageType = async () => {
    if (selectedCompanyId) {
      try {
        const token = authService.getToken()
        if (!token) return

        const companyResponse = await ApiClient.companies.getById(selectedCompanyId, token)
        const company = companyResponse.data

        if (company) {
          const hasAdvance =
            company.packageType?.toLowerCase() === "advanced" ||
            company.items?.some(
              (item: any) => item.category === "package" && item.name?.toLowerCase().includes("advanced"),
            )
          setHasAdvancePackage(hasAdvance)
        }
      } catch (error) {
        // Error handled silently
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

  const isAddonDisabled = (addon: AddonWithBilling) => {
    return hasAdvancePackage && isResellerCertificate(addon.name)
  }

  const getBillingTypeLabel = (addon: AddonWithBilling) => {
    if (addon.billingType === "one_time") return "one-time"
    if (addon.billingType === "recurring_monthly") return "monthly"
    if (addon.billingType === "recurring_quarterly") return "quarterly"
    if (addon.billingType === "recurring_annual") return "annually"
    if (addon.billingType === "custom") return `every ${addon.customDuration} days`
    return "one-time"
  }

  const handleBuyAddon = (addonId: string, addon: AddonWithBilling) => {
    if (isAddonDisabled(addon)) {
      return
    }
    router.push(`/client/addons/checkout?addonId=${addonId}`)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAddons()
      if (selectedCompanyId) {
        checkPackageType()
      }
    }
  }, [isAuthenticated, selectedCompanyId])

  if (authLoading || isLoadingAddons) {
    return (
      <ClientShell>
        <AddonsSkeleton />
      </ClientShell>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ClientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Available Addons</h1>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1">Enhance your business with additional services</p>
        </div>

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
                    <span className="text-sm text-slate-500">{getBillingTypeLabel(addon)}</span>
                  </div>

                    {addon.features && Array.isArray(addon.features) && addon.features.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-medium text-slate-700">What's included:</p>
                        <ul className="space-y-2">
                          {addon.features.map((feature, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                              <Check className="w-4 h-4 text-[#ff0d13] flex-shrink-0 mt-0.5 cursor-pointer" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => handleBuyAddon(addon.id, addon)}
                      disabled={disabled}
                      className={`w-full mt-4 gap-2 cursor-pointer ${disabled ? "cursor-not-allowed" : "bg-gradient-to-r from-[#880000] to-[#ff0d13]"}`}
                    >
                      {disabled ? (
                        <>
                          <Check className="w-4 h-4 cursor-pointer" />
                          Already Included
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 cursor-pointer" />
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
