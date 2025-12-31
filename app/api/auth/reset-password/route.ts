import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { hashPassword } from "@/config/jwt"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { ObjectId } from "mongodb"
import { passwordUpdateRateLimit } from "@/lib/middleware/advanced-rate-limit"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, token, newPassword } = body

    if (!userId || !token || !newPassword) {
      return apiError("User ID, token, and new password are required", 400)
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return apiError("User not found", 404)
    }

    const rateLimitResult = await passwordUpdateRateLimit(user.email)

    if (!rateLimitResult.allowed) {
      return addSecurityHeaders(
        apiError(
          `Too many password reset attempts. Please try again in ${rateLimitResult.remainingTime} minutes.`,
          429,
        ),
      )
    }

    const otpCollection = db.collection("otps")

    const otpDoc = await otpCollection.findOne({
      userId,
      otp: token,
      type: "password_reset",
      expiresAt: { $gt: new Date() },
    })

    if (!otpDoc) {
      return apiError("Invalid or expired reset token", 400)
    }

    const hashedPassword = await hashPassword(newPassword)

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    await otpCollection.deleteOne({ _id: otpDoc._id })

    return addSecurityHeaders(apiResponse({ message: "Password reset successfully" }))
  } catch (error) {
    return apiError("Failed to reset password", 500)
  }
}
