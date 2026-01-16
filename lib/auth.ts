import { ApiClient } from "./api-client"
import { broadcastLogout, getAuthTokenKey } from "./multi-tab-sync"

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

const setCookie = (name: string, value: string, days = 3) => {
  if (typeof window === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null

  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

let inMemoryToken: string | null = null
let inMemoryUser: AuthUser | null = null

if (typeof window !== "undefined") {
  const savedUser = getCookie("auth_user")

  if (savedUser) {
    try {
      inMemoryUser = JSON.parse(decodeURIComponent(savedUser))
      const tokenKey = inMemoryUser ? getAuthTokenKey(inMemoryUser.role) : "auth_token"
      const savedToken = getCookie(tokenKey)
      if (savedToken) {
        inMemoryToken = savedToken
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

export const authService = {
  login: async (
    credentials: LoginCredentials,
  ): Promise<{ success: boolean; user?: AuthUser; error?: string; retryAfter?: number; remainingTime?: number }> => {
    try {
      const response = await ApiClient.auth.login(credentials)

      const userData = response?.data?.user || response?.user
      const tokenData = response?.data?.token || response?.token

      if (!userData) {
        return { success: false, error: "Unable to log in. Please try again." }
      }

      if (!userData.email || !userData.name || !userData.role) {
        return { success: false, error: "Account data is incomplete. Please contact support." }
      }

      const userId = userData.id || userData._id
      if (!userId) {
        return { success: false, error: "Account ID is missing. Please contact support." }
      }

      const authUser: AuthUser = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      }

      if (!tokenData) {
        return { success: false, error: "Authentication token is missing. Please try again." }
      }

      inMemoryToken = tokenData
      inMemoryUser = authUser

      const tokenKey = getAuthTokenKey(authUser.role)
      setCookie(tokenKey, tokenData, 3)
      setCookie("auth_user", encodeURIComponent(JSON.stringify(authUser)), 3)

      return { success: true, user: authUser }
    } catch (error: any) {
      const errorData = error?.response?.data || {}
      const errorMessage =
        errorData.error || error.message || "Unable to log in. Please check your credentials and try again."

      return {
        success: false,
        error: errorMessage,
        retryAfter: errorData.retryAfter,
        remainingTime: errorData.remainingTime,
      }
    }
  },

  logout: (): void => {
    const currentRole = inMemoryUser?.role

    inMemoryToken = null
    inMemoryUser = null

    if (currentRole) {
      const tokenKey = getAuthTokenKey(currentRole)
      deleteCookie(tokenKey)
    }

    deleteCookie("auth_token")
    deleteCookie("admin_auth_token")
    deleteCookie("auth_user")

    if (typeof window !== "undefined") {
      localStorage.setItem("onetime_logout", "true")
    }

    broadcastLogout()
  },

  getCurrentUser: (): AuthUser | null => {
    return inMemoryUser
  },

  getUser: (): AuthUser | null => {
    return inMemoryUser
  },

  getToken: (): string | null => {
    return inMemoryToken
  },

  isAuthenticated: (): boolean => {
    return !!inMemoryToken && !!inMemoryUser
  },

  isAdmin: (): boolean => {
    return inMemoryUser?.role === "admin"
  },

  isClient: (): boolean => {
    return inMemoryUser?.role === "client"
  },

  verifyToken: async (token: string): Promise<boolean> => {
    try {
      await ApiClient.auth.me(token)
      return true
    } catch {
      return false
    }
  },

  hasValidToken: (): boolean => {
    return !!inMemoryToken
  },

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

      const userData = response?.data?.user || response?.user
      const tokenData = response?.data?.token || response?.token

      if (!userData) {
        return { success: false, error: "Unable to create account. Please try again." }
      }

      const userId = userData.id || userData._id
      if (!userId) {
        return { success: false, error: "Account creation failed. Please try again." }
      }

      const authUser: AuthUser = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      }

      if (!tokenData) {
        return { success: false, error: "Authentication failed. Please try logging in." }
      }

      inMemoryToken = tokenData
      inMemoryUser = authUser

      const tokenKey = getAuthTokenKey(authUser.role)
      setCookie(tokenKey, tokenData, 3)
      setCookie("auth_user", encodeURIComponent(JSON.stringify(authUser)), 3)

      return { success: true, user: authUser }
    } catch (error: any) {
      const errorMessage = error.message || "Unable to create account. Please try again."
      return { success: false, error: errorMessage }
    }
  },

  setAuth: (token: string, user: AuthUser): void => {
    inMemoryToken = token
    inMemoryUser = user

    const tokenKey = getAuthTokenKey(user.role)
    setCookie(tokenKey, token, 3)
    setCookie("auth_user", encodeURIComponent(JSON.stringify(user)), 3)
  },

  refreshUser: async (): Promise<AuthUser | null> => {
    if (!inMemoryToken) return null

    try {
      const response = await ApiClient.auth.me(inMemoryToken)
      if (!response) return null

      const userId = response.id || response._id
      if (!userId) return null

      const authUser: AuthUser = {
        id: userId,
        email: response.email,
        name: response.name,
        role: response.role,
      }
      inMemoryUser = authUser
      return authUser
    } catch (error) {
      return null
    }
  },
}

export async function verifyToken(token: string): Promise<{ id: string; role: string; email: string } | null> {
  try {
    const response = await ApiClient.auth.me(token)
    if (!response) return null

    const userId = response.id || response._id
    if (!userId) return null

    return {
      id: userId,
      role: response.role,
      email: response.email,
    }
  } catch {
    return null
  }
}
