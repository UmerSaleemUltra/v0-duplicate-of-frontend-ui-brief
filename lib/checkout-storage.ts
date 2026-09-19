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

export const clearCompletedOrderData = clearCheckoutData

export const saveProgress = (): { success: boolean; message: string } => {
  if (typeof window === "undefined") {
    return { success: false, message: "Progress can only be saved in the browser." }
  }

  saveCheckoutData({})
  return { success: true, message: "Your progress has been saved." }
}
