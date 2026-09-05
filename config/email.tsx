import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "hello@umersaleem.com",
    pass: "Umer2024",
  },
}

const SENDER_EMAIL = "hello@umersaleem.com"
const SENDER_NAME = "LLC Formation"

export const transporter = nodemailer.createTransport(EMAIL_CONFIG)

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error }
  }
}

export const emailTemplates = {
  welcome: (name: string, email: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f4f4f4; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LLC Formation</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with LLC Formation. We're excited to have you on board.</p>
            <p>Your account has been successfully created with email: <strong>${email}</strong></p>
            <p>You can now log in and start managing your LLC formation process.</p>
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/login" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LLC Formation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  verifyEmail: (name: string, otp: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f4f4f4; padding: 30px; text-align: center; }
          .otp-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #0070f3; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Please use the following OTP to verify your email address:</p>
            <div class="otp-box">${otp}</div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LLC Formation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  resetPassword: (name: string, resetLink: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f4f4f4; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LLC Formation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  orderConfirmation: (name: string, orderId: string, orderDetails: any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f4f4f4; padding: 30px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for your order. We've received your payment and are processing your LLC formation.</p>
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Package:</strong> ${orderDetails.package || "Standard"}</p>
              <p><strong>State:</strong> ${orderDetails.state || "N/A"}</p>
              <p><strong>Amount:</strong> $${orderDetails.amount || "0.00"}</p>
            </div>
            <p>We'll keep you updated on the progress of your LLC formation.</p>
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/client/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LLC Formation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  documentReady: (name: string, documentName: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f4f4f4; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Document Ready</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Good news! Your document is ready for download.</p>
            <p><strong>Document:</strong> ${documentName}</p>
            <p>You can download it from your dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/client/documents" class="button">View Documents</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LLC Formation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,
}
