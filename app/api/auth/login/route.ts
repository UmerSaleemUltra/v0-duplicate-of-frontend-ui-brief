import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { comparePassword, generateToken } from "@/config/jwt"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { sendEmail, emailTemplates } from "@/config/email"
import { validateEmail } from "@/lib/validation"
import { loginRateLimit, clearLoginAttempts } from "@/lib/middleware/advanced-rate-limit"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { securityGuard } from "@/lib/middleware/security-guard"

export async function POST(request: NextRequest) {
  const securityResponse = await securityGuard(request)
  if (securityResponse) {
    return securityResponse
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError("Please enter your email and password", 400)
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return apiError("Please provide valid email and password", 400)
    }

    if (!validateEmail(email)) {
      return apiError("Please provide a valid email address", 400)
    }

    const rateLimitResult = await loginRateLimit(request, email)
    if (rateLimitResult instanceof Response) {
      return addSecurityHeaders(rateLimitResult)
    }

    let db
    try {
      db = await getDatabase()
    } catch (dbError) {
      return apiError("Unable to connect to the database. Please try again later.", 500)
    }

    const usersCollection = db.collection("users")

    let user
    try {
      user = await usersCollection.findOne({ email })
    } catch (queryError) {
      return apiError("Unable to search for user. Please try again later.", 500)
    }

    if (!user) {
      return apiError("Invalid email or password. Please check your credentials and try again.", 401)
    }

    const userId = user._id?.toString() || user.id?.toString()

    if (!userId) {
      return apiError("There was a problem with your account. Please contact support.", 500)
    }

    if (!user.password) {
      return apiError("Invalid email or password. Please check your credentials and try again.", 401)
    }

    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      const attemptsMessage = rateLimitResult.userRemaining
        ? ` (${rateLimitResult.userRemaining} attempts remaining)`
        : ""

      return apiError(`Invalid email or password. Please check your credentials and try again.${attemptsMessage}`, 401)
    }

    clearLoginAttempts(email)

    const token = generateToken({
      userId: userId,
      email: user.email,
      role: user.role,
    })

    const userResponse = {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || "",
      createdAt: user.createdAt,
    }

    const isFirstLogin = !user.lastLoginAt

    try {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      )
    } catch (updateError) {
      // Non-fatal error
    }

    try {
      const loginTime = new Date().toLocaleString()

      if (isFirstLogin) {
        const welcomeEmail = emailTemplates.welcome(userResponse.name)
        await sendEmail({
          to: email,
          subject: "Welcome to Buzz Filing! 🎉",
          html: welcomeEmail.html,
        })
      } else {
        const loginEmail = emailTemplates.loginNotification(userResponse.name, loginTime)
        await sendEmail({
          to: email,
          subject: loginEmail.subject,
          html: loginEmail.html,
        })
      }
    } catch (emailError) {
      // Email failure is non-fatal
    }

    return addSecurityHeaders(
      apiResponse({
        user: userResponse,
        token,
      }),
    )
  } catch (error) {
    return addSecurityHeaders(apiError("We couldn't log you in at this time. Please try again.", 500))
  }
}
