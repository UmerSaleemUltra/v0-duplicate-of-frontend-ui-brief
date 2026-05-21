"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"

interface UseAuthGuardOptions {
  requiredRole?: "admin" | "client"
  redirectTo?: string
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      console.log(" Checking authentication...")

      // Check if user is authenticated
      const authenticated = authService.isAuthenticated()

      if (!authenticated) {
        console.log(" Not authenticated, redirecting to login")
        const redirectPath = options.redirectTo || "/login"
        router.push(redirectPath)
        return
      }

      // Check role if required
      if (options.requiredRole) {
        const user = authService.getCurrentUser()

        if (!user || user.role !== options.requiredRole) {
          console.log(" Unauthorized role, redirecting")
          const redirectPath = user?.role === "admin" ? "/admin" : "/client/dashboard"
          router.push(redirectPath)
          return
        }
      }

      console.log(" Authentication successful")
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, options.requiredRole, options.redirectTo])

  return { isLoading, isAuthenticated }
}
