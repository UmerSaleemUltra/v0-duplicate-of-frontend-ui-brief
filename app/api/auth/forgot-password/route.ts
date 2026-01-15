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

  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.trim()) {
      return addSecurityHeaders(apiError("Email is required", 400))
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return addSecurityHeaders(
        apiResponse({
          message:
            "If an account exists with this email, a reset link will be sent. Please check your email (including spam folder).",
          success: true,
        }),
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const otpCollection = db.collection("otps")

    // Find user
    const user = await usersCollection.findOne({ email: email.trim().toLowerCase() })
    if (!user) {
      return addSecurityHeaders(
        apiResponse({
          message:
            "If an account exists with this email, a reset link will be sent. Please check your email (including spam folder).",
          success: true,
        }),
      )
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

    const resetEmail = emailTemplates.passwordReset(user.name || "User", resetLink)

    if (!resetEmail) {
      console.error("[v0] Password reset email template returned null")
      return addSecurityHeaders(apiError("Email template error", 500))
    }

    if (!resetEmail.subject || !resetEmail.html) {
      console.error("[v0] Password reset email template missing fields:", {
        hasSubject: !!resetEmail.subject,
        hasHtml: !!resetEmail.html,
      })
      return addSecurityHeaders(apiError("Email template error", 500))
    }

    console.log("[v0] Sending password reset email to:", email.trim().toLowerCase())

    const emailPromise = sendEmail({
      to: email.trim().toLowerCase(),
      subject: resetEmail.subject,
      html: resetEmail.html,
    })

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Email send timeout")), 10000))

    const emailResult = await Promise.race([emailPromise, timeoutPromise])

    if (!emailResult || !emailResult.success) {
      console.error("[v0] Password reset email failed. Result:", emailResult)
      return addSecurityHeaders(apiError("Failed to send reset email. Please try again later.", 500))
    }

    console.log("[v0] Password reset email sent successfully")
    return addSecurityHeaders(
      apiResponse({
        message:
          "If an account exists with this email, a reset link will be sent. Please check your email (including spam folder).",
      }),
    )
  } catch (error: any) {
    console.error("[v0] Forgot password error:", error.message)
    return addSecurityHeaders(apiError("Failed to process request", 500))
  }
}
