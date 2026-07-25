import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { comparePassword } from "@/config/jwt"
import { apiResponse, apiError } from "@/lib/api-middleware"
import { sendEmail, emailTemplates } from "@/config/email"
import { validateEmail } from "@/lib/validation"
import { loginRateLimit, clearLoginAttempts } from "@/lib/middleware/advanced-rate-limit"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { securityGuard } from "@/lib/middleware/security-guard"
import { createSecureSession, logTokenActivity } from "@/lib/secure-token-service"
import { getClientIpAddress } from "@/lib/device-fingerprint"
import { getGeoLocation, formatGeoLocation } from "@/lib/geolocation"

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
      // Hint the email index so MongoDB doesn't do a collection scan
      user = await usersCollection.findOne(
        { email },
        { projection: { _id: 1, email: 1, password: 1, name: 1, role: 1, phone: 1, createdAt: 1, lastLoginAt: 1 } },
      )
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

    // Get device info from request
    const clientIpAddress = getClientIpAddress(request)
    const userAgent = request.headers.get("user-agent") || ""
    const deviceFingerprint = request.headers.get("X-Device-Fingerprint") || ""

    // Get geolocation
    let country = "Unknown"
    let city = "Unknown"
    try {
      const geo = await getGeoLocation(clientIpAddress)
      country = geo.country
      city = geo.city
    } catch (geoError) {
      // Non-fatal - geolocation service may be unavailable
      console.warn("[v0] Geolocation lookup failed:", geoError)
    }

    // Create secure session with device/IP binding
    let tokenData
    try {
      tokenData = await createSecureSession(userId, user.email, user.role, deviceFingerprint, clientIpAddress, country, city, userAgent)
    } catch (sessionError) {
      console.error("[v0] Failed to create secure session:", sessionError)
      return apiError("Failed to create secure session. Please try again.", 500)
    }

    const userResponse = {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || "",
      createdAt: user.createdAt,
    }

    const isFirstLogin = !user.lastLoginAt

    // Fire-and-forget: update lastLoginAt without blocking the response
    usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginIp: clientIpAddress,
          lastLoginDevice: deviceFingerprint,
        },
      },
    ).catch(() => { /* Non-fatal */ })

    // Fire-and-forget: send login email without blocking the response
    ;(async () => {
      try {
        const loginDateTime = new Date()
        const pakistaniTime = new Date(loginDateTime.toLocaleString("en-US", { timeZone: "Asia/Karachi" }))
        const formattedLoginTime =
          pakistaniTime.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }) +
          " at " +
          pakistaniTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }) +
          " PST"

        if (isFirstLogin) {
          const welcomeEmail = emailTemplates.welcome(userResponse.name)
          if (welcomeEmail && welcomeEmail.html && welcomeEmail.subject) {
            await sendEmail({
              to: email,
              subject: welcomeEmail.subject,
              html: welcomeEmail.html,
            })
          }
        } else {
          const loginEmail = emailTemplates.loginAlert(userResponse.name, formattedLoginTime)
          if (loginEmail && loginEmail.html && loginEmail.subject) {
            await sendEmail({
              to: email,
              subject: loginEmail.subject,
              html: loginEmail.html,
            })
          }
        }
      } catch (emailError) {
        // Email failure is non-fatal, logged silently
      }
    })()

    // Add tokens to httpOnly cookies
    const response = addSecurityHeaders(
      apiResponse({
        user: userResponse,
        sessionId: tokenData.sessionId,
        loginLocation: `${city}, ${country}`,
      }),
    )

    // Set httpOnly cookies with tokens
    response.cookies.set("accessToken", tokenData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    })

    response.cookies.set("refreshToken", tokenData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    return addSecurityHeaders(apiError("We couldn't log you in at this time. Please try again.", 500))
  }
}
