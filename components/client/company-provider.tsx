"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const SELECTED_COMPANY_KEY = "selectedCompanyId"

const PUBLIC_PAGES = [
  "/",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
  "/pricing",
  "/services",
  "/login",
  "/signup",
  "/auth",
  "/coming-soon",
]

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SELECTED_COMPANY_KEY)
    }
    return null
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companiesLoaded, setCompaniesLoaded] = useState(false)

  const isPublicPage =
    PUBLIC_PAGES.some((page) => pathname.startsWith(page)) || pathname === "/" || pathname.includes("/coming-soon")
  const isClientPage = pathname.startsWith("/client")

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId || companies.length === 0) return null
    return companies.find((c) => (c.id || c._id) === selectedCompanyId) || null
  }, [selectedCompanyId, companies])

  const loadCompanies = useCallback(async () => {
    if (companiesLoaded || isPublicPage || !isClientPage) {
      setLoading(false)
      return
    }

    try {
      const currentUser = authService.getCurrentUser()
      const token = authService.getToken()

      if (!currentUser || !token) {
        setLoading(false)
        setCompaniesLoaded(true)
        return
      }

      console.log("[v0] CompanyProvider: Loading companies for user:", currentUser.id)

      const response = await ApiClient.companies.getAll(token)
      const allCompanies = response.data || response.companies || []

      const userCompanies = allCompanies.filter((c: any) => {
        const companyUserId = String(c.userId || c.user_id || c.user).trim()
        const currentUserId = String(currentUser.id).trim()
        return companyUserId === currentUserId
      })

      console.log("[v0] CompanyProvider: Loaded", userCompanies.length, "companies")
      setCompanies(userCompanies)
      setCompaniesLoaded(true)

      if (userCompanies.length > 0) {
        const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)

        if (storedCompanyId) {
          const companyExists = userCompanies.some((c: any) => (c.id || c._id) === storedCompanyId)
          if (companyExists) {
            setSelectedCompanyIdState(storedCompanyId)
          } else {
            const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
            setSelectedCompanyIdState(firstCompanyId)
            localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
          }
        } else if (!selectedCompanyId) {
          const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
          setSelectedCompanyIdState(firstCompanyId)
          localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
        }
      }
    } catch (error) {
      console.error("[v0] CompanyProvider: Error loading companies:", error)
    } finally {
      setLoading(false)
    }
  }, [companiesLoaded, isPublicPage, isClientPage, selectedCompanyId])

  useEffect(() => {
    if (!isPublicPage && isClientPage && !companiesLoaded) {
      loadCompanies()
    } else if (isPublicPage) {
      setLoading(false)
    }
  }, [isPublicPage, isClientPage, companiesLoaded, loadCompanies])

  useEffect(() => {
    const handleRefresh = () => {
      console.log("[v0] CompanyProvider: Refresh triggered, reloading companies")
      setCompaniesLoaded(false)
      loadCompanies()
    }

    window.addEventListener("client-dashboard-refresh", handleRefresh)
    return () => window.removeEventListener("client-dashboard-refresh", handleRefresh)
  }, [loadCompanies])

  const handleSetSelectedCompanyId = useCallback((id: string | null) => {
    console.log("[v0] CompanyProvider: Selecting company:", id)
    setSelectedCompanyIdState(id)
    if (id) {
      localStorage.setItem(SELECTED_COMPANY_KEY, id)
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY)
    }
  }, [])

  const refreshCompanies = useCallback(async () => {
    setCompaniesLoaded(false)
    await loadCompanies()
  }, [loadCompanies])

  if (loading && isClientPage && !isPublicPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your companies...</p>
        </div>
      </div>
    )
  }

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId: handleSetSelectedCompanyId,
        companies,
        selectedCompany,
        isLoadingCompanies: loading,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}
