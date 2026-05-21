import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { verifyToken } from "@/config/jwt"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { ObjectId } from "mongodb"

// Promo code schema:
// {
//   _id: ObjectId,
//   code: string (unique, uppercase),
//   description: string,
//   discountType: "percentage" | "fixed",
//   discountValue: number,
//   minOrderAmount: number (optional),
//   maxDiscountAmount: number (optional, for percentage discounts),
//   usageLimit: number (optional, total uses allowed),
//   usedCount: number,
//   perUserLimit: number (optional, uses per user),
//   validFrom: Date,
//   validUntil: Date,
//   applicableTo: "all" | "starter" | "advanced" (package types),
//   isActive: boolean,
//   createdAt: Date,
//   updatedAt: Date,
//   createdBy: string (admin userId)
// }

// GET - List all promo codes (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return addSecurityHeaders(apiError("Authentication required", 401))
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(apiError("Admin access required", 403))
    }

    const db = await getDatabase()
    const promoCodes = await db
      .collection("promo_codes")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return addSecurityHeaders(apiResponse(promoCodes))
  } catch (error: any) {
    console.error("Error fetching promo codes:", error)
    return addSecurityHeaders(apiError(error.message || "Failed to fetch promo codes", 500))
  }
}

// POST - Create new promo code (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return addSecurityHeaders(apiError("Authentication required", 401))
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(apiError("Admin access required", 403))
    }

    const body = await request.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perUserLimit,
      validFrom,
      validUntil,
      applicableTo,
    } = body

    // Validation
    if (!code || !discountType || !discountValue) {
      return addSecurityHeaders(apiError("Code, discount type, and discount value are required", 400))
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return addSecurityHeaders(apiError("Discount type must be 'percentage' or 'fixed'", 400))
    }

    if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
      return addSecurityHeaders(apiError("Percentage discount must be between 1 and 100", 400))
    }

    if (discountType === "fixed" && discountValue < 1) {
      return addSecurityHeaders(apiError("Fixed discount must be at least $1", 400))
    }

    const db = await getDatabase()

    // Check if code already exists
    const normalizedCode = code.toUpperCase().trim()
    const existingCode = await db.collection("promo_codes").findOne({ code: normalizedCode })
    if (existingCode) {
      return addSecurityHeaders(apiError("Promo code already exists", 409))
    }

    const promoCode = {
      code: normalizedCode,
      description: description || "",
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usedCount: 0,
      perUserLimit: perUserLimit ? Number(perUserLimit) : null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      applicableTo: applicableTo || "all",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.userId,
    }

    const result = await db.collection("promo_codes").insertOne(promoCode)

    return addSecurityHeaders(
      apiResponse({ ...promoCode, _id: result.insertedId }, "Promo code created successfully")
    )
  } catch (error: any) {
    console.error("Error creating promo code:", error)
    return addSecurityHeaders(apiError(error.message || "Failed to create promo code", 500))
  }
}

// PATCH - Update promo code (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return addSecurityHeaders(apiError("Authentication required", 401))
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(apiError("Admin access required", 403))
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return addSecurityHeaders(apiError("Promo code ID is required", 400))
    }

    const db = await getDatabase()

    // If updating the code, check it doesn't conflict with existing
    if (updates.code) {
      updates.code = updates.code.toUpperCase().trim()
      const existingCode = await db.collection("promo_codes").findOne({
        code: updates.code,
        _id: { $ne: new ObjectId(id) },
      })
      if (existingCode) {
        return addSecurityHeaders(apiError("Promo code already exists", 409))
      }
    }

    // Convert date strings to Date objects
    if (updates.validFrom) updates.validFrom = new Date(updates.validFrom)
    if (updates.validUntil) updates.validUntil = new Date(updates.validUntil)

    updates.updatedAt = new Date()

    const result = await db.collection("promo_codes").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    )

    if (!result) {
      return addSecurityHeaders(apiError("Promo code not found", 404))
    }

    return addSecurityHeaders(apiResponse(result, "Promo code updated successfully"))
  } catch (error: any) {
    console.error("Error updating promo code:", error)
    return addSecurityHeaders(apiError(error.message || "Failed to update promo code", 500))
  }
}

// DELETE - Delete promo code (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return addSecurityHeaders(apiError("Authentication required", 401))
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(apiError("Admin access required", 403))
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return addSecurityHeaders(apiError("Promo code ID is required", 400))
    }

    const db = await getDatabase()
    const result = await db.collection("promo_codes").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return addSecurityHeaders(apiError("Promo code not found", 404))
    }

    return addSecurityHeaders(apiResponse(null, "Promo code deleted successfully"))
  } catch (error: any) {
    console.error("Error deleting promo code:", error)
    return addSecurityHeaders(apiError(error.message || "Failed to delete promo code", 500))
  }
}
