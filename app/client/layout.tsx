"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { ClientShell } from "@/components/client/client-shell"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = authService.getToken()
        const currentUser = authService.getCurrentUser()

        if (!token || !currentUser) {
          setIsAuthenticated(false)
          router.push("/login")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("[v0] Auth verification failed:", error)
        setIsAuthenticated(false)
        router.push("/login")
      } finally {
        setAuthChecked(true)
      }
    }

    verifyAuth()
  }, [router])

  if (!authChecked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <ClientShell>{children}</ClientShell>
}
