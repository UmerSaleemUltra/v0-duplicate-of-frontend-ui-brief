import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { generateOTP } from "@/config/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { apiResponse, apiError } from "@/lib/api-middleware"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return apiError("Email is required", 400)
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const otpCollection = db.collection("otps")

    // Find user
    const user = await usersCollection.findOne({ email })
    if (!user) {
      // Don't reveal if email exists or not for security
      return apiResponse({ message: "If email exists, reset link will be sent" })
    }

    // Generate reset token (using OTP for simplicity, or can use unique token)
    const resetToken = generateOTP()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token
    await otpCollection.insertOne({
      userId: user._id.toString(),
      otp: resetToken,
      type: "password_reset",
      expiresAt,
      createdAt: new Date().toISOString(),
    })

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&userId=${user._id.toString()}`

    // Send reset password email
    const resetEmail = emailTemplates.resetPassword(user.name, resetLink)
    await sendEmail({
      to: email,
      subject: resetEmail.subject,
      html: resetEmail.html,
    })

    return apiResponse({ message: "If email exists, reset link will be sent" })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return apiError("Failed to process request", 500)
  }
}
