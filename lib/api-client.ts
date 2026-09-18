// API Client utility for frontend to backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: any
  headers?: Record<string, string>
  token?: string
  responseType?: string
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

    return headers
  }

  private static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, token, responseType } = options

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

    return response.json()
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
    getAll: (token: string) => this.request("/users", { token }),

    getById: (id: string, token: string) => this.request(`/users/${id}`, { token }),

    create: (data: any, token: string) => this.request("/users", { method: "POST", body: data, token }),

    update: (id: string, data: any, token: string) =>
      this.request(`/users/${id}`, { method: "PUT", body: data, token }),

    delete: (id: string, token: string) => this.request(`/users/${id}`, { method: "DELETE", token }),
  }

  // Company APIs
  static companies = {
    getAll: (token: string) => this.request("/companies", { token }),

    getById: (id: string, token: string) => this.request(`/companies/${id}`, { token }),

    create: (data: any, token: string) => this.request("/companies", { method: "POST", body: data, token }),

    update: (id: string, data: any, token: string) =>
      this.request(`/companies/${id}`, { method: "PUT", body: data, token }),

    delete: (id: string, token: string) => this.request(`/companies/${id}`, { method: "DELETE", token }),
  }

  // Order APIs
  static orders = {
    getAll: (token: string) => this.request("/orders", { token }),

    getById: (id: string, token: string) => this.request(`/orders/${id}`, { token }),

    create: (data: any, token: string) => this.request("/orders", { method: "POST", body: data, token }),

    update: (id: string, data: any, token: string) =>
      this.request(`/orders/${id}`, { method: "PUT", body: data, token }),
  }

  // Document APIs
  static documents = {
    getAll: (token: string, companyId?: string) => {
      const url = companyId ? `/documents?companyId=${companyId}` : "/documents"
      return this.request(url, { token })
    },

    getById: (id: string, token: string) => this.request(`/documents/${id}`, { token }),

    upload: (formData: FormData, token: string) =>
      this.request("/documents", { method: "POST", body: formData, token }),

    delete: (id: string, token: string) => this.request(`/documents/${id}`, { method: "DELETE", token }),

    download: (id: string, token: string) => this.request(`/documents/${id}/download`, { token, responseType: "blob" }),
  }

  // Mail APIs
  static mail = {
    getAll: (token: string, companyId?: string) => {
      const url = companyId ? `/mail?companyId=${companyId}` : "/mail"
      return this.request(url, { token })
    },

    getById: (id: string, token: string) => this.request(`/mail/${id}`, { token }),

    create: (formData: FormData, token: string) => this.request("/mail", { method: "POST", body: formData, token }),

    update: (id: string, data: any, token: string) => this.request(`/mail/${id}`, { method: "PUT", body: data, token }),

    markAsRead: (id: string, token: string) => this.request(`/mail/${id}/mark-read`, { method: "PATCH", token }),
  }

  // Passport APIs
  static passports = {
    upload: (formData: FormData, token: string) =>
      this.request("/passports/upload", {
        method: "POST",
        body: formData,
        token,
      }),

    getById: (id: string, token: string) => this.request(`/passports/${id}`, { token }),

    delete: (id: string, token: string) => this.request(`/passports/${id}`, { method: "DELETE", token }),

    download: (id: string, token: string) => this.request(`/passports/${id}/download`, { token, responseType: "blob" }),
  }

  // Notification APIs
  static notifications = {
    getAll: (token: string) => this.request("/notifications", { token }),

    create: (data: any, token: string) => this.request("/notifications", { method: "POST", body: data, token }),

    markAsRead: (id: string, token: string) =>
      this.request(`/notifications/${id}/mark-read`, {
        method: "PUT",
        token,
      }),
  }

  // Invoice APIs
  static invoices = {
    getAll: (token: string) => this.request("/invoices", { token }),

    getById: (id: string, token: string) => this.request(`/invoices/${id}`, { token }),

    create: (data: any, token: string) => this.request("/invoices", { method: "POST", body: data, token }),

    update: (id: string, data: any, token: string) =>
      this.request(`/invoices/${id}`, { method: "PUT", body: data, token }),
  }

  // Dashboard APIs
  static dashboard = {
    getAdminStats: (token: string) => this.request("/dashboard/admin", { token }),

    getClientStats: (userId: string, token: string) => this.request(`/dashboard/client/${userId}`, { token }),
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
