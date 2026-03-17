"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "./auth"

interface UseAuthGuardOptions {
  requiredRole?: "admin" | "client"
  redirectTo?: string
}

export function useAuthGuard(options: UseAuthGuardOptions | string = {}) {
  const router = useRouter()

  // Normalise: accept useAuthGuard("client") shorthand
  const opts: UseAuthGuardOptions = typeof options === "string" ? { requiredRole: options } : options

  // Run the auth check synchronously on first render so pages that are
  // already authenticated don't flash a skeleton for even one tick.
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true
    const authenticated = authService.isAuthenticated()
    if (!authenticated) return true
    if (opts.requiredRole) {
      const user = authService.getCurrentUser()
      if (!user || user.role !== opts.requiredRole) return true
    }
    return false
  })

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false
    const authenticated = authService.isAuthenticated()
    if (!authenticated) return false
    if (opts.requiredRole) {
      const user = authService.getCurrentUser()
      return !!(user && user.role === opts.requiredRole)
    }
    return true
  })

  useEffect(() => {
    const authenticated = authService.isAuthenticated()

    if (!authenticated) {
      const redirectPath = opts.redirectTo || "/login"
      router.push(redirectPath)
      return
    }

    if (opts.requiredRole) {
      const user = authService.getCurrentUser()
      if (!user || user.role !== opts.requiredRole) {
        const redirectPath = user?.role === "admin" ? "/admin" : "/client/dashboard"
        router.push(redirectPath)
        return
      }
    }

    setIsAuthenticated(true)
    setIsLoading(false)
  }, [router, opts.requiredRole, opts.redirectTo])

  return { isLoading, isAuthenticated }
}
