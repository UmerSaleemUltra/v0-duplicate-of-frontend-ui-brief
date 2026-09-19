import type { NextRequest } from "next/server"
import { connectDB } from "@/config/database"
import { apiResponse, apiError, requireAuth } from "@/lib/api-middleware"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { passwordUpdateRateLimit } from "@/lib/middleware/advanced-rate-limit"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

const JWT_SECRET = process.env.JWT_SECRET || "@Saleem8637"

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const rateLimitResult = await passwordUpdateRateLimit(user.email)

    if (!rateLimitResult.allowed) {
      return addSecurityHeaders(
        apiError(
          `Too many password update attempts. Please try again in ${rateLimitResult.remainingTime} minutes.`,
          429,
        ),
      )
    }

    const { db } = await connectDB()
    const usersCollection = db.collection("users")

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return apiError("Current password and new password are required", 400)
    }

    if (newPassword.length < 8) {
      return apiError("New password must be at least 8 characters long", 400)
    }

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })

    if (!userDoc) {
      return apiError("User not found", 404)
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, userDoc.password)

    if (!isPasswordValid) {
      return apiError(`Current password is incorrect. ${rateLimitResult.remaining} attempts remaining.`, 401)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          password: hashedPassword,
          plainPassword: newPassword,
          updatedAt: new Date(),
        },
      },
    )

    const { sendEmail, emailTemplates } = await import("@/config/email")

    try {
      const emailTemplate = emailTemplates.passwordChanged(userDoc.name, userDoc.email)
      await sendEmail({
        to: userDoc.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })
    } catch (emailError) {
      console.error(" Password change email failed:", emailError)
      // Don't fail the password change if email fails
    }

    const newToken = jwt.sign(
      {
        userId: user.userId,
        email: userDoc.email,
        role: userDoc.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Broadcast logout to old sessions
    const { broadcast } = await import("@/lib/realtime/broadcaster")
    broadcast("force_logout", {
      userId: user.userId,
      reason: "password_changed",
      timestamp: new Date().toISOString(),
    })

    return addSecurityHeaders(
      apiResponse({
        message: "Password changed successfully",
        token: newToken,
        user: {
          id: userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.name,
          role: userDoc.role,
        },
      }),
    )
  } catch (error) {
    return apiError("Failed to change password. Please try again.", 500)
  }
})
