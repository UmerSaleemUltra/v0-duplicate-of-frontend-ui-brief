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
    subject: "Welcome to Buzz Filing",
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
                      Dear ${name}, Welcome to Buzz Filing!
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
                      Thank you for choosing <span style="color: #880000; font-weight: 600;">Buzz Filing</span> to be your partner in success. Let's build something amazing together!
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
  ) => ({
    subject: `Order Confirmation - ${companyName}`,
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
                      Thank you for your order! We've received your LLC formation request and are processing it now.
                    </p>
                    
                    <table width="100%" style="margin: 0 0 30px 0; border: 1px solid #e5e5e5; border-radius: 4px;">
                      <tr>
                        <td style="padding: 20px; background-color: #fafafa;">
                          <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                            <strong>Company Name:</strong> ${companyName}
                          </p>
                          <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                            <strong>Package:</strong> ${packageType}
                          </p>
                          <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">
                            <strong>Total Amount:</strong> ${totalAmount}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #333333;">
                            <strong>Order ID:</strong> ${orderId}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We'll keep you updated on your order status. You can track your progress anytime through your dashboard.
                    </p>
                    
                    <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      If you have any questions, feel free to reach out to our support team.
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="Buzz Filing" style="width: 180px; height: auto;" />
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
