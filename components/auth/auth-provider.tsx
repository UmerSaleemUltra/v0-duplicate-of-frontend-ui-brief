"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService, type AuthUser } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication on mount
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)

    // Protect admin routes
    if (pathname?.startsWith("/admin") && !currentUser) {
      router.push("/login")
    }
  }, [pathname, router])

  const login = async (email: string, password: string) => {
    const result = authService.login({ email, password })

    if (result.success && result.user) {
      setUser(result.user)
      return { success: true }
    }

    return { success: false, error: result.error || "Login failed" }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
