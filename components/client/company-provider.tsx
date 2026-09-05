"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        const token = authService.getToken()

        if (!currentUser || !token) {
          setLoading(false)
          return
        }

        // Fetch all companies for current user from API
        const response = await ApiClient.companies.getAll(token)
        const userCompanies = response.companies.filter((c: any) => c.userId === currentUser.id)

        setCompanies(userCompanies)

        if (userCompanies.length > 0) {
          // Auto-select first company
          setSelectedCompanyId(userCompanies[0]._id)
        }
      } catch (error) {
        console.error("[v0] Error loading companies:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [])

  const handleSetSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyId(id)
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId: handleSetSelectedCompanyId }}>
      {children}
    </CompanyContext.Provider>
  )
}
