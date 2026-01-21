// API Client utility for frontend to backend communication

import { cache } from "./cache"

const API_BASE_URL = "https://www.buzzfiling.com"

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: any
  headers?: Record<string, string>
  token?: string
  responseType?: string
  cache?: boolean
  cacheTime?: number
}

export class ApiClient {
  private static getHeaders(token?: string, isFormData = false): HeadersInit {
    const headers: HeadersInit = {}

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    if (!isFormData) {
      headers["Content-Type"] = "application/json"
    }

    headers["Accept-Encoding"] = "gzip, deflate, br"

    return headers
  }

  private static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      body,
      headers = {},
      token,
      responseType,
      cache: useCache = false,
      cacheTime = 300000,
    } = options

    const cacheKey = `${method}-${endpoint}-${JSON.stringify(body || {})}`

    if (method === "GET" && useCache) {
      const cachedData = cache.get<T>(cacheKey)
      if (cachedData) {
        return cachedData
      }
    }

    const isFormData = body instanceof FormData

    const config: RequestInit = {
      method,
      headers: {
        ...this.getHeaders(token, isFormData),
        ...headers,
      },
    }

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "An error occurred",
      }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    if (responseType === "blob") {
      return response.blob() as Promise<T>
    }

    const data = await response.json()

    if (method === "GET" && useCache) {
      cache.set(cacheKey, data, cacheTime)
    }

    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      cache.invalidatePattern(endpoint.split("/")[1])
    }

    return data
  }

  // Auth APIs
  static auth = {
    signup: (data: {
      email: string
      password: string
      name: string
      phone: string
    }) => this.request("/auth/signup", { method: "POST", body: data }),

    login: (data: { email: string; password: string }) => this.request("/auth/login", { method: "POST", body: data }),

    verifyEmail: (data: { email: string; code: string }) =>
      this.request("/auth/verify-email", { method: "POST", body: data }),

    forgotPassword: (data: { email: string }) => this.request("/auth/forgot-password", { method: "POST", body: data }),

    resetPassword: (data: { token: string; password: string }) =>
      this.request("/auth/reset-password", { method: "POST", body: data }),

    me: (token: string) => this.request("/auth/me", { token }),
  }

  // User APIs
  static users = {
    getAll: (token: string) => this.request("/users", { token, cache: true, cacheTime: 60000 }),
    getById: (id: string, token: string) => this.request(`/users/${id}`, { token, cache: true, cacheTime: 60000 }),
    create: (data: any, token: string) => this.request("/users", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      this.request(`/users/${id}`, { method: "PUT", body: data, token }),
    delete: (id: string, token: string) => this.request(`/users/${id}`, { method: "DELETE", token }),
  }

  // Company APIs
  static companies = {
    getAll: (token: string) => this.request("/companies", { token, cache: true, cacheTime: 60000 }),
    getById: (id: string, token: string) => this.request(`/companies/${id}`, { token, cache: true, cacheTime: 60000 }),
    create: (data: any, token: string) => this.request("/companies", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      this.request(`/companies/${id}`, { method: "PUT", body: data, token }),
    delete: (id: string, token: string) => this.request(`/companies/${id}`, { method: "DELETE", token }),
    addOrder: (companyId: string, orderData: any, token: string) =>
      this.request(`/companies/${companyId}/orders`, { method: "POST", body: orderData, token }),
  }

  // Orders APIs (deprecated)
  static orders = {
    getAll: (token: string) => {
      console.warn("[v0] orders.getAll() is deprecated. Orders are now embedded in companies.")
      return this.request("/orders", { token, cache: true, cacheTime: 30000 })
    },
    getById: (id: string, token: string) => {
      console.warn("[v0] orders.getById() is deprecated. Orders are now embedded in companies.")
      return this.request(`/orders/${id}`, { token, cache: true })
    },
    create: (data: any, token: string) => {
      console.warn("[v0] orders.create() is deprecated. Use companies.addOrder() instead.")
      return this.request("/orders", { method: "POST", body: data, token })
    },
    update: (id: string, data: any, token: string) => {
      console.warn("[v0] orders.update() is deprecated. Orders are now embedded in companies.")
      return this.request(`/orders/${id}`, { method: "PUT", body: data, token })
    },
    delete: (id: string, token: string) => {
      console.warn("[v0] orders.delete() is deprecated. Orders are now embedded in companies.")
      return this.request(`/orders/${id}`, { method: "DELETE", token })
    },
  }

  // Document APIs
  static documents = {
    getAll: (token: string, companyId?: string) => {
      const url = companyId ? `/documents?companyId=${companyId}` : "/documents"
      return this.request(url, { token, cache: true, cacheTime: 60000 })
    },
    getById: (id: string, token: string) => this.request(`/documents/${id}`, { token, cache: true }),
    upload: (token: string, file: File, metadata: any) => {
      const formData = new FormData()
      formData.append("file", file)
      Object.keys(metadata).forEach((key) => {
        formData.append(key, metadata[key])
      })
      return this.request("/documents", { method: "POST", body: formData, token })
    },
    update: (id: string, data: any, token: string) =>
      this.request(`/documents/${id}`, { method: "PUT", body: data, token }),
    updateWithFile: (id: string, token: string, file: File, metadata: any) => {
      const formData = new FormData()
      formData.append("file", file)
      Object.keys(metadata).forEach((key) => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key])
        }
      })
      return this.request(`/documents/${id}`, { method: "PUT", body: formData, token })
    },
    delete: (id: string, token: string) => this.request(`/documents/${id}`, { method: "DELETE", token }),
    download: (token: string, id: string): Promise<Blob> =>
      this.request(`/documents/${id}/download`, { token, responseType: "blob" }),
  }

  // Mail APIs
  static mail = {
    getAll: (token: string, companyId?: string) => {
      const url = companyId ? `/mail?companyId=${companyId}` : "/mail"
      return this.request(url, { token, cache: true, cacheTime: 60000 })
    },
    getById: (id: string, token: string) => this.request(`/mail/${id}`, { token, cache: true }),
    create: (formData: FormData, token: string) => this.request("/mail", { method: "POST", body: formData, token }),
    update: (id: string, data: any, token: string) => this.request(`/mail/${id}`, { method: "PUT", body: data, token }),
    markAsRead: (id: string, token: string) => this.request(`/mail/${id}/mark-read`, { method: "PATCH", token }),
    delete: (id: string, token: string) => this.request(`/mail/${id}`, { method: "DELETE", token }),
  }

  // Passport APIs
  static passports = {
    getAll: (
      token: string,
      filters?: { userId?: string; companyId?: string; memberId?: string; includePending?: boolean },
    ) => {
      const params = new URLSearchParams()
      if (filters?.userId) params.append("userId", filters.userId)
      if (filters?.companyId) params.append("companyId", filters.companyId)
      if (filters?.memberId) params.append("memberId", filters.memberId)
      if (filters?.includePending) params.append("includePending", "true")

      const queryString = params.toString()
      return this.request(`/passports${queryString ? `?${queryString}` : ""}`, { token, cache: false })
    },
    upload: (formData: FormData, token: string) =>
      this.request("/passports/upload", {
        method: "POST",
        body: formData,
        token,
      }),
    getById: (id: string, token: string) => this.request(`/passports/${id}`, { token, cache: false }),
    delete: (id: string, token: string) => this.request(`/passports/${id}`, { method: "DELETE", token }),
    download: (id: string, token: string) => this.request(`/passports/${id}/download`, { token, responseType: "blob" }),
    link: (data: { orderId: string; userId: string; companyId: string }, token: string) =>
      this.request("/passports/link", { method: "POST", body: data, token }),
  }

  // Notification APIs
  static notifications = {
    getAll: (token: string, companyId?: string) => {
      const url = companyId ? `/notifications?companyId=${companyId}` : "/notifications"
      return this.request(url, { token, cache: true, cacheTime: 30000 })
    },
    create: (data: any, token: string) => this.request("/notifications", { method: "POST", body: data, token }),
    markAsRead: (id: string, token: string) =>
      this.request(`/notifications/${id}/mark-read`, {
        method: "PUT",
        token,
      }),
    markAllAsRead: (token: string) =>
      this.request("/notifications/mark-all-read", {
        method: "PUT",
        token,
      }),
    delete: (id: string, token: string) =>
      this.request(`/notifications/${id}`, {
        method: "DELETE",
        token,
      }),
    deleteByMilestone: (companyId: string, milestoneName: string, token: string) =>
      this.request(`/notifications?companyId=${companyId}&milestoneName=${encodeURIComponent(milestoneName)}`, {
        method: "DELETE",
        token,
      }),
  }

  // Invoice APIs
  static invoices = {
    getAll: (token: string) => this.request("/invoices", { token, cache: true }),
    getById: (id: string, token: string) => this.request(`/invoices/${id}`, { token, cache: true }),
    create: (data: any, token: string) => this.request("/invoices", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      this.request(`/invoices/${id}`, { method: "PUT", body: data, token }),
    delete: (id: string, token: string) => this.request(`/invoices/${id}`, { method: "DELETE", token }),
  }

  // Dashboard APIs
  static dashboard = {
    getAdminStats: (token: string) => this.request("/dashboard/admin", { token, cache: true, cacheTime: 60000 }),
    getClientStats: (userId: string, token: string) =>
      this.request(`/dashboard/client/${userId}`, { token, cache: true, cacheTime: 60000 }),
  }

  // Payment APIs
  static payments = {
    createIntent: (data: { amount: number; orderId: string; email?: string; name?: string }, token: string) =>
      this.request("/payments/create-payment-intent", {
        method: "POST",
        body: data,
        token,
      }),
    confirmPayment: (paymentIntentId: string, token: string) =>
      this.request("/payments/confirm", {
        method: "POST",
        body: { paymentIntentId },
        token,
      }),
  }
}

export const api = ApiClient
export default ApiClient
