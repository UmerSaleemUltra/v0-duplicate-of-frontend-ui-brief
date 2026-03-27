"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { CompanyContext } from "@/lib/company-context"
import { ApiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

const SELECTED_COMPANY_KEY = "selectedCompanyId"
const COMPANIES_CACHE_KEY = "companies_cache"

const PUBLIC_PAGES = ["/", "/privacy", "/terms", "/about", "/contact", "/pricing", "/services", "/auth", "/login", "/checkout", "/forgot-password", "/reset-password", "/blog"]

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [lastUserId, setLastUserId] = useState<string | null>(null)
  // Ref guard: prevents loadCompanies from being called concurrently
  const isFetchingRef = useRef(false)

  // Read from localStorage synchronously on first render so the name shows instantly
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SELECTED_COMPANY_KEY) || null
    }
    return null
  })

  // Hydrate companies from localStorage cache immediately — avoids blank name
  const [companies, setCompanies] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(COMPANIES_CACHE_KEY)
        if (cached) return JSON.parse(cached)
      } catch {
        // ignore
      }
    }
    return []
  })

  // loading is false immediately if we have cached companies, so sidebar shows instantly
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      // Don't set loading to true on first render — only set to true when we actively fetch
      return !localStorage.getItem(COMPANIES_CACHE_KEY)
    }
    return false
  })
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const isPublicPage = PUBLIC_PAGES.includes(pathname)

  // Listen for fresh login events so the provider resets and re-fetches for the new session
  useEffect(() => {
    const handleUserLoggedIn = (e: CustomEvent<{ userId: string }>) => {
      const newUserId = e.detail?.userId
      // Reset all state so loadCompanies runs fresh on next effect cycle
      isFetchingRef.current = false
      try {
        localStorage.removeItem(COMPANIES_CACHE_KEY)
        localStorage.removeItem(SELECTED_COMPANY_KEY)
      } catch {
        // ignore
      }
      setCompanies([])
      setSelectedCompanyId(null)
      setLoading(true)
      setInitialLoadDone(false)
      setLastUserId(newUserId ?? null)
    }

    window.addEventListener("user-logged-in", handleUserLoggedIn as EventListener)
    return () => window.removeEventListener("user-logged-in", handleUserLoggedIn as EventListener)
  }, [])

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false)
      setInitialLoadDone(true)
      return
    }

    // Check if user has changed (logout then login different user scenario)
    const currentUser = authService.getCurrentUser()
    if (currentUser && lastUserId && lastUserId !== currentUser.id) {
      // User ID changed, clear cache and reset
      isFetchingRef.current = false
      try {
        localStorage.removeItem(COMPANIES_CACHE_KEY)
        localStorage.removeItem(SELECTED_COMPANY_KEY)
      } catch {
        // ignore
      }
      setCompanies([])
      setSelectedCompanyId(null)
      setLastUserId(currentUser.id)
      setInitialLoadDone(false)
      return
    }

    if (currentUser && !lastUserId) {
      setLastUserId(currentUser.id)
      // Don't return — fall through so loadCompanies runs on this same cycle
    }

    // Only run the full loading sequence once per session
    if (initialLoadDone) {
      return
    }

    // Prevent concurrent fetches (e.g. from rapid state changes)
    if (isFetchingRef.current) {
      return
    }

    const loadCompanies = async () => {
      isFetchingRef.current = true
      try {
        const currentUser = authService.getCurrentUser()
        const token = authService.getToken()

        if (!currentUser || !token) {
          setLoading(false)
          setInitialLoadDone(true)
          isFetchingRef.current = false
          return
        }

        const response = await ApiClient.companies.getAll(token)

        const allCompanies = response.data || response.companies || []

        const userCompanies = allCompanies.filter((c: any) => {
          const companyUserId = c.userId || c.user_id || c.user
          return companyUserId === currentUser.id
        })

        setCompanies(userCompanies)
        // Persist to localStorage so next render is instant
        try {
          localStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify(userCompanies))
        } catch {
          // ignore storage errors
        }

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
        } else {
          // Clear selected company if user has no companies
          setSelectedCompanyId(null)
          localStorage.removeItem(SELECTED_COMPANY_KEY)
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false)
        setInitialLoadDone(true)
        isFetchingRef.current = false
      }
    }

    loadCompanies()
  }, [isPublicPage, initialLoadDone, lastUserId])

  // Listen for checkout completion and refresh companies
  useEffect(() => {
    const handleCheckoutComplete = () => {
      // Force refresh companies from API after checkout
      setInitialLoadDone(false)
      try {
        localStorage.removeItem(COMPANIES_CACHE_KEY)
        localStorage.removeItem(SELECTED_COMPANY_KEY)
      } catch {
        // ignore
      }
    }

    window.addEventListener("checkout-completed", handleCheckoutComplete)
    return () => window.removeEventListener("checkout-completed", handleCheckoutComplete)
  }, [])

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
        initialLoadDone,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}
