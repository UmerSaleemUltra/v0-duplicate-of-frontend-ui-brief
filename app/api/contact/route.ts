import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/config/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    const emailHtml = `
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
                    <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #880000;">
                      New Contact Form Submission
                    </h2>
                    
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #333333;">
                      <strong>Name:</strong> ${name}
                    </p>
                    
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #333333;">
                      <strong>Email:</strong> ${email}
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Message:</strong>
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6; background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
                      ${message}
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
                    </p>
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

    const result = await sendEmail({
      to: "buzzfilings@gmail.com",
      subject: `Contact Form Submission from ${name}`,
      html: emailHtml,
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: "Message sent successfully" }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
    }
  } catch (error: any) {
    console.error(" Contact form error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
