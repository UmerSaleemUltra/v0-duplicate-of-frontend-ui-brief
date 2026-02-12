"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const SELECTED_COMPANY_KEY = "selectedCompanyId"
const COMPANIES_LOADED_KEY = "companiesLoaded"

const PUBLIC_PAGES = ["/", "/privacy", "/terms", "/about", "/contact", "/pricing", "/services", "/auth", "/login", "/checkout", "/forgot-password", "/reset-password", "/blog"]

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companiesLoaded, setCompaniesLoaded] = useState(false)

  const isPublicPage = PUBLIC_PAGES.includes(pathname)

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false)
      return
    }

    if (companiesLoaded) {
      setLoading(false)
      return
    }

    const loadCompanies = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        const token = authService.getToken()

        if (!currentUser || !token) {
          setLoading(false)
          return
        }

        console.log("[v0] CompanyProvider: Loading companies for user", currentUser.id)

        const response = await ApiClient.companies.getAll(token)

        const allCompanies = response.data || response.companies || []

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = c.userId || c.user_id || c.user
          return companyUserId === currentUser.id
        })

        console.log("[v0] CompanyProvider: Found", userCompanies.length, "companies")

        setCompanies(userCompanies)
        setCompaniesLoaded(true)

        // Auto-select company logic: if selectedCompanyId exists, use it; otherwise use first company
        if (userCompanies.length > 0) {
          const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)
          
          if (storedCompanyId) {
            // Check if stored company exists in user's companies
            const companyExists = userCompanies.some((c: any) => (c.id || c._id) === storedCompanyId)
            if (companyExists) {
              console.log("[v0] CompanyProvider: Using stored company", storedCompanyId)
              setSelectedCompanyId(storedCompanyId)
            } else {
              // Stored company not found, select first company
              const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
              console.log("[v0] CompanyProvider: Stored company not found, selecting first", firstCompanyId)
              setSelectedCompanyId(firstCompanyId)
              localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
            }
          } else {
            // No stored company, select first company
            const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
            console.log("[v0] CompanyProvider: No stored company, selecting first", firstCompanyId)
            setSelectedCompanyId(firstCompanyId)
            localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
          }
        } else {
          console.log("[v0] CompanyProvider: No companies found for user")
        }
      } catch (error) {
        console.error("[v0] CompanyProvider: Error loading companies:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [isPublicPage, companiesLoaded])

  const handleSetSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyId(id)
    if (id) {
      localStorage.setItem(SELECTED_COMPANY_KEY, id)
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY)
    }
  }, [])

  const currentUser = authService.getCurrentUser()
  if (loading && currentUser && !isPublicPage) {
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
