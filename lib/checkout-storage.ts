export interface CheckoutData {
  account?: {
    email?: string
    password?: string
    phone?: string
    name?: string
    userId?: string
  }
  state?: {
    state?: string
    entityType?: "llc" | "s-corp"
    packageType?: "starter" | "advanced"
  }
  businessInfo?: {
    businessName?: string
    businessCategory?: string
    businessDescription?: string
    needsResellerCertificate?: boolean
  }
  members?: any[]
  orderId?: string
  createdAt?: string
  status?: string
  payment?: {
    method?: string
    status?: string
  }
  accountInfo?: any
  ownerInfo?: any
  statePackage?: any
  addons?: any[]
  paymentMethod?: string
  savedAt?: string
  expiresAt?: string
  currentStep?: number
}

export const getCheckoutData = (): CheckoutData | null => {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("checkoutData")
  if (!data) return null
  
  try {
    const parsed = JSON.parse(data)
    
    // Check if data has expired
    if (parsed.expiresAt) {
      const expiryDate = new Date(parsed.expiresAt)
      const now = new Date()
      
      if (now > expiryDate) {
        // Data expired, clear it
        clearCheckoutData()
        return null
      }
    }
    
    return parsed
  } catch {
    return null
  }
}

export const saveCheckoutData = (data: Partial<CheckoutData>): void => {
  if (typeof window === "undefined") return
  const existing = getCheckoutData() || {}
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7) // 7 days from now
  
  localStorage.setItem("checkoutData", JSON.stringify({ 
    ...existing, 
    ...data,
    savedAt: new Date().toISOString(),
    expiresAt: expiryDate.toISOString()
  }))
}

export const initCheckoutData = (): void => {
  if (typeof window === "undefined") return
  if (!getCheckoutData()) {
    saveCheckoutData({})
  }
}

export const clearCheckoutData = (): void => {
  if (typeof window === "undefined") return
  
  const existing = getCheckoutData()
  if (existing && existing.savedAt && existing.expiresAt) {
    // Keep the save progress structure but reset to initial state
    localStorage.setItem("checkoutData", JSON.stringify({
      savedAt: existing.savedAt,
      expiresAt: existing.expiresAt,
      currentStep: 0
    }))
  } else {
    localStorage.removeItem("checkoutData")
  }
}

export const saveCheckoutStep = (step: number): void => {
  if (typeof window === "undefined") return
  const existing = getCheckoutData() || {}
  saveCheckoutData({ ...existing, currentStep: step })
}

export const getSavedStep = (): number | null => {
  const data = getCheckoutData()
  return data?.currentStep !== undefined ? data.currentStep : null
}

export const saveProgress = (): { success: boolean; message: string } => {
  try {
    const data = getCheckoutData()
    if (!data) {
      return { success: false, message: "No data to save" }
    }
    
    // Re-save to update the timestamp and expiry
    saveCheckoutData(data)
    
    return { 
      success: true, 
      message: "Progress saved! Your data will be available for 7 days." 
    }
  } catch {
    return { success: false, message: "Failed to save progress" }
  }
}

export const clearCompletedOrderData = (): void => {
  if (typeof window === "undefined") return
  
  const existing = getCheckoutData()
  if (existing) {
    // Keep only save progress metadata, clear all form data
    localStorage.setItem("checkoutData", JSON.stringify({
      savedAt: new Date().toISOString(),
      expiresAt: existing.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      currentStep: 0
    }))
  }
}
