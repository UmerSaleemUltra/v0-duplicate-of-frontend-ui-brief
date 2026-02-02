"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Building2, MapPin, DollarSign, Package } from "lucide-react"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { authService } from "@/lib/auth"
import { ApiClient } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function CompaniesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard("admin")
  const [companies, setCompanies] = useState<any[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadCompanies()
    }
  }, [authLoading, isAuthenticated])

  // Filter companies based on search query
  useEffect(() => {
    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.type.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredCompanies(filtered)
  }, [searchQuery, companies])

  const loadCompanies = async () => {
    try {
      setIsLoading(true)
      const token = authService.getToken()
      if (!token) return

      // Call the companies API
      const response = await ApiClient.companies.getAll(token)

      if (response.success && Array.isArray(response.data)) {
        setCompanies(response.data)
        console.log(`[v0] Loaded ${response.data.length} companies`)
      } else {
        console.error("[v0] Invalid response format:", response)
      }
    } catch (error) {
      console.error("[v0] Error loading companies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      inactive: "bg-gray-100 text-gray-800",
    }
    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Companies</h1>
        <p className="text-gray-600">
          Total: <strong>{companies.length}</strong> companies
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by company name, state, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {company.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{company.type}</p>
                  </div>
                  <Badge className={getStatusColor(company.status)}>
                    {company.status || "N/A"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* State */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{company.state}</span>
                </div>

                {/* Revenue */}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">${company.revenue || 0}</span>
                </div>

                {/* Orders Count */}
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{company.orders?.length || 0} orders</span>
                </div>

                {/* Company Status Details */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Formation:</span>
                    <Badge variant="outline">{company.companyStatus || "pending"}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Agent:</span>
                    <Badge variant="outline">
                      {company.registeredAgentStatus || "pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Address:</span>
                    <Badge variant="outline">
                      {company.businessAddressStatus || "pending"}
                    </Badge>
                  </div>
                </div>

                {/* Created Date */}
                {company.createdAt && (
                  <div className="text-xs text-gray-500 pt-2">
                    Created: {new Date(company.createdAt).toLocaleDateString()}
                  </div>
                )}

                {/* View Details Button */}
                <Button variant="outline" className="w-full mt-4">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-600">
            {searchQuery ? "No companies found matching your search." : "No companies found."}
          </p>
        </Card>
      )}
    </div>
  )
}
