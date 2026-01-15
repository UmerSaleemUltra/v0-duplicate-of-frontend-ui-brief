import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "us800750@gmail.com",
    pass: process.env.SMTP_PASS || "pbjsifufaairgniq",
  },
}

const SENDER_EMAIL = process.env.SMTP_USER || "us800750@gmail.com"
const SENDER_NAME = "BuzzFiling LLC Formation"

const transporter = nodemailer.createTransport(EMAIL_CONFIG)

let isVerified = false
transporter.verify((error, success) => {
  if (error) {
    console.error("[v0] Email transport verification failed:", error)
  } else {
    isVerified = true
    console.log("[v0] Email transport verified successfully")
  }
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    if (!to || !subject || !html) {
      console.error("[v0] Missing required email parameters:", { to: !!to, subject: !!subject, html: !!html })
      return { success: false, error: "Missing email parameters" }
    }

    console.log("[v0] Sending email to:", to)
    console.log("[v0] Email subject:", subject)
    console.log("[v0] HTML length:", html.length)
    console.log("[v0] Email credentials check:", {
      hasUser: !!EMAIL_CONFIG.auth.user,
      hasPass: !!EMAIL_CONFIG.auth.pass,
    })

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log("[v0] Email sent successfully. Message ID:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("[v0] Email send error:", error.message || error)
    if (error.code === "EAUTH") {
      console.error("[v0] Authentication failed - check SMTP_USER and SMTP_PASS")
    } else if (error.code === "ECONNREFUSED") {
      console.error("[v0] Connection refused - check SMTP host and port")
    }
    return { success: false, error: error.message }
  }
}

export const emailTemplates = {
  passwordReset: (name: string, resetLink: string) => ({
    subject: "Reset Your Password - BuzzFiling",
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background-color: #8b0000; height: 8px;"></td>
                </tr>
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We received a request to reset your password. Click the link below to create a new password:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #8b0000; color: #ffffff; text-decoration: none; border-radius: 25px; font-size: 14px; font-weight: 600;">Reset Password</a>
                    </div>
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                      <p style="margin: 0; font-size: 13px; color: #856404;">This link will expire in 1 hour.</p>
                    </div>
                    <p style="margin: 20px 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      If you didn't request this, please ignore this email and your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0;">All rights reserved © 2026 | BuzzFiling</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #8b0000; height: 8px;"></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),
}
