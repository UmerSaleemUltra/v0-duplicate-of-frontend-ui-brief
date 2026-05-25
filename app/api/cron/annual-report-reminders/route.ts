import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { sendEmail, emailTemplates } from "@/config/email"
import { STATE_ANNUAL_REPORT_DEADLINES, calculateNextDueDate } from "@/lib/annual-report-deadlines"

// This endpoint is called by Vercel Cron Jobs
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/annual-report-reminders", "schedule": "0 9 * * *" }] }

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const now = new Date()
    
    // Get reminder settings
    const settings = await db.collection("annual_report_settings").findOne({ type: "global" })
    const reminderDays = settings?.reminderDays || [60, 30, 14, 7, 3, 1]
    const enableAutoSend = settings?.enableAutoSend !== false
    
    if (!enableAutoSend) {
      return NextResponse.json({
        success: true,
        message: "Auto-send is disabled",
        remindersSent: [],
        timestamp: new Date().toISOString(),
      })
    }
    
    // Get all companies with their formation state
    const companies = await db.collection("companies").find({
      status: { $ne: "dissolved" },
    }).toArray()

    const remindersToSend: any[] = []
    const remindersSent: any[] = []
    const errors: any[] = []

    for (const company of companies) {
      const state = company.state || company.formationState
      if (!state) continue

      const stateDeadline = STATE_ANNUAL_REPORT_DEADLINES[state]
      if (!stateDeadline) continue

      // Calculate due date based on company formation date
      const formationDate = company.formationDate || company.createdAt
      const dueDate = calculateNextDueDate(state, formationDate ? new Date(formationDate) : new Date())
      
      if (!dueDate) continue

      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Check if we already sent a reminder recently
      const existingReminder = await db.collection("annual_report_reminders").findOne({
        companyId: company._id.toString(),
        dueDate: dueDate,
      })

      // Determine if we should send a reminder based on days until due
      const shouldSendReminder = reminderDays.includes(daysUntil) && daysUntil > 0

      if (!shouldSendReminder) continue

      // Check if we already sent this specific reminder (e.g., 30-day reminder)
      if (existingReminder) {
        const lastReminderSent = existingReminder.remindersSent || []
        const alreadySentThisReminder = lastReminderSent.some((r: any) => r.daysUntil === daysUntil)
        
        if (alreadySentThisReminder || existingReminder.status === "completed" || existingReminder.status === "snoozed") {
          continue
        }
      }

      // Get company owner/user info for email
      const user = await db.collection("users").findOne({ _id: company.userId })
      if (!user || !user.email) continue

      remindersToSend.push({
        company,
        user,
        state,
        dueDate,
        daysUntil,
        fee: stateDeadline.fee,
        existingReminder,
      })
    }

    // Send reminders
    for (const reminder of remindersToSend) {
      try {
        const { company, user, state, dueDate, daysUntil, fee, existingReminder } = reminder

        // Send email
        const emailTemplate = emailTemplates.annualReportReminder(
          user.name || "Valued Customer",
          company.name || company.companyName,
          state,
          dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          daysUntil,
          fee,
        )

        await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        })

        // Update or create reminder record
        const reminderRecord = {
          companyId: company._id.toString(),
          companyName: company.name || company.companyName,
          userId: user._id.toString(),
          userEmail: user.email,
          state,
          dueDate,
          fee,
          status: "pending",
          remindersSent: [
            ...(existingReminder?.remindersSent || []),
            { daysUntil, sentAt: new Date() },
          ],
          lastReminderSent: new Date(),
          updatedAt: new Date(),
        }

        if (existingReminder) {
          await db.collection("annual_report_reminders").updateOne(
            { _id: existingReminder._id },
            { $set: reminderRecord },
          )
        } else {
          await db.collection("annual_report_reminders").insertOne({
            ...reminderRecord,
            createdAt: new Date(),
          })
        }

        remindersSent.push({
          companyId: company._id.toString(),
          companyName: company.name || company.companyName,
          email: user.email,
          daysUntil,
        })
      } catch (error: any) {
        errors.push({
          companyId: reminder.company._id.toString(),
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${companies.length} companies, sent ${remindersSent.length} reminders`,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Cron job error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

// Also allow POST for manual triggering from admin
export async function POST(req: NextRequest) {
  return GET(req)
}
