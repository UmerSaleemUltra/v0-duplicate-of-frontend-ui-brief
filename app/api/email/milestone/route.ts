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
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">

                  <tr>
                    <td style="padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 40px 40px 40px;">
                      <div style="font-size: 14px; color: #333333; line-height: 1.6; white-space: pre-wrap;">
                        ${content.replace(/\n/g, "<br/>")}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 40px 40px 40px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #999999;">
                        All rights reserved &copy; 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
                      </p>
                      <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #880000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
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
