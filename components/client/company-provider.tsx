"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const SELECTED_COMPANY_KEY = "selectedCompanyId"

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SELECTED_COMPANY_KEY)
    }
    return null
  })
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

        console.log("[v0] Loading companies for user:", currentUser.id)
        const response = await ApiClient.companies.getAll(token)
        console.log("[v0] Companies API response:", response)

        const allCompanies = response.data || response.companies || []
        console.log("[v0] All companies from API:", allCompanies.length)

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = c.userId || c.user_id || c.user
          console.log("[v0] Comparing company userId:", companyUserId, "with current user:", currentUser.id)
          return companyUserId === currentUser.id
        })

        console.log("[v0] User companies found:", userCompanies.length)
        setCompanies(userCompanies)

        const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)
        if (storedCompanyId) {
          const companyExists = userCompanies.some((c: any) => (c.id || c._id) === storedCompanyId)
          if (companyExists) {
            console.log("[v0] Restoring company from localStorage:", storedCompanyId)
            setSelectedCompanyId(storedCompanyId)
          } else {
            console.log("[v0] Stored company no longer exists, clearing localStorage")
            localStorage.removeItem(SELECTED_COMPANY_KEY)
            if (userCompanies.length > 0) {
              const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
              setSelectedCompanyId(firstCompanyId)
              localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
            }
          }
        } else if (userCompanies.length > 0 && !selectedCompanyId) {
          const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
          console.log("[v0] Auto-selecting first company:", firstCompanyId)
          setSelectedCompanyId(firstCompanyId)
          localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
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
    console.log("[v0] Switching to company:", id)
    setSelectedCompanyId(id)
    if (id) {
      localStorage.setItem(SELECTED_COMPANY_KEY, id)
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY)
    }
  }, [])

  const currentUser = authService.getCurrentUser()
  if (loading && currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading companies...</p>
        </div>
      </div>
    )
  }

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId: handleSetSelectedCompanyId }}>
      {children}
    </CompanyContext.Provider>
  )
}
