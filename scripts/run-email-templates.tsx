/**
 * Email Template Testing Script
 * Generates HTML files for all email templates with sample data
 * Usage: npx ts-node scripts/run-email-templates.ts
 */

import fs from "fs"
import path from "path"

// Email templates configuration
const emailTemplates = {
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">
                      Dear ${name}, Welcome to BuzzFiling!
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We're thrilled to have you onboard. Our platform is designed to make forming and managing your U.S. LLC straightforward and hassle-free.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">BuzzFiling</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">Dear ${name},</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      We detected a new login to your BuzzFiling account at ${loginTime}${ipAddress ? ` from IP: ${ipAddress}` : ""}.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">BuzzFiling</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">Dear ${name},</p>
                    <p style="margin: 0 0 30px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Click the link below to reset your password:
                    </p>
                    <p style="margin: 0 0 30px 0; text-align: center;">
                      <a href="${resetLink}" style="display: inline-block; background-color: #880000; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                        Reset Password
                      </a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">BuzzFiling</span>
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">Dear ${name},</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Your order has been placed successfully for <strong>${companyName}</strong>!
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #333333;">
                      <strong>Order ID:</strong> ${orderId}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">BuzzFiling</span>
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
    `,
  }),

  addonPurchaseConfirmation: (name: string, addonName: string, amount: string) => ({
    subject: `Add-on Purchase Confirmed - ${addonName}`,
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
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_T2AXdANj1Znlvt1rgkguWADlBkz6/q1VfaZBjjYg-A0FO6974Ar/public/images/buzz-filing-logo.png" alt="BuzzFiling" style="width: 180px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000;">Dear ${name},</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #333333; line-height: 1.6;">
                      Thank you for purchasing the <strong>${addonName}</strong> add-on!
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #333333;">
                      <strong>Amount Charged:</strong> ${amount}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      All rights reserved © 2026 | <span style="color: #880000; font-weight: 600;">BuzzFiling</span>
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
    `,
  }),
}

// Sample data for templates
const sampleData = {
  welcome: ["John Doe"],
  loginAlert: ["Jane Smith", new Date().toLocaleString(), "192.168.1.1"],
  passwordReset: ["Mike Johnson", "https://buzzfiling.com/reset?token=abc123"],
  orderConfirmation: ["Sarah Williams", "ORD-2024-001", "Tech Innovations LLC"],
  addonPurchaseConfirmation: ["David Brown", "EIN Letter", "$49.99"],
}

// Create output directory
const outputDir = path.join(process.cwd(), "email-templates-output")
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Generate HTML files for each template
console.log("[v0] Generating email templates...")
console.log(`[v0] Output directory: ${outputDir}`)
console.log("")

let successCount = 0
let errorCount = 0

Object.entries(emailTemplates).forEach(([templateName, templateFn]) => {
  try {
    // Get sample data for this template
    const params = sampleData[templateName as keyof typeof sampleData]

    // Generate email
    const email = (templateFn as any)(...params)

    // Create filename
    const filename = `${templateName}-${new Date().getTime()}.html`
    const filepath = path.join(outputDir, filename)

    // Write to file
    fs.writeFileSync(filepath, email.html, "utf-8")

    console.log(`[v0] ✓ ${templateName}`)
    console.log(`    Subject: ${email.subject}`)
    console.log(`    File: ${filename}`)
    console.log("")

    successCount++
  } catch (error: any) {
    console.error(`[v0] ✗ ${templateName}`)
    console.error(`    Error: ${error.message}`)
    console.error("")
    errorCount++
  }
})

// Print summary
console.log("========================================")
console.log(`[v0] Email Template Generation Complete`)
console.log(`[v0] Success: ${successCount}`)
console.log(`[v0] Failed: ${errorCount}`)
console.log(`[v0] Output Directory: ${outputDir}`)
console.log("========================================")

if (errorCount > 0) {
  process.exit(1)
}
