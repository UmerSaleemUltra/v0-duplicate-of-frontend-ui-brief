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
  welcome: (name: string) => ({
    subject: "Welcome to BuzzFiling — Your U.S. Business Journey Begins Here",
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding: 32px 40px 16px 40px; text-align: center;">
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 160px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px 32px 40px; text-align: center; background: linear-gradient(135deg, #8b0000 0%, #a00000 100%);">
                    <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 12px; margin: 0 auto; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">🎉</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 40px;">
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">
                      Dear ${name}, Welcome to <span style="color: #8b0000;">BuzzFiling</span>
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                      We're thrilled to have you onboard. Our platform makes forming and managing your U.S. LLC straightforward and hassle-free.
                    </p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #8b0000; padding: 24px; border-radius: 8px; margin: 32px 0;">
                      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Here's what you can do next:</h2>
                      <ul style="margin: 0; padding: 0; list-style: none;">
                        <li style="margin: 0 0 12px 0; padding-left: 28px; position: relative; font-size: 15px; color: #4a4a4a;"><span style="position: absolute; left: 0; color: #8b0000;">✓</span> Explore Your Dashboard</li>
                        <li style="margin: 0 0 12px 0; padding-left: 28px; position: relative; font-size: 15px; color: #4a4a4a;"><span style="position: absolute; left: 0; color: #8b0000;">✓</span> Check Out Our Resources</li>
                        <li style="margin: 0; padding-left: 28px; position: relative; font-size: 15px; color: #4a4a4a;"><span style="position: absolute; left: 0; color: #8b0000;">✓</span> Reach Out Anytime</li>
                      </ul>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b0000 0%, #a00000 100%); border-radius: 8px; padding: 16px 32px;">
                          <a href="https://buzzfiling.com/client/dashboard" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">Go to Dashboard →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">All rights reserved © 2026 | BuzzFiling</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),
  einUpdate: (name: string, status: string) => ({
    subject: "EIN Application Update — BuzzFiling",
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
                <tr><td style="background-color: #8b0000; height: 8px;"></td></tr>
                <tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" /></td></tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Dear ${name},</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">Your EIN application has been successfully submitted to the IRS.</p>
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Current Status: ${status}</p>
                    </div>
                  </td>
                </tr>
                <tr><td style="padding: 20px 40px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;"><p style="margin: 0;">All rights reserved © 2026 | BuzzFiling</p></td></tr>
                <tr><td style="background-color: #8b0000; height: 8px;"></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),
  documentsReady: (name: string, companyName: string) => ({
    subject: "Your Company Documents Are Ready — BuzzFiling",
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
                <tr><td style="background-color: #8b0000; height: 8px;"></td></tr>
                <tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" /></td></tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Dear ${name},</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">Great news! Your ${companyName} documents are now ready for download.</p>
                  </td>
                </tr>
                <tr><td style="padding: 20px 40px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;"><p style="margin: 0;">All rights reserved © 2026 | BuzzFiling</p></td></tr>
                <tr><td style="background-color: #8b0000; height: 8px;"></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),
  loginAlert: (name: string, loginTime: string) => ({
    subject: "New Login Detected - BuzzFiling",
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
                <tr><td style="background-color: #8b0000; height: 8px;"></td></tr>
                <tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" /></td></tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Dear ${name},</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">We detected a new login to your BuzzFiling account at ${loginTime}.</p>
                    <p style="margin: 20px 0; font-size: 14px; color: #666666;">If this was you, no action needed. If not, please contact support immediately.</p>
                  </td>
                </tr>
                <tr><td style="padding: 20px 40px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;"><p style="margin: 0;">All rights reserved © 2026 | BuzzFiling</p></td></tr>
                <tr><td style="background-color: #8b0000; height: 8px;"></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),
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
