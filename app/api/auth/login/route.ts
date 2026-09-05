import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { comparePassword, generateToken } from "@/config/jwt"
import { apiResponse, apiError } from "@/lib/api-middleware"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return apiError("Email and password are required", 400)
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Find user by email
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return apiError("Invalid email or password", 401)
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return apiError("Invalid email or password", 401)
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user
    return apiResponse({
      user: { id: user._id.toString(), ...userWithoutPassword },
      token,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return apiError("Failed to login", 500)
  }
}
