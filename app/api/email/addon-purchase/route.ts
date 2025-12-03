import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, emailTemplates } from "@/config/email"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const { to, name, addonDetails } = body

    if (!to || !name || !addonDetails || !Array.isArray(addonDetails)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const email = emailTemplates.addonPurchaseConfirmation(name, addonDetails)

    const result = await sendEmail({
      to,
      subject: email.subject,
      html: email.html,
    })

    if (result.success) {
      const response = NextResponse.json({ success: true, messageId: result.messageId })
      addSecurityHeaders(response)
      return response
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
