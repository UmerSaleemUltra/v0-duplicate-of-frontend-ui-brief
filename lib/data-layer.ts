// Data abstraction layer using API backend
// All data operations now go through the REST API

import { api } from "./api-client"
import type { Company, Order, Invoice, Document, User, MailItem, Addon, Notification } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// Generic data layer interface
interface DataLayer<T> {
  getAll: () => Promise<T[]>
  getById: (id: string) => Promise<T | undefined>
  create: (data: Omit<T, "id" | "createdAt">) => Promise<T>
  update: (id: string, updates: Partial<T>) => Promise<T | undefined>
  delete: (id: string) => Promise<boolean>
}

function createAPILayer<T extends { id: string }>(endpoint: string): DataLayer<T> {
  return {
    getAll: async () => {
      const response = await api.get<T[]>(`/${endpoint}`)
      return response
    },

    getById: async (id: string) => {
      try {
        const response = await api.get<T>(`/${endpoint}/${id}`)
        return response
      } catch (error) {
        return undefined
      }
    },

    create: async (data: any) => {
      const response = await api.post<T>(`/${endpoint}`, data)
      return response
    },

    update: async (id: string, updates: Partial<T>) => {
      try {
        const response = await api.patch<T>(`/${endpoint}/${id}`, updates)
        return response
      } catch (error) {
        return undefined
      }
    },

    delete: async (id: string) => {
      try {
        await api.delete(`/${endpoint}/${id}`)
        return true
      } catch (error) {
        return false
      }
    },
  }
}

export const companyDataLayer = createAPILayer<Company>("companies")
export const orderDataLayer = createAPILayer<Order>("orders")
export const invoiceDataLayer = createAPILayer<Invoice>("invoices")
export const documentDataLayer = createAPILayer<Document>("documents")
export const userDataLayer = createAPILayer<User>("users")
export const mailDataLayer = createAPILayer<MailItem>("mail")
export const addonDataLayer = createAPILayer<Addon>("addons")
export const notificationDataLayer = createAPILayer<Notification>("notifications")
