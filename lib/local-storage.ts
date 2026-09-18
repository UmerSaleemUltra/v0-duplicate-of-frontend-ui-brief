import type { User, Company, Order, Invoice, MailItem, Document, Addon, Notification } from "@/lib/types"

// All data is fetched from API via authService and ApiClient

export const userStorage = {
  getAll: () => [] as User[],
  get: (id: string) => null as User | null,
  getByEmail: (email: string) => null as User | null,
  create: (userData: Partial<User>) => {
    const user: User = {
      id: crypto.randomUUID(),
      email: userData.email || "",
      name: userData.name || "",
      role: userData.role || "client",
      status: userData.status || "active",
      phone: userData.phone || "",
      createdAt: new Date().toISOString(),
    }
    return user
  },
  save: (user: User) => {},
  delete: (id: string) => {},
}

export const companyStorage = {
  getAll: () => [] as Company[],
  get: (id: string) => null as Company | null,
  getById: (id: string) => null as Company | null,
  getByUserId: (userId: string) => [] as Company[],
  getSelectedCompanyId: (): string | null => null,
  setSelectedCompanyId: (id: string): void => {},
  clearSelectedCompanyId: (): void => {},
  save: (company: Company) => {},
  delete: (id: string) => {},
}

export const orderStorage = {
  getAll: () => [] as Order[],
  get: (id: string) => null as Order | null,
  save: (order: Order) => {},
  delete: (id: string) => {},
}

export const invoiceStorage = {
  getAll: () => [] as Invoice[],
  get: (id: string) => null as Invoice | null,
  save: (invoice: Invoice) => {},
  delete: (id: string) => {},
}

export const mailStorage = {
  getAll: () => [] as MailItem[],
  get: (id: string) => null as MailItem | null,
  save: (mail: MailItem) => {},
  delete: (id: string) => {},
}

export const documentStorage = {
  getAll: () => [] as Document[],
  get: (id: string) => null as Document | null,
  save: (doc: Document) => {},
  delete: (id: string) => {},
}

export const addonStorage = {
  getAll: () => [] as Addon[],
  get: (id: string) => null as Addon | null,
  save: (addon: Addon) => {},
  delete: (id: string) => {},
}

export const notificationStorage = {
  getAll: () => [] as Notification[],
  get: (id: string) => null as Notification | null,
  save: (notification: Notification) => {},
  delete: (id: string) => {},
  markAsRead: (id: string) => {},
}

export const currentUserStorage = {
  get: () => null as User | null,
  set: (user: User) => {},
  clear: () => {},
}

export const initializeDefaultData = () => {
  // No-op for API-based system
}

export type { User, Company, Order, Invoice, MailItem, Document, Addon, Notification }
