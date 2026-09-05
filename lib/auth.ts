// Backend API-based authentication system - Uses only cookies/HTTP-only tokens
import { ApiClient } from "./api-client"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "client"
}

export interface LoginCredentials {
  email: string
  password: string
}

let inMemoryToken: string | null = null
let inMemoryUser: AuthUser | null = null

export const authService = {
  // Login function using backend API
  login: async (credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const response = await ApiClient.auth.login(credentials)

      const authUser: AuthUser = {
        id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      }

      inMemoryToken = response.token
      inMemoryUser = authUser

      console.log("[v0] Login successful:", authUser.name)
      return { success: true, user: authUser }
    } catch (error: any) {
      console.error("[v0] Login failed:", error.message)
      return { success: false, error: error.message || "Login failed" }
    }
  },

  // Logout function
  logout: (): void => {
    inMemoryToken = null
    inMemoryUser = null
  },

  // Get current user from memory
  getCurrentUser: (): AuthUser | null => {
    return inMemoryUser
  },

  // Get auth token from memory
  getToken: (): string | null => {
    return inMemoryToken
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!inMemoryToken && !!inMemoryUser
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    return inMemoryUser?.role === "admin"
  },

  // Check if user is client
  isClient: (): boolean => {
    return inMemoryUser?.role === "client"
  },

  // Verify token with backend
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      await ApiClient.auth.me(token)
      return true
    } catch {
      return false
    }
  },

  // Check if valid token exists
  hasValidToken: (): boolean => {
    return !!inMemoryToken
  },

  // Signup with backend API
  signup: async (data: {
    email: string
    password: string
    name: string
    phone: string
  }): Promise<{
    success: boolean
    user?: AuthUser
    error?: string
  }> => {
    try {
      const response = await ApiClient.auth.signup(data)

      const authUser: AuthUser = {
        id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      }

      inMemoryToken = response.token
      inMemoryUser = authUser

      return { success: true, user: authUser }
    } catch (error: any) {
      return { success: false, error: error.message || "Signup failed" }
    }
  },

  // Set token and user (for checkout flow)
  setAuth: (token: string, user: AuthUser): void => {
    inMemoryToken = token
    inMemoryUser = user
  },

  // Fetch and refresh user data from backend
  refreshUser: async (): Promise<AuthUser | null> => {
    if (!inMemoryToken) return null

    try {
      const response = await ApiClient.auth.me(inMemoryToken)
      const authUser: AuthUser = {
        id: response._id,
        email: response.email,
        name: response.name,
        role: response.role,
      }
      inMemoryUser = authUser
      return authUser
    } catch (error) {
      console.error("[v0] Failed to refresh user:", error)
      return null
    }
  },
}
