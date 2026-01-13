import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { generateOTP } from "@/config/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { rateLimit } from "@/lib/middleware/rate-limit"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { securityGuard } from "@/lib/middleware/security-guard"

// Rate limiter: 5 requests per 15 minutes
const forgotPasswordRateLimit = rateLimit({ windowMs: 900000, maxRequests: 5 })

// Global lock: ensures only 1 request at a time
let isProcessing = false

export async function POST(request: NextRequest) {
  // Security guard
  const securityResponse = await securityGuard(request)
  if (securityResponse) {
    return securityResponse
  }

  // Rate limiter
  const rateLimitResponse = await forgotPasswordRateLimit(request)
  if (rateLimitResponse) {
    return addSecurityHeaders(rateLimitResponse)
  }

  // Single request at a time
  if (isProcessing) {
    return addSecurityHeaders(apiError("Server busy. Try again later.", 429))
  }

  isProcessing = true // lock
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return addSecurityHeaders(apiError("Email is required", 400))
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const otpCollection = db.collection("otps")

    // Find user
    const user = await usersCollection.findOne({ email })
    if (!user) {
      // Don't reveal if email exists or not
      return addSecurityHeaders(apiResponse({ message: "If email exists, reset link will be sent" }))
    }

    // Generate reset token
    const resetToken = generateOTP()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in DB
    await otpCollection.insertOne({
      userId: user._id.toString(),
      otp: resetToken,
      type: "password_reset",
      expiresAt,
      createdAt: new Date().toISOString(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buzzfiling.com"

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&userId=${user._id.toString()}`

    const resetEmail = emailTemplates.passwordReset(user.name, resetLink)

    console.log("[v0] Attempting to send password reset email to:", email)
    const emailResult = await sendEmail({
      to: email,
      subject: resetEmail.subject,
      html: resetEmail.html,
    })

    if (!emailResult.success) {
      console.error("[v0] Password reset email failed for:", email, "Error:", emailResult.error)
      return addSecurityHeaders(apiError("Failed to send reset email. Please try again later.", 500))
    }

    console.log("[v0] Password reset email sent successfully to:", email, "Message ID:", emailResult.messageId)
    return addSecurityHeaders(apiResponse({ message: "If email exists, reset link will be sent" }))
  } catch (error) {
    console.error("Forgot password error:", error)
    return addSecurityHeaders(apiError("Failed to process request", 500))
  } finally {
    isProcessing = false // release lock
  }
}
