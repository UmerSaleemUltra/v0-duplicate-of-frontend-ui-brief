"use client"

import type React from "react"
import { CompanyProvider as ContextCompanyProvider } from "@/lib/company-context"

const SELECTED_COMPANY_KEY = "selectedCompanyId"
const COMPANIES_LOADED_KEY = "companiesLoaded"

const PUBLIC_PAGES = ["/", "/privacy", "/terms", "/about", "/contact", "/pricing", "/services"]

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  return <ContextCompanyProvider>{children}</ContextCompanyProvider>
}
