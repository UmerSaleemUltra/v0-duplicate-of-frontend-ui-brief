import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "client"
}

export async function verifyAuth(request: Request | NextRequest): Promise<{
  authenticated: boolean
  user?: AuthUser
  error?: string
}> {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    let token: string | null = null

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }

    // If no token in header, check cookies
    if (!token) {
      const cookieHeader = request.headers.get("cookie")
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=")
            return [key, v.join("=")]
          }),
        )
        token = cookies.auth_token || cookies.admin_auth_token
      }
    }

    if (!token) {
      return {
        authenticated: false,
        error: "No authentication token found",
      }
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Check token expiration if present
    if (payload.exp) {
      const expirationTime = (payload.exp as number) * 1000
      if (Date.now() > expirationTime) {
        return {
          authenticated: false,
          error: "Token has expired",
        }
      }
    }

    const user: AuthUser = {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "admin" | "client",
    }

    return {
      authenticated: true,
      user,
    }
  } catch (error) {
    return {
      authenticated: false,
      error: "Invalid or expired token",
    }
  }
}
