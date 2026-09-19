import type { NextRequest } from "next/server"
import { generateCheckoutToken } from "@/lib/checkout-token"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { validateEmail } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return addSecurityHeaders(apiError("Email is required", 400))
    }

    if (!validateEmail(email)) {
      return addSecurityHeaders(apiError("Invalid email address", 400))
    }

    // Generate a secure checkout token tied to this email
    const token = await generateCheckoutToken(email)

    return addSecurityHeaders(apiResponse({ checkoutToken: token }, 201))
  } catch (error) {
    console.error("[v0] Checkout token generation error:", error)
    return addSecurityHeaders(apiError("Failed to initialize checkout session", 500))
  }
}
