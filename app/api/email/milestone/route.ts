import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/config/email"
import { verifyToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { to, subject, content } = await request.json()

    if (!to || !subject || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields: to, subject, content" }, { status: 400 })
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <div style="margin-bottom: 24px;">
          <img src="https://buzzfiling.com/images/buzz-filing-logo.png" alt="Buzz Filing" style="height: 36px;" />
        </div>
        <div style="white-space: pre-wrap; line-height: 1.6; font-size: 15px;">
          ${content.replace(/\n/g, "<br/>")}
        </div>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;" />
        <p style="font-size: 12px; color: #888;">Buzz Filing &mdash; hello@buzzfiling.com</p>
      </div>
    `

    const result = await sendEmail({ to, subject, html })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Milestone email error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
