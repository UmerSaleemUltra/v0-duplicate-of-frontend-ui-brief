import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { hashPassword, generateToken } from "@/config/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { validateEmail, validatePassword, validatePhone, sanitizeString } from "@/lib/validation"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function GET() {
  return addSecurityHeaders(apiError("Please use POST method to signup", 405))
}

export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return addSecurityHeaders(apiError("Please provide your name, email, and password", 400))
    }

    if (!validateEmail(email)) {
      return addSecurityHeaders(apiError("Please provide a valid email address", 400))
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return addSecurityHeaders(apiError(passwordValidation.error || "Invalid password", 400))
    }

    if (phone && !validatePhone(phone)) {
      return addSecurityHeaders(apiError("Please provide a valid phone number", 400))
    }

    const sanitizedName = sanitizeString(name, 100)
    const sanitizedPhone = phone ? sanitizeString(phone, 20) : ""

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return addSecurityHeaders(apiError("An account with this email already exists", 409))
    }

    const hashedPassword = await hashPassword(password)

    const newUser = {
      name: sanitizedName,
      email,
      phone: sanitizedPhone,
      password: hashedPassword,
      role: "client" as const,
      accountStatus: "active" as const,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await usersCollection.insertOne(newUser)
    const userId = result.insertedId.toString()

    const token = generateToken({
      userId,
      email,
      role: "client",
    })

    // Send welcome email (non-blocking)
    try {
      const welcomeEmail = emailTemplates.welcome(sanitizedName)
      await sendEmail({
        to: email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
      })
    } catch (emailError) {
      // Email failure is non-fatal
    }

    const { password: _, ...userWithoutPassword } = newUser
    return addSecurityHeaders(apiResponse(
      {
        user: { id: userId, ...userWithoutPassword },
        token,
      },
      201,
    ))
  } catch (error) {
    return addSecurityHeaders(apiError("We couldn't create your account at this time. Please try again.", 500))
  }
}
