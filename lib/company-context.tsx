"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface CompanyContextType {
  selectedCompanyId: string | null
  setSelectedCompanyId: (id: string | null) => void
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const savedCompanyId = localStorage.getItem("selected_company_id")
    if (savedCompanyId) {
      setSelectedCompanyId(savedCompanyId)
    }
    setIsMounted(true)
  }, [])

  const handleSetSelectedCompanyId = (id: string | null) => {
    setSelectedCompanyId(id)
    if (id) {
      localStorage.setItem("selected_company_id", id)
    } else {
      localStorage.removeItem("selected_company_id")
    }
  }

  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId: handleSetSelectedCompanyId }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useSelectedCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error("useSelectedCompany must be used within CompanyProvider")
  }
  return context
}
