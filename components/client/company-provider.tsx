"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const SELECTED_COMPANY_KEY = "selectedCompanyId"

const PUBLIC_PAGES = ["/", "/privacy", "/terms", "/about", "/contact", "/pricing", "/services"]

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SELECTED_COMPANY_KEY)
    }
    return null
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isPublicPage = PUBLIC_PAGES.includes(pathname)

  useEffect(() => {
    if (isPublicPage) {
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

        const response = await ApiClient.companies.getAll(token)

        const allCompanies = response.data || response.companies || []

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = c.userId || c.user_id || c.user
          return companyUserId === currentUser.id
        })

        setCompanies(userCompanies)

        const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)
        if (storedCompanyId) {
          const companyExists = userCompanies.some((c: any) => (c.id || c._id) === storedCompanyId)
          if (companyExists) {
            setSelectedCompanyId(storedCompanyId)
          } else {
            localStorage.removeItem(SELECTED_COMPANY_KEY)
            if (userCompanies.length > 0) {
              const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
              setSelectedCompanyId(firstCompanyId)
              localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
            }
          }
        } else if (userCompanies.length > 0 && !selectedCompanyId) {
          const firstCompanyId = userCompanies[0].id || userCompanies[0]._id
          setSelectedCompanyId(firstCompanyId)
          localStorage.setItem(SELECTED_COMPANY_KEY, firstCompanyId)
        }
      } catch (error) {
        console.error("Error loading companies:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [pathname, isPublicPage, selectedCompanyId])

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
