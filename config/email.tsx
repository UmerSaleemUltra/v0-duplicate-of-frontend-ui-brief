import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "us800750@gmail.com",
    pass: "pbjsifufaairgniq",
  },
}

const SENDER_EMAIL = "us800750@gmail.com"
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

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log("[v0] Email sent successfully. Message ID:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("[v0] Email send error:", error.message)
    console.error("[v0] Full error:", JSON.stringify(error, null, 2))
    return { success: false, error: error.message || "Unknown email error" }
  }
}

export async function sendAdminEmail({ subject, html }: { subject: string; html: string }) {
  const adminEmail = "us8637@gmail.com"
  return sendEmail({ to: adminEmail, subject, html })
}

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to BuzzFiling — Your U.S. Business Journey Begins Here 🎉",
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
                
                <!-- Updated logo URL to official BuzzFiling URL -->
                <tr>
                  <td style="padding: 32px 40px 16px 40px; text-align: center;">
                    <img src="https://www.buzzfiling.com/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 160px; height: auto;" />
                  </td>
                </tr>
                
                <!-- Logo Section -->
                <tr>
                  <td style="padding: 32px 40px 32px 40px; text-align: center; background: linear-gradient(135deg, #8b0000 0%, #a00000 100%);">
                    <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 12px; margin: 0 auto; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">🎉</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 40px;">
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">
                      Dear ${name}, Welcome to <span style="color: #8b0000;">BuzzFiling</span> 🎉
                    </h1>
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                      We're thrilled to have you onboard and excited to be part of your journey toward establishing your U.S.-based LLC. Starting or expanding a business is a bold step, and we're here to ensure it's as smooth and seamless as possible.
                    </p>
                    
                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                      Our platform is designed to make forming and managing your U.S. LLC straightforward and hassle-free. From filing the necessary paperwork to managing compliance, taxes, and more, we're here to handle the details so you can focus on growing your business.
                    </p>
                    
                    <!-- What's Next Section -->
                    <div style="background-color: #f8f9fa; border-left: 4px solid #8b0000; padding: 24px; border-radius: 8px; margin: 32px 0;">
                      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                        Here's what you can do next:
                      </h2>
                      
                      <ul style="margin: 0; padding: 0; list-style: none;">
                        <li style="margin: 0 0 12px 0; padding-left: 28px; position: relative; font-size: 15px; color: #4a4a4a; line-height: 1.6;">
                          <span style="position: absolute; left: 0; top: 2px; font-weight: 600; color: #8b0000;">✓</span>
                          <strong style="color: #1a1a1a;">Explore Your Dashboard</strong> — Access all the tools and resources you need in one place.
                        </li>
                        <li style="margin: 0 0 12px 0; padding-left: 28px; position: relative; font-size: 15px; color: #4a4a4a; line-height: 1.6;">
                          <span style="position: absolute; left: 0; top: 2px; font-weight: 600; color: #8b0000;">✓</span>
                          <strong style="color: #1a1a1a;">Check Out Our Resources</strong> — Learn about compliance, taxes, and how to run your business effectively.
                        </li>
                        <li style="margin: 0; padding-left: 28px; position: relative; font-size: 15px; color: #4a4a4a; line-height: 1.6;">
                          <span style="position: absolute; left: 0; top: 2px; font-weight: 600; color: #8b0000;">✓</span>
                          <strong style="color: #1a1a1a;">Reach Out Anytime</strong> — Our support team is here to answer your questions and assist you at every step.
                        </li>
                      </ul>
                    </div>
                    
                    <p style="margin: 32px 0 0 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                      Thank you for choosing <strong style="color: #8b0000;">BuzzFiling</strong> to be your partner in success. Let's build something amazing together!
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b0000 0%, #a00000 100%); border-radius: 8px; padding: 16px 32px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://buzzfiling.com"}/client/dashboard" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
                            Go to Dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                      Need help? Contact us at <a href="mailto:support@buzzfiling.com" style="color: #8b0000; text-decoration: none; font-weight: 500;">support@buzzfiling.com</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
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
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px;"></td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <img src="https://www.buzzfiling.com/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your EIN application has been successfully submitted to the IRS. Processing typically takes 10–12 business days, though delays may occur on the IRS side.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">Current Status:</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;">• EIN: ${status}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;">• RA: Active</p>
                      <p style="margin: 0; font-size: 14px; color: #333333;">• Address: Active</p>
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We'll notify you as soon as we receive your EIN from the IRS.
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
  documentsReady: (name: string, companyName: string, documentsUrl: string) => ({
    subject: "Your U.S. Company Documents Are Ready — BuzzFiling",
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
                    <img src="https://www.buzzfiling.com/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Great news! Your ${companyName} documents are now ready for download.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">Available Documents:</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;">• Your Certificate of Incorporation</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;">• Your Operating Agreement</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;">• Your EIN Confirmation Letter</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;">• Your Business Formation State Filing</p>
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can access all your documents through your dashboard at any time.
                    </p>
                    
                    <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b0000 0%, #a00000 100%); border-radius: 8px; padding: 12px 30px;">
                          <a href="${documentsUrl}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Download Documents</a>
                        </td>
                      </tr>
                    </table>
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
  loginAlert: (name: string, loginTime: string, ipAddress?: string) => ({
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
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px;"></td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <img src="https://www.buzzfiling.com/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We detected a new login to your Buzz Filing account.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Login Time:</strong> ${loginTime}</p>
                      ${ipAddress ? `<p style="margin: 0; font-size: 14px; color: #333333;"><strong>IP Address:</strong> ${ipAddress}</p>` : ""}
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      If this was you, no action is needed. If you didn't login, please contact support immediately.
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
                    <img src="https://www.buzzfiling.com/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
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
  orderPlacementConfirmation: (
    name: string,
    companyName: string,
    orderType: string,
    totalPrice: number,
    orderId: string,
  ) => ({
    subject: "Order Confirmation — Your U.S. Business Formation Has Been Initiated 📋",
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
                      <span style="font-size: 32px;">✅</span>
                    </div>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 40px;">
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">
                      Order Confirmed, ${name}! 📋
                    </h1>
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                      Your order has been successfully placed and we've received your payment. We're now processing your ${orderType} formation.
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #8b0000; padding: 24px; border-radius: 8px; margin: 32px 0;">
                      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                        Order Details
                      </h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Order ID:</td>
                          <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-align: right;">${orderId}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Company:</td>
                          <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-align: right;">${companyName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Service Type:</td>
                          <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-align: right;">${orderType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; font-size: 16px; color: #1a1a1a; font-weight: 700;">Total Amount:</td>
                          <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: #8b0000; text-align: right;">$${totalPrice.toFixed(2)}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="margin: 32px 0 0 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                      What happens next? We'll begin processing your formation immediately. You'll receive updates in your dashboard and via email as we progress through each milestone.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b0000 0%, #a00000 100%); border-radius: 8px; padding: 16px 32px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://buzzfiling.com"}/client/dashboard" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
                            View Your Dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 32px 40px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                      Need help? Contact us at <a href="mailto:support@buzzfiling.com" style="color: #8b0000; text-decoration: none; font-weight: 500;">support@buzzfiling.com</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
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
  orderConfirmation: (name: string, orderId: string, services: string[], totalPrice: number) => ({
    subject: "Order Confirmation - BuzzFiling",
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for your order! We've received your payment and are processing your LLC formation.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">Order ID: ${orderId}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Services:</strong></p>
                      <ul style="margin: 0; padding: 0 0 0 20px;">
                        ${services.map((service) => `<li style="margin: 0 0 4px 0; font-size: 14px; color: #333333;">• ${service}</li>`).join("")}
                      </ul>
                      <p style="margin: 8px 0 0 0; font-size: 14px; color: #333333; font-weight: 600;">Paid amount: $${totalPrice.toFixed(2)}</p>
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We'll keep you updated at every step. You can track your order status in your dashboard.
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
  einUploaded: (name: string, einNumber: string, companyName: string) => ({
    subject: "EIN Successfully Uploaded - BuzzFiling",
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
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background-color: #8b0000; height: 8px;"></td></tr><tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" /></td></tr><tr><td style="padding: 0 40px 40px 40px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">Dear ${name},</p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">Great news! Your EIN has been successfully uploaded for <strong>${companyName}</strong>.</p>
                  <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>EIN Number:</strong> ${einNumber}</p>
                    <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">You can view this information in your dashboard anytime.</p>
                </td></tr>
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
  itinUploaded: (name: string, itinNumber: string, companyName: string) => ({
    subject: "ITIN Successfully Uploaded - BuzzFiling",
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
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background-color: #8b0000; height: 8px;"></td></tr><tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" /></td></tr><tr><td style="padding: 0 40px 40px 40px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">Dear ${name},</p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">Your ITIN has been successfully uploaded for <strong>${companyName}</strong>.</p>
                  <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>ITIN Number:</strong> ${itinNumber}</p>
                    <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">Your business information is now complete and secure.</p>
                </td></tr>
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
  businessIdUploaded: (name: string, businessId: string, companyName: string) => ({
    subject: "Business ID Successfully Uploaded - BuzzFiling",
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
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background-color: #8b0000; height: 8px;"></td></tr><tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto;" /></td></tr><tr><td style="padding: 0 40px 40px 40px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">Dear ${name},</p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">Your Business ID has been successfully uploaded for <strong>${companyName}</strong>.</p>
                  <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>Business ID:</strong> ${businessId}</p>
                    <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">Your registration is progressing smoothly. Check your dashboard for updates.</p>
                </td></tr>
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
  milestoneCompleted: (name: string, milestoneName: string, progress: number) => ({
    subject: "Milestone Completed - BuzzFiling",
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Congratulations! You have successfully completed the "${milestoneName}" milestone. Your progress is now at ${progress}%.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;"><strong>Milestone:</strong> ${milestoneName}</p>
                      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Completed:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Keep up the great work! You can view more milestones and track your progress in your dashboard.
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
  documentUploaded: (name: string, documentType: string, companyName: string) => ({
    subject: "New Document Uploaded - BuzzFiling",
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
                      A new document has been uploaded for ${companyName}.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Document:</strong> ${documentType}</p>
                      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view and download this document from your dashboard.
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
  addonPurchaseConfirmation: (name: string, addonName: string, price: number) => ({
    subject: "Addon Purchase Confirmation - BuzzFiling",
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for purchasing additional services. Your add-ons have been successfully added.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">Purchased Add-ons:</p>
                      <p style="margin: 8px 0; font-size: 14px; color: #333333;">
                        • <strong>${addonName}</strong> - $${price}
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Our team will begin processing your add-ons shortly.
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
  mailReceived: (
    name: string,
    subject: string,
    from: string,
    companyName: string,
    type: string,
    receivedDate: string,
  ) => ({
    subject: `New Mail Received: ${subject}`,
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
                
                <!-- Dark red header bar for brand consistency -->
                <tr>
                  <td style="background-color: #8b0000; height: 8px;"></td>
                </tr>
                
                <!-- BuzzFiling logo section -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 150px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                
                <!-- Main content with professional greeting and mail details -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Dear <span style="background-color: #ffeb3b; padding: 2px 6px;">${name}</span>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      A new mail has been received for <strong>${companyName}</strong>.
                    </p>
                    
                    <!-- Styled mail details box with gray background -->
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8b0000;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #333333;"><strong>Mail Details:</strong></p>
                      <p style="margin: 0 0 8px 0; font-size: 13px; color: #555555;"><strong>From:</strong> ${from}</p>
                      <p style="margin: 0 0 8px 0; font-size: 13px; color: #555555;"><strong>Subject:</strong> ${subject}</p>
                      ${type ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #555555;"><strong>Type:</strong> ${type}</p>` : ""}
                      ${receivedDate ? `<p style="margin: 0; font-size: 13px; color: #555555;"><strong>Received:</strong> ${new Date(receivedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}, ${new Date(receivedDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>` : ""}
                    </div>
                    
                    <p style="margin: 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view and download this mail from your mailroom dashboard.
                    </p>
                    
                    <!-- Call-to-action button -->
                    <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                      <tr>
                        <td style="background-color: #8b0000; border-radius: 6px; padding: 12px 30px;">
                          <a href="https://buzzfiling.com/client/mailroom" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">View Mailroom</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer section -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0;">All rights reserved © 2026 | BuzzFiling</p>
                  </td>
                </tr>
                
                <!-- Dark red footer bar -->
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
  adminMailReceived: (
    customerName: string,
    companyName: string,
    subject: string,
    from: string,
    type: string,
    attachmentCount: number,
  ) => ({
    subject: "Mail Uploaded - Admin Notification",
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
                  <td style="background-color: #8b0000; padding: 20px 40px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Document Upload Notification</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">New mail has been uploaded to the system.</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>Customer:</strong> ${customerName}</p>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>Company:</strong> ${companyName}</p>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>Mail From:</strong> ${from}</p>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>Subject:</strong> ${subject}</p>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>Type:</strong> ${type}</p>
                      <p style="margin: 0; font-size: 14px; color: #666666;"><strong>Attachments:</strong> ${attachmentCount}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0;">BuzzFiling Admin Notification</p>
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
}
