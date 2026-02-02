'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authService } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { useAuthGuard } from '@/lib/use-auth-guard'
import { Building2, MapPin, DollarSign, Calendar } from 'lucide-react'

interface Company {
  _id: string
  id?: string
  name: string
  type: string
  state: string
  revenue?: number
  status?: string
  createdAt: string
  packageType?: string
  orders?: any[]
}

export default function CompaniesListPage() {
  const { isAuthenticated, isLoading } = useAuthGuard('admin')
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          toast({
            title: 'Error',
            description: 'Not authenticated',
            variant: 'destructive',
          })
          return
        }

        setLoading(true)
        const timestamp = Date.now()

        // COMPANIES API CALL
        const response = await fetch(`/api/companies?_t=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch companies')
        }

        const data = await response.json()
        
        // Handle both response formats
        const companiesData = data.data || data || []
        
        console.log('[v0] Companies API Response:', {
          total: companiesData.length,
          sample: companiesData[0],
        })

        setCompanies(companiesData)
        setFilteredCompanies(companiesData)

        toast({
          title: 'Success',
          description: `Loaded ${companiesData.length} companies`,
        })
      } catch (error) {
        console.error('[v0] Error fetching companies:', error)
        toast({
          title: 'Error',
          description: 'Failed to load companies',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchCompanies()
    }
  }, [isAuthenticated, toast])

  // Filter companies based on search and state
  useEffect(() => {
    let filtered = companies

    if (searchQuery) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (stateFilter !== 'all') {
      filtered = filtered.filter((company) => company.state === stateFilter)
    }

    setFilteredCompanies(filtered)
  }, [searchQuery, stateFilter, companies])

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Get unique states from companies
  const uniqueStates = Array.from(
    new Set(companies.map((c) => c.state).filter(Boolean))
  ).sort()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-gray-600">
          Total: {filteredCompanies.length} of {companies.length} companies
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by company name or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        >
          <option value="all">All States</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Companies Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => (
          <Card key={company._id || company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{company.type}</Badge>
                    {company.status && (
                      <Badge
                        variant={
                          company.status === 'Completed'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {company.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* State */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{company.state}</span>
              </div>

              {/* Revenue */}
              {company.revenue && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">
                    ${company.revenue.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Package Type */}
              {company.packageType && (
                <div className="text-sm">
                  <span className="text-gray-600">Package: </span>
                  <span className="font-medium">{company.packageType}</span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {new Date(company.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Orders Count */}
              {company.orders && company.orders.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    Orders: <span className="font-medium">{company.orders.length}</span>
                  </span>
                </div>
              )}

              <Button className="w-full mt-4" variant="outline">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600">No companies found</p>
        </Card>
      )}
    </div>
  )
}
