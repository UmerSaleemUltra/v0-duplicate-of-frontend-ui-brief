import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { hashPassword } from "@/config/jwt"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, token, newPassword } = body

    if (!userId || !token || !newPassword) {
      return apiError("User ID, token, and new password are required", 400)
    }

    const db = await getDatabase()
    const otpCollection = db.collection("otps")
    const usersCollection = db.collection("users")

    // Verify reset token
    const otpDoc = await otpCollection.findOne({
      userId,
      otp: token,
      type: "password_reset",
      expiresAt: { $gt: new Date() },
    })

    if (!otpDoc) {
      return apiError("Invalid or expired reset token", 400)
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    // Delete used token
    await otpCollection.deleteOne({ _id: otpDoc._id })

    return apiResponse({ message: "Password reset successfully" })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return apiError("Failed to reset password", 500)
  }
}
