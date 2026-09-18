export interface CheckoutData {
  accountInfo?: any
  businessInfo?: any
  ownerInfo?: any
  statePackage?: any
  addons?: any[]
  paymentMethod?: string
}

export const getCheckoutData = (): CheckoutData | null => {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("checkoutData")
  return data ? JSON.parse(data) : null
}

export const saveCheckoutData = (data: Partial<CheckoutData>): void => {
  if (typeof window === "undefined") return
  const existing = getCheckoutData() || {}
  localStorage.setItem("checkoutData", JSON.stringify({ ...existing, ...data }))
}

export const initCheckoutData = (): void => {
  if (typeof window === "undefined") return
  if (!getCheckoutData()) {
    saveCheckoutData({})
  }
}

export const clearCheckoutData = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("checkoutData")
}
