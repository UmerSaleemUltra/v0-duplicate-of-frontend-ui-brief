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

    // Build reset link
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.PUBLIC_APP_URL}` : null) ||
      request.headers.get("origin") ||
      "https://v0-frontend-ui-brief.vercel.app/"

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&userId=${user._id.toString()}`

    // Send email
    const resetEmail = emailTemplates.passwordReset(user.name, resetLink)
    await sendEmail({
      to: email,
      subject: resetEmail.subject,
      html: resetEmail.html,
    })

    return addSecurityHeaders(apiResponse({ message: "If email exists, reset link will be sent" }))
  } catch (error) {
    console.error("Forgot password error:", error)
    return addSecurityHeaders(apiError("Failed to process request", 500))
  } finally {
    isProcessing = false // release lock
  }
}
