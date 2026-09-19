"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { CompanyProvider } from "@/components/client/company-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CompanyProvider>{children}</CompanyProvider>
    </AuthProvider>
  )
}
