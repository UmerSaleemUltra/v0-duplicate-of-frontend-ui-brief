// Partner White-Label Types

export interface Partner {
  id: string
  name: string
  domain: string
  branding: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    companyName?: string
  }
  webhookUrl?: string
  webhookSecret: string
  apiKeys: PartnerApiKey[]
  status: "active" | "suspended" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface PartnerApiKey {
  id: string
  key: string
  secret: string
  name: string
  lastUsedAt?: string
  createdAt: string
  revokedAt?: string
}

export interface PartnerCheckoutSession {
  id: string
  partnerId: string
  email: string
  businessName: string
  phone?: string
  state: string
  packageType: string
  addons: string[]
  redirectUrl: string
  expiresAt: string
  status: "active" | "completed" | "expired"
  createdAt: string
}

export interface PartnerCheckoutCreateRequest {
  partnerId: string
  businessName: string
  email: string
  phone?: string
  state: string
  packageType: string
  addons?: string[]
  redirectUrl?: string
  customData?: Record<string, any>
}

export interface PartnerCheckoutCreateResponse {
  checkoutSessionId: string
  checkoutUrl: string
  expiresIn: number
  status: string
}

export interface PartnerWebhookPayload {
  event: "checkout.completed" | "checkout.abandoned" | "order.created" | "payment.received"
  timestamp: string
  data: {
    checkoutSessionId?: string
    orderId?: string
    customerId?: string
    partnerId: string
    email: string
    businessName: string
    packageType: string
    addons: string[]
    amount: number
    status: string
    customData?: Record<string, any>
  }
}

export interface PartnerOrder {
  id: string
  partnerId: string
  email: string
  businessName: string
  phone?: string
  state: string
  packageType: string
  addons: string[]
  amount: number
  status: "pending" | "payment_received" | "processing" | "completed"
  paymentMethod: string
  customData?: Record<string, any>
  createdAt: string
  updatedAt: string
}
