import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { getCachedPromoCode } from "@/lib/cache/promo-cache"

// POST - Validate promo code (public endpoint for checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderAmount, packageType, email } = body

    if (!code) {
      return addSecurityHeaders(apiError("Promo code is required", 400))
    }

    const db = await getDatabase()
    const normalizedCode = code.toUpperCase().trim()

    // Try to get from cache, otherwise fetch from database
    let promoCode = null
    
    // First check cache by searching through all cached codes (simple approach)
    // For production, consider indexing by code in cache as well
    const cachedCode = await getCachedPromoCode(normalizedCode, async () => {
      const doc = await db.collection("promo_codes").findOne({ code: normalizedCode })
      return doc
    })
    
    promoCode = cachedCode

    if (!promoCode) {
      return addSecurityHeaders(apiError("Invalid promo code", 404))
    }

    // Check if active
    if (!promoCode.isActive) {
      return addSecurityHeaders(apiError("This promo code is no longer active", 400))
    }

    // Check validity period
    const now = new Date()
    if (promoCode.validFrom && now < new Date(promoCode.validFrom)) {
      return addSecurityHeaders(apiError("This promo code is not yet valid", 400))
    }
    if (promoCode.validUntil && now > new Date(promoCode.validUntil)) {
      return addSecurityHeaders(apiError("This promo code has expired", 400))
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return addSecurityHeaders(apiError("This promo code has reached its usage limit", 400))
    }

    // Check per-user limit (if email provided)
    if (promoCode.perUserLimit && email) {
      const userUsageCount = await db.collection("orders").countDocuments({
        "promoCode.code": normalizedCode,
        "account.email": email,
      })
      if (userUsageCount >= promoCode.perUserLimit) {
        return addSecurityHeaders(apiError("You have already used this promo code the maximum number of times", 400))
      }
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount && orderAmount && orderAmount < promoCode.minOrderAmount) {
      return addSecurityHeaders(
        apiError(`Minimum order amount of $${promoCode.minOrderAmount} required for this code`, 400)
      )
    }

    // Check package applicability
    if (promoCode.applicableTo !== "all" && packageType && promoCode.applicableTo !== packageType) {
      return addSecurityHeaders(
        apiError(`This promo code is only valid for ${promoCode.applicableTo} package`, 400)
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (promoCode.discountType === "percentage") {
      discountAmount = Math.round((orderAmount || 0) * (promoCode.discountValue / 100))
      // Apply max discount cap if set
      if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
        discountAmount = promoCode.maxDiscountAmount
      }
    } else {
      discountAmount = promoCode.discountValue
    }

    // Don't let discount exceed order amount
    if (orderAmount && discountAmount > orderAmount) {
      discountAmount = orderAmount
    }

    return addSecurityHeaders(
      apiResponse({
        valid: true,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discountAmount,
        maxDiscountAmount: promoCode.maxDiscountAmount,
        minOrderAmount: promoCode.minOrderAmount,
        applicableTo: promoCode.applicableTo,
      })
    )
  } catch (error: any) {
    console.error("Error validating promo code:", error)
    return addSecurityHeaders(apiError(error.message || "Failed to validate promo code", 500))
  }
}
