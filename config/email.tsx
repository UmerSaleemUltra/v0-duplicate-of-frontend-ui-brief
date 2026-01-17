import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "us800750@gmail.com",
    pass: process.env.EMAIL_PASS || "pbjsifufaairgniq",
  },
}

const SENDER_EMAIL = process.env.SENDER_EMAIL || "us800750@gmail.com"
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

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("[v0] Email send error:", error.message)
    return { success: false, error: error.message || "Unknown email error" }
  }
}

export async function sendAdminEmail({ subject, html }: { subject: string; html: string }) {
  const adminEmail = "us8637@gmail.com"
  return sendEmail({ to: adminEmail, subject, html })
}

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to BuzzFiling",
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name}, Welcome to Foundo 🎉
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're thrilled to have you onboard and excited to be part of your journey toward establishing your U.S.-based LLC. Starting or expanding a business is a bold step, and we're here to ensure it's as smooth and seamless as possible.
                    </p>
                    
                    <p style="margin: 0 0 30px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Our platform is designed to make forming and managing your U.S. LLC straightforward and hassle-free. From filing the necessary paperwork to managing compliance, taxes, and more, we're here to handle the details so you can focus on growing your business.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      Here's what you can do next:
                    </p>
                    
                    <ul style="margin: 0 0 30px 0; padding-left: 20px;">
                      <li style="margin: 0 0 10px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Explore Your Dashboard</strong> — Access all the tools and resources you need in one place.
                      </li>
                      <li style="margin: 0 0 10px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Check Out Our Resources</strong> — Learn about compliance, taxes, and how to run your business effectively.
                      </li>
                      <li style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Reach Out Anytime</strong> — Our support team is here to answer your questions and assist you at every step.
                      </li>
                    </ul>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #E47B00; font-weight: 600;">Foundo</span> to be your partner in success. Let's build something amazing together!
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2025 | <span style="color: #E47B00; font-weight: 600;">Foundo</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #2563EB; height: 8px; border-radius: 0 0 8px 8px;"></td>
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
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We detected a new login to your BuzzFiling account.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      Login Details:
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Time:</strong> ${loginTime}
                    </p>
                    ${ipAddress ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;"><strong>IP Address:</strong> ${ipAddress}</p>` : ""}
                    
                    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      If this was you, no action is needed. If you didn't login, please contact our support team immediately.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
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
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We received a request to reset your password. Click the link below to create a new password:
                    </p>
                    
                    <p style="margin: 0 0 30px 0; text-align: center;">
                      <a href="${resetLink}" style="display: inline-block; background-color: #8b0000; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                        Reset Password
                      </a>
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      If you didn't request this, please ignore this email. The link will expire in 1 hour.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  passwordChanged: (name: string) => ({
    subject: "Your Password Has Been Changed - BuzzFiling",
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your password has been successfully changed. You can now login with your new password.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      If you didn't make this change, please contact our support team immediately at support@buzzfiling.com.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
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
    entityType: string,
    state: string,
    amount: string,
  ) => ({
    subject: `Order Confirmation — ${companyName}`,
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for placing your trust in BuzzFiling! We've received your order for forming your U.S. LLC, and our team is now processing it.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      Here is an overview of your recent order:
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Company Name:</strong> ${companyName}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Entity:</strong> ${entityType}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>State:</strong> ${state}
                    </p>
                    <p style="margin: 0 0 30px 0; font-size: 14px; color: #333333;">
                      <strong>Paid amount:</strong> ${amount}
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      What happens next?:
                    </p>
                    
                    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                      <li style="margin: 0 0 10px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>LLC Formation in Progress:</strong> We're working on filing your LLC with the appropriate state authorities.
                      </li>
                      <li style="margin: 0 0 10px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Document Preparation:</strong> Once your LLC is approved, we'll ensure that all essential documents are ready and uploaded to your dashboard.
                      </li>
                      <li style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Timeline:</strong> LLC formation times vary by state, but rest assured, we'll keep you updated throughout the process.
                      </li>
                    </ul>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing BuzzFiling as your trusted partner. We're excited to help you bring your business vision to life!
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  orderConfirmation: (name: string, orderId: string, companyName: string) => ({
    subject: `Order Placed Successfully — ${companyName}`,
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your order has been placed successfully! We're processing your LLC formation for <strong>${companyName}</strong>.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Order ID:</strong> ${orderId}
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can track your order progress through your dashboard at any time.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  einUploaded: (name: string, companyName: string) => ({
    subject: `Great News! Your EIN Application is Submitted ✅`,
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      <strong>Great News!</strong> Your EIN Application is Submitted ✅
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're excited to inform you that your EIN application has been successfully submitted to the IRS for your ${companyName} LLC.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      Important Update:
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      The normal processing time for EINs for non-U.S. residents is typically <strong>4 to 7 working days</strong>. Please be aware that, with Quarter 4 and the upcoming tax season, the IRS is currently processing EIN applications around <strong>4 - 8 weeks</strong>.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for your patience during this time.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Congratulations on taking this significant step for your business!
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  itinUploaded: (name: string, companyName: string) => ({
    subject: "ITIN Application Submitted",
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your ITIN application for ${companyName} has been successfully submitted to the IRS.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      Processing time is typically 6-10 weeks. We'll notify you as soon as we receive your ITIN.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  businessIdUploaded: (name: string, companyName: string, businessId: string) => ({
    subject: "Business ID Assigned",
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your Business ID has been assigned for ${companyName}.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">
                      <strong>Business ID:</strong> ${businessId}
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can now access all your business details through your dashboard.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  milestoneCompleted: (name: string, milestoneName: string, companyName: string) => ({
    subject: `Milestone Achieved: ${milestoneName}`,
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Congratulations! You've reached a new milestone for ${companyName}.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">
                      <strong>Milestone:</strong> ${milestoneName}
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Check your dashboard to see your progress and next steps.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  documentUploaded: (name: string, documentName: string) => ({
    subject: "Document Uploaded Successfully",
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      A new document has been uploaded to your account: <strong>${documentName}</strong>
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view and download it from your dashboard.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
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
    subject: "New Mail Received",
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      A new document has been uploaded for ${companyName}.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      Mail Details:
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>From:</strong> ${from}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Subject:</strong> ${subject}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Type:</strong> ${type}
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">
                      <strong>Received:</strong> ${receivedDate}
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view and download this document from your mailroom.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  addonPurchaseConfirmation: (name: string, addonName: string, price: string) => ({
    subject: `Add-on Purchased: ${addonName}`,
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for purchasing the <strong>${addonName}</strong> add-on!
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333;">
                      <strong>Price:</strong> ${price}
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your add-on has been activated and is now available in your account.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  }),

  adminMailReceived: (companyName: string, from: string, subject: string, type: string) => ({
    subject: `New Mail Received - ${companyName}`,
    html: `
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
                    <img src="https://buzzfiling.com/images/buzz-filling-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Admin Alert: New Mail Received
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      A new mail has been uploaded for <strong>${companyName}</strong>.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>From:</strong> ${from}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                      <strong>Subject:</strong> ${subject}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #333333;">
                      <strong>Type:</strong> ${type}
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #8b0000; font-weight: 600;">BuzzFiling</span>
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">...</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #8b0000; height: 8px; border-radius: 0 0 8px 8px;"></td>
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
