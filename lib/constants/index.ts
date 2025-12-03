// Application constants
export const APP_NAME = "Business Formation SaaS"
export const APP_DESCRIPTION = "Professional business formation and compliance services"

// API Configuration
export const API_TIMEOUT = 30000 // 30 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

// Company Types
export const COMPANY_TYPES = ["LLC", "Corporation", "S-Corp", "Non-Profit"] as const

// US States
export const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const

// Document Types
export const DOCUMENT_TYPES = {
  articles: "Articles of Organization",
  "operating-agreement": "Operating Agreement",
  "ein-letter": "EIN Letter",
  certificate: "Certificate",
  other: "Other",
} as const

// Mail Types
export const MAIL_TYPES = {
  official: "Official",
  tax: "Tax",
  legal: "Legal",
  general: "General",
} as const

// Order Status
export const ORDER_STATUS = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
} as const

// Payment Status
export const PAYMENT_STATUS = {
  pending: "Pending",
  pending_verification: "Pending Verification",
  paid: "Paid",
  failed: "Failed",
} as const

// Account Status
export const ACCOUNT_STATUS = {
  pending_payment: "Pending Payment",
  pending_verification: "Pending Verification",
  active: "Active",
  suspended: "Suspended",
} as const
