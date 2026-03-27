"use client"

import { createContext, useContext } from "react"

interface CompanyContextType {
  selectedCompanyId: string | null
  setSelectedCompanyId: (id: string | null) => void
  companiesLoading: boolean
  hasCompanies: boolean
  initialLoadDone: boolean
  isResetting: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function useSelectedCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error("useSelectedCompany must be used within a CompanyProvider")
  }
  return context
}

export { CompanyContext }
