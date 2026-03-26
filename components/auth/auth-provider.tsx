"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService, type AuthUser } from "@/lib/auth"
import { useRealtime } from "@/lib/hooks/useRealtime"

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
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { on } = useRealtime(token)

  useEffect(() => {
    // Check authentication on mount
    const currentUser = authService.getCurrentUser()
    const userToken = authService.getToken()
    setUser(currentUser)
    setToken(userToken)
    setLoading(false)

    // Protect admin routes
    if (pathname?.startsWith("/admin") && !currentUser) {
      router.push("/login")
    }
  }, [pathname, router])

  useEffect(() => {
    // Listen for force logout event
    const unsubscribe = on("force_logout", (data: any) => {
      if (user && data.userId === user.id) {
        // This user's session was invalidated
        logout()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [on, user])

  const login = async (email: string, password: string) => {
    const result = authService.login({ email, password })

    if (result.success && result.user) {
      setUser(result.user)
      setToken(authService.getToken())
      return { success: true }
    }

    return { success: false, error: result.error || "Login failed" }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
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
