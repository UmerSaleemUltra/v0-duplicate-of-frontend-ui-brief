// Central type definitions for the entire application
// This makes it easy to maintain consistency when integrating backend

// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  accountStatus: "pending_payment" | "pending_verification" | "active" | "suspended"
  emailVerified: boolean
  role: "client" | "admin"
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// ============================================
// COMPANY TYPES
// ============================================

export interface Company {
  id: string
  userId: string
  name: string
  type: "LLC" | "Corporation" | "S-Corp" | "Non-Profit"
  state: string
  status: "pending" | "processing" | "active" | "suspended"
  ein?: string
  itin?: string // Added ITIN field
  businessId?: string
  einDocument?: string
  itemNumber?: string
  itemNumberDocument?: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  formationDate?: string
  notes?: string
  registeredAgent?: {
    name: string
    company?: string
    address: string
    city: string
    state: string
    zip: string
    phone?: string
    email?: string
    servicePeriod?: string
    status?: string
  }
  milestones?: {
    orderProcessed: boolean
    registeredAgentAssigned: boolean
    mailingAddressIssued: boolean
    formationCompleted: boolean
    einProcessed: boolean
    boiReportFiled: boolean
  }
  customMilestones?: Array<{
    id: string
    title: string
    description?: string
    completed: boolean
    createdAt: string
    completedAt?: string
  }>
  members?: Array<{
    name: string
    address: string
    city: string
    state?: string
    zip: string
    ssn?: string
    dateOfBirth?: string
    isResponsiblePerson: boolean
    ownershipPercentage?: number
    passportKey?: string // Store the IndexedDB key for the passport
  }>
  purchasedAddons?: string[]
  createdAt: string
  updatedAt: string
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  id: string
  userId: string
  companyId: string
  companyName: string
  type: "formation" | "addon" | "renewal"
  status: "pending" | "processing" | "completed" | "cancelled"
  amount: number
  total: number // Added total field for order total with addons
  packagePrice?: number // Base package price (e.g., $149 or $249)
  stateFilingFee?: number // State-specific filing fee
  addonsTotal?: number // Total cost of all add-ons
  paymentStatus: "pending" | "pending_verification" | "paid" | "failed"
  paymentMethod?: "whatsapp" | "bank_transfer" // Removed stripe from payment methods
  transactionId?: string
  transactionReference?: string // Added transaction reference field
  items: OrderItem[]
  purchasedAddons?: string[] // Added purchasedAddons array
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
}

// ============================================
// DOCUMENT TYPES
// ============================================

export interface Document {
  id: string
  userId: string
  companyId: string
  name: string
  title?: string // Added title field for documents
  type: "articles" | "operating-agreement" | "ein-letter" | "certificate" | "other"
  category: string
  fileUrl: string
  fileName: string // Added actual file name
  fileSize: number
  mimeType: string
  uploadedBy: "user" | "admin" | "system"
  uploadedByName?: string
  status: "pending" | "available" | "archived"
  isMailDocument?: boolean // Flag to distinguish mail documents from business documents
  createdAt: string
  updatedAt: string
}

// ============================================
// MAILROOM TYPES
// ============================================

export interface MailItem {
  id: string
  userId: string
  companyId: string
  companyName: string
  from: string
  subject: string
  type: "official" | "tax" | "legal" | "general"
  status: "new" | "read" | "processed"
  hasAttachment: boolean
  attachments?: MailAttachment[]
  receivedDate: string
  processedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MailAttachment {
  id: string
  name: string
  fileName: string // Added actual file name
  fileUrl: string
  fileSize: number
  mimeType: string
}

// ============================================
// SERVICE/ADDON TYPES
// ============================================

export interface Addon {
  id: string
  name: string
  description: string
  price: number
  category: "compliance" | "tax" | "legal" | "document" | "other"
  isActive: boolean
  icon?: string
  features?: string[]
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  category: "compliance" | "tax" | "legal" | "other"
  price: number
  billingCycle: "one-time" | "monthly" | "annual"
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string
  userId: string
  type: "order" | "document" | "mailroom" | "invoice" | "addon" | "system"
  title: string
  message: string
  isRead: boolean
  actionUrl?: string
  metadata?: Record<string, any>
  createdAt: string
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentDetails {
  orderId: string
  amount: number
  currency: string
  bankDetails: {
    accountName: string
    accountNumber: string
    ifscCode: string
    bankName: string
  }
  upiId?: string
  qrCodeUrl?: string
  whatsappNumber?: string // Added WhatsApp for payment
}

export interface PaymentVerification {
  orderId: string
  transactionId: string
  screenshot?: File
  status: "pending" | "verifying" | "approved" | "rejected"
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeCompanies: number
  pendingOrders: number
  revenueChange: number
  ordersChange: number
  companiesChange: number
  pendingChange: number
}

export interface AnalyticsData {
  revenue: Array<{ month: string; amount: number }>
  orders: Array<{ month: string; count: number }>
  topServices: Array<{ name: string; count: number; revenue: number }>
  customerGrowth: Array<{ month: string; customers: number }>
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface CompanyForm {
  name: string
  type: Company["type"]
  state: string
  address?: Company["address"]
}

export interface ProfileUpdateForm {
  name: string
  email: string
  phone: string
}

export interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
