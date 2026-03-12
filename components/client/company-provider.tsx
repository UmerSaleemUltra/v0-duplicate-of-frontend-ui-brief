"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const SELECTED_COMPANY_KEY = "selectedCompanyId"

const PUBLIC_PAGES = ["/", "/privacy", "/terms", "/about", "/contact", "/pricing", "/services", "/auth", "/login", "/checkout", "/forgot-password", "/reset-password", "/blog"]

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  // loading is only true for the very first fetch — never reset on tab-switch or refresh
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const isPublicPage = PUBLIC_PAGES.includes(pathname)

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false)
      return
    }

    // Only run the full loading sequence once per session
    if (initialLoadDone) {
      return
    }

    const loadCompanies = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        const token = authService.getToken()

        if (!currentUser || !token) {
          setLoading(false)
          setInitialLoadDone(true)
          return
        }

        const response = await ApiClient.companies.getAll(token)

        const allCompanies = response.data || response.companies || []

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = c.userId || c.user_id || c.user
          return companyUserId === currentUser.id
        })

        setCompanies(userCompanies)

        // Auto-select company logic: prefer stored, then first
        if (userCompanies.length > 0) {
          const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)
          
          if (storedCompanyId) {
            const companyExists = userCompanies.some((c: any) => (c.id || c._id) === storedCompanyId)
            if (companyExists) {
              setSelectedCompanyId(storedCompanyId)
            } else {
              const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
              setSelectedCompanyId(firstCompanyId)
              localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
            }
          } else {
            const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
            setSelectedCompanyId(firstCompanyId)
            localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
          }
        }
      } catch (error) {
        console.error("[v0] CompanyProvider: Error loading companies:", error)
      } finally {
        setLoading(false)
        setInitialLoadDone(true)
      }
    }

    loadCompanies()
  }, [isPublicPage, initialLoadDone])

  const handleSetSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyId(id)
    if (id) {
      localStorage.setItem(SELECTED_COMPANY_KEY, id)
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY)
    }
  }, [])

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId: handleSetSelectedCompanyId,
        companiesLoading: loading,
        hasCompanies: companies.length > 0,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}
