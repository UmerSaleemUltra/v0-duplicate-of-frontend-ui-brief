import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { generateOTP } from "@/config/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { apiResponse, apiError, requireAuth } from "@/lib/api-middleware"
import { ObjectId } from "mongodb"

// Send verification OTP
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const otpCollection = db.collection("otps")

    // Get user details
    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })
    if (!userDoc) {
      return apiError("User not found", 404)
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP
    await otpCollection.insertOne({
      userId: user.userId,
      otp,
      type: "email_verification",
      expiresAt,
      createdAt: new Date().toISOString(),
    })

    // Send verification email
    const verifyEmail = emailTemplates.verifyEmail(userDoc.name, otp)
    await sendEmail({
      to: userDoc.email,
      subject: verifyEmail.subject,
      html: verifyEmail.html,
    })

    return apiResponse({ message: "Verification code sent to your email" })
  } catch (error) {
    console.error("[v0] Verify email error:", error)
    return apiError("Failed to send verification code", 500)
  }
})

// Verify OTP
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, otp } = body

    if (!userId || !otp) {
      return apiError("User ID and OTP are required", 400)
    }

    const db = await getDatabase()
    const otpCollection = db.collection("otps")
    const usersCollection = db.collection("users")

    // Find valid OTP
    const otpDoc = await otpCollection.findOne({
      userId,
      otp,
      type: "email_verification",
      expiresAt: { $gt: new Date() },
    })

    if (!otpDoc) {
      return apiError("Invalid or expired OTP", 400)
    }

    // Update user email verification status
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    // Delete used OTP
    await otpCollection.deleteOne({ _id: otpDoc._id })

    return apiResponse({ message: "Email verified successfully" })
  } catch (error) {
    console.error("[v0] OTP verification error:", error)
    return apiError("Failed to verify OTP", 500)
  }
}
