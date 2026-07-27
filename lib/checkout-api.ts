/**
 * API utility functions for checkout process
 * Handles token generation, user signup, order creation, and receipt uploads
 */

import type { CheckoutData } from "./checkout-storage"

/**
 * Generate checkout token for tracking
 */
export const generateCheckoutToken = async (email: string, sessionId: string): Promise<string> => {
  try {
    const response = await fetch("/api/checkout/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sessionId }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate checkout token")
    }

    const data = await response.json()
    return data.checkoutToken
  } catch (error) {
    console.error("[v0] Error generating checkout token:", error)
    throw error
  }
}

/**
 * Sign up user during checkout
 */
export const signupUser = async (
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, phone }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || "Signup failed" }
    }

    const data = await response.json()
    return { success: true, userId: data.userId }
  } catch (error) {
    console.error("[v0] Error signing up user:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Create order from checkout data
 */
export const createOrder = async (
  checkoutData: CheckoutData,
  checkoutToken: string
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const response = await fetch("/api/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${checkoutToken}`,
      },
      body: JSON.stringify(checkoutData),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || "Order creation failed" }
    }

    const data = await response.json()
    return { success: true, orderId: data.id }
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Save abandoned checkout
 */
export const saveAbandonedCheckout = async (
  checkoutData: CheckoutData,
  sessionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch("/api/abandoned-checkouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        email: checkoutData.account?.email,
        name: checkoutData.account?.name,
        phone: checkoutData.account?.phone,
        lastStep: checkoutData.currentStep || 0,
        state: checkoutData.state?.state,
        packageType: checkoutData.state?.packageType,
        businessName: checkoutData.businessInfo?.businessName,
        estimatedTotal: calculateTotal(checkoutData),
        packagePrice: getPackagePrice(checkoutData.state?.packageType),
        addons: checkoutData.addons || [],
      }),
    })

    if (!response.ok) {
      return { success: false, error: "Failed to save abandoned checkout" }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error saving abandoned checkout:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Upload payment receipt file
 */
export const uploadReceipt = async (
  file: File,
  checkoutToken: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/payment-receipt/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || "Upload failed" }
    }

    const data = await response.json()
    return { success: true, url: data.url }
  } catch (error) {
    console.error("[v0] Error uploading receipt:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Calculate total price from checkout data
 */
const calculateTotal = (checkoutData: CheckoutData): number => {
  let total = getPackagePrice(checkoutData.state?.packageType) || 0

  // Add addon prices
  if (checkoutData.addons && Array.isArray(checkoutData.addons)) {
    checkoutData.addons.forEach((addon: any) => {
      if (addon.price) total += addon.price
    })
  }

  return total
}

/**
 * Get package price by type
 */
const getPackagePrice = (packageType?: string): number => {
  const prices: Record<string, number> = {
    starter: 149,
    advanced: 249,
    professional: 349,
  }
  return prices[packageType || "starter"] || 149
}
