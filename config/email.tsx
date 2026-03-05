import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtpout.secureserver.net",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "hello@buzzfiling.com",
    pass: process.env.EMAIL_PASS || "@Buzz2899",
  },
  requireTLS: true,
}

const SENDER_EMAIL = process.env.SENDER_EMAIL || "hello@buzzfiling.com" // Email domain kept as is for functionality
const SENDER_NAME = "Buzz Filing"

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

    console.log("[v0] Sending email to:", to, "| Subject:", subject)
    console.log("[v0] Email config:", {
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      user: EMAIL_CONFIG.auth.user,
      sender: SENDER_EMAIL,
    })

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log("[v0] Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("[v0] Email send error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    })
    return { success: false, error: error.message || "Unknown email error" }
  }
}

export async function sendAdminEmail({ subject, html }: { subject: string; html: string }) {
  const adminEmail = "us8637@gmail.com"
  return sendEmail({ to: adminEmail, subject, html })
}

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Buzz Filing – Your Dashboard Is Ready",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Welcome to Buzz Filing! Your account has been successfully created. You now have access to your Buzz Filing Dashboard, where you can:
                    </p>
                    
                    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">Track your service progress</li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">View important updates</li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">Securely upload documents</li>
                      <li style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">Receive compliance reminders — all in one place</li>
                    </ul>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Our team will start working on your order immediately. You can monitor progress and updates directly from your dashboard.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      We support:
                    </p>
                    
                    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">U.S. & UK company formation</li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">EIN & ITIN processing</li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">Business bank accounts</li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">State & IRS compliance</li>
                      <li style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">Tax filing support</li>
                    </ul>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      To get started, log in to your dashboard or simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  orderConfirmation: (
    name: string,
    companyName: string,
    packageType: string,
    totalAmount: string,
    orderId: string,
  ) => {
    const raw = (packageType || "").toLowerCase().trim()
    const packageLabel = raw.includes("advanced") ? "Advanced" : "Starter"
    return {
    subject: "Your Order Has Been Confirmed",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for placing your order with Buzz Filing.
                    </p>
                    
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000; font-weight: 600;">
                      Order Details:
                    </p>
                    
                    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Company Name:</strong> ${companyName}
                      </li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Package:</strong> ${packageLabel}
                      </li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Total Amount:</strong> ${totalAmount}
                      </li>
                      <li style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                        <strong>Order ID:</strong> ${orderId}
                      </li>
                    </ul>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your order is now in our system, and you can track progress and updates directly from your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions or need assistance, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }},

  einUploaded: (name: string, companyName: string) => ({
    subject: "Your EIN Application Is Under Review",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're writing to inform you that your EIN application has been successfully submitted to the IRS. The application is currently under review. Processing times may vary, and updates will be reflected as they become available.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can monitor the status and receive updates directly in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  orderStarted: (name: string, companyName: string) => ({
    subject: "Your Order Has Been Started",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're excited to let you know that your order has been started. Our team is now actively working on your request, and progress updates will be reflected as the process moves forward.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can monitor the status and receive updates directly in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  registeredAgentAssigned: (name: string, companyName: string) => ({
    subject: "Your Registered Agent Is Now Active",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your Registered Agent has been assigned to your company. This service is now active and ensures your company receives official state communications on time.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view the status in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  businessAddressAssigned: (name: string, companyName: string) => ({
    subject: "Your Business Address Is Now Active",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your Business Address has been successfully assigned to your company. This address is now active for official business use and will be used for state and compliance-related purposes.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view the status in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  companyFormed: (name: string, companyName: string) => ({
    subject: "Your Company Has Been Successfully Registered",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're pleased to inform you that your company has been successfully registered with the State. Your business is now officially active, and the formation process has been completed successfully.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view the status in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  einObtained: (name: string, companyName: string) => ({
    subject: "Your EIN Has Been Successfully Issued",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're pleased to inform you that your Employer Identification Number (EIN) has been successfully issued by the IRS. Your business now has an official federal tax ID, which can be used for:
                    </p>
                    
                    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">Banking</li>
                      <li style="margin: 0 0 8px 0; font-size: 14px; color: #333333; line-height: 1.6;">Compliance</li>
                      <li style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">Tax-related purposes</li>
                    </ul>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can view your EIN status and updates directly in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),

  orderCompleted: (name: string, companyName: string) => ({
    subject: "Your Order Has Been Completed",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're pleased to inform you that your order has been successfully completed. All services included in your order have been finalized.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      You can review the completion status and any updates directly in your Buzz Filing Dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions or need further assistance, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
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
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    subject: "New Mail Received at Your Business Address",
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      A new document has been received at your business address.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      The document has been scanned and uploaded to the Mailroom in your Buzz Filing Dashboard, where you can securely view and download it.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Please log in to your dashboard to review the document.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, simply reply to this email.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to support your business setup.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">Buzz Filing</span>
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
    `,
  }),
}
