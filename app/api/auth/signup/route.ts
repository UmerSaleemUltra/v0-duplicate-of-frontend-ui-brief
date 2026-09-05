import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { hashPassword, generateToken } from "@/config/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { apiResponse, apiError } from "@/lib/api-middleware"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    // Validate required fields
    if (!name || !email || !password) {
      return apiError("Name, email, and password are required", 400)
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return apiError("User with this email already exists", 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser = {
      name,
      email,
      phone: phone || "",
      password: hashedPassword,
      role: "client" as const,
      accountStatus: "pending_verification" as const,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await usersCollection.insertOne(newUser)
    const userId = result.insertedId.toString()

    // Generate JWT token
    const token = generateToken({
      userId,
      email,
      role: "client",
    })

    // Send welcome email
    const welcomeEmail = emailTemplates.welcome(name)
    await sendEmail({
      to: email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
    })

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = newUser
    return apiResponse(
      {
        user: { id: userId, ...userWithoutPassword },
        token,
      },
      201,
    )
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return apiError("Failed to create account", 500)
  }
}
