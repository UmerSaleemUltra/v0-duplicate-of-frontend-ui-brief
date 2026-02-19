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

  // Status fields - all manual (M)
  companyStatus?: "pending" | "active" | "inactive"
  registeredAgentStatus?: "pending" | "active" | "inactive"
  businessAddressStatus?: "pending" | "active" | "inactive"
  serviceStatus?: "pending" | "active" | "inactive"

  // Formation & Tax fields - manual (M)
  formationDate?: string // (M) - Admin sets formation date
  taxClassification?: string // (M) - Admin sets tax classification
  annualReportFilingDate?: string // (M) - Admin sets annual report date
  irsFilingDate?: string // (M) - Admin sets IRS filing date

  // Business ID fields - manual (M)
  businessId?: string // (M) - State filing number set by admin
  ein?: string // (M) - Admin assigns EIN
  itin?: string // (M) - Admin assigns ITIN/SSN

  // Registered Agent - manual (M)
  registeredAgent?: {
    name: string // (M)
    company?: string // (M)
    address: string // (M)
    city: string // (M)
    state: string // (M)
    zip: string // (M)
    phone?: string
    email?: string
    servicePeriod?: string // (M)
    expiryDate?: string // (M)
    status?: string // (M)
  }

  // Business Address - manual (M)
  businessAddress?: {
    companyName?: string // (M)
    street: string // (M)
    city: string // (M)
    state: string // (M)
    zip: string // (M)
    expiryDate?: string // (M)
    status?: string // (M)
  }

  // Fetched fields (F) - from forms/API
  businessCategory?: string // (F)
  businessDescription?: string // (F)
  businessWebsite?: string // (F)
  packageType?: string // (F)

  einDocument?: string
  notes?: string
  mailingAddress?: {
    street: string
    city: string
    state: string
    zip: string
  }
  milestones?: {
    orderSuccessfullyProcessed: boolean
    registeredAgentAssigned: boolean
    businessMailingAddressIssued: boolean
    companyFormationCompleted: boolean
    einApplicationSubmitted: boolean
    einObtained: boolean
  }
  customMilestones?: Array<{
    id: string
    title: string
    description?: string
    completed: boolean
    createdAt: string
    completedAt?: string
  }>

  // Members - fetched (F) with some manual fields (M)
  members?: Array<{
    address: string // (F)
    city: string // (F)
    state?: string // (F)
    zip: string // (F)
    isResponsiblePerson: boolean // (F)
    needsItin?: boolean // (F)
    passportKey?: string
    ssn?: string // (M) - Admin assigns SSN for ITIN purposes
  }>

  // Addons - fetched (F)
  purchasedAddons?: Array<{
    serviceId: string
    name: string
    price: number
    paymentDetails?: {
      phoneNumber?: string | null
      receiptUrl?: string | null
      receiptFileName?: string | null
      paymentMethod?: string
      createdAt?: string | Date
    }
    purchasedAt?: string | Date
  }> // (F) - List of purchased addons with pricing and payment details

  orders?: Order[]
  revenue?: number
  lastOrderDate?: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  id: string
  orderType: string
  packageType?: string
  state?: string
  status: "pending" | "processing" | "completed" | "cancelled"
  pricing: {
    packagePrice: number
    stateFilingFee: number
    addonsTotal: number
    subtotal: number
    total: number
  }
  selectedAddons?: Array<{
    id: string
    name: string
    price: number
  }>
  paymentInfo: {
    method: "whatsapp" | "bank_transfer" | "stripe"
    status: "pending" | "pending_verification" | "paid" | "failed"
    whatsappPhone?: string
    receiptUrl?: string
    date: string
    terms?: string
  }
  passportDocuments?: Array<{
    id: string
    memberId: string
    memberName: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    uploadedAt: string
  }>
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
// PASSPORT TYPES
// ============================================

export interface PassportDocument {
  id: string
  userId: string // Will be "checkout-pending" before account creation
  companyId?: string
  memberId?: string
  memberName: string
  fileName: string
  fileUrl: string
  fileType?: string
  mimeType: string
  fileSize: number
  uploadedAt: string
  updatedAt?: string
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
  from: string // Changed from 'sender'
  subject: string
  type: "official" | "tax" | "legal" | "general" | "letter" | "package" | "other"
  hasAttachment: boolean
  attachments?: MailAttachment[]
  receivedDate: string // Changed from 'receivedAt'
  processedDate?: string
  notes?: string
  // Legacy field mapping
  sender?: string // Alias for 'from'
  receivedAt?: string // Alias for 'receivedDate'
  documentId?: string // For backward compatibility with old system
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
