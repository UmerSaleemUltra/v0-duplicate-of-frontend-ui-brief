import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { ObjectId } from "mongodb"
import { STATE_ANNUAL_REPORT_DEADLINES, calculateNextDueDate, getDaysUntilDeadline } from "@/lib/annual-report-deadlines"

// GET - Fetch all annual report reminders
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const { db } = await connectDB()
    
    // Get query params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // pending, sent, all
    const daysAhead = parseInt(searchParams.get("daysAhead") || "90")
    
    // Fetch companies with their formation dates
    let companies
    if (decoded.role === "admin") {
      companies = await db.collection("companies").find({}).toArray()
    } else {
      companies = await db.collection("companies").find({ userId: decoded.userId }).toArray()
    }
    
    // Fetch existing reminders
    const reminders = await db.collection("annual_report_reminders").find({}).toArray()
    const reminderMap = new Map(reminders.map(r => [r.companyId?.toString(), r]))
    
    // Build reminder list with calculated due dates
    const reminderList = companies.map((company: any) => {
      const state = company.state || company.formationState
      const formationDate = company.createdAt || company.formationDate
      
      if (!state || !formationDate) {
        return null
      }
      
      const deadline = STATE_ANNUAL_REPORT_DEADLINES[state]
      if (!deadline) return null
      
      const nextDueDate = calculateNextDueDate(state, new Date(formationDate))
      if (!nextDueDate) return null
      
      const daysUntil = getDaysUntilDeadline(nextDueDate)
      
      // Only include if within the days ahead window
      if (daysUntil > daysAhead || daysUntil < -30) return null
      
      const existingReminder = reminderMap.get(company._id?.toString())
      
      return {
        _id: existingReminder?._id || null,
        companyId: company._id?.toString() || company.id,
        companyName: company.name,
        state,
        formationDate,
        dueDate: nextDueDate.toISOString(),
        daysUntil,
        fee: deadline.fee,
        frequency: deadline.frequency,
        notes: deadline.notes,
        status: existingReminder?.status || "pending",
        lastReminderSent: existingReminder?.lastReminderSent || null,
        reminderCount: existingReminder?.reminderCount || 0,
        userId: company.userId,
      }
    }).filter(Boolean)
    
    // Filter by status if specified
    let filteredList = reminderList
    if (status && status !== "all") {
      filteredList = reminderList.filter(r => r.status === status)
    }
    
    // Sort by days until deadline (most urgent first)
    filteredList.sort((a, b) => a.daysUntil - b.daysUntil)

    return addSecurityHeaders(NextResponse.json({
      success: true,
      data: filteredList,
      summary: {
        total: filteredList.length,
        urgent: filteredList.filter(r => r.daysUntil <= 30).length,
        upcoming: filteredList.filter(r => r.daysUntil > 30 && r.daysUntil <= 60).length,
        later: filteredList.filter(r => r.daysUntil > 60).length,
      }
    }))
  } catch (error) {
    console.error("Error fetching reminders:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 }))
  }
}

// POST - Create or update a reminder, or send reminder email
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Admin access required" }, { status: 403 }))
    }

    const { db } = await connectDB()
    const body = await req.json()
    const { action, companyId, reminderId } = body

    if (action === "send_reminder") {
      // Send a reminder email for a specific company
      if (!companyId) {
        return addSecurityHeaders(NextResponse.json({ error: "Company ID required" }, { status: 400 }))
      }

      const company = await db.collection("companies").findOne({ 
        _id: new ObjectId(companyId) 
      })
      
      if (!company) {
        return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
      }

      // Get user email
      const user = await db.collection("users").findOne({ 
        _id: new ObjectId(company.userId) 
      })
      
      if (!user?.email) {
        return addSecurityHeaders(NextResponse.json({ error: "User email not found" }, { status: 404 }))
      }

      const state = company.state || company.formationState
      const deadline = STATE_ANNUAL_REPORT_DEADLINES[state]
      const nextDueDate = calculateNextDueDate(state, new Date(company.createdAt || company.formationDate))
      const daysUntil = nextDueDate ? getDaysUntilDeadline(nextDueDate) : 0

      // Import email functions
      const { sendEmail, emailTemplates } = await import("@/config/email")
      
      const emailTemplate = emailTemplates.annualReportReminder(
        user.name || "Valued Client",
        company.name,
        state,
        nextDueDate?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) || "Unknown",
        daysUntil,
        deadline?.fee || 0,
      )

      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })

      // Update or create reminder record
      await db.collection("annual_report_reminders").updateOne(
        { companyId: companyId },
        {
          $set: {
            companyId,
            companyName: company.name,
            state,
            userId: company.userId,
            lastReminderSent: new Date(),
            status: "sent",
            updatedAt: new Date(),
          },
          $inc: { reminderCount: 1 },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )

      return addSecurityHeaders(NextResponse.json({
        success: true,
        message: `Reminder sent to ${user.email}`,
      }))
    }

    if (action === "mark_complete") {
      // Mark a reminder as complete (report filed)
      if (!companyId) {
        return addSecurityHeaders(NextResponse.json({ error: "Company ID required" }, { status: 400 }))
      }

      await db.collection("annual_report_reminders").updateOne(
        { companyId: companyId },
        {
          $set: {
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )

      return addSecurityHeaders(NextResponse.json({
        success: true,
        message: "Marked as complete",
      }))
    }

    if (action === "snooze") {
      // Snooze reminder for a period
      const { snoozeDays = 7 } = body
      
      if (!companyId) {
        return addSecurityHeaders(NextResponse.json({ error: "Company ID required" }, { status: 400 }))
      }

      const snoozeUntil = new Date()
      snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays)

      await db.collection("annual_report_reminders").updateOne(
        { companyId: companyId },
        {
          $set: {
            status: "snoozed",
            snoozedUntil: snoozeUntil,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )

      return addSecurityHeaders(NextResponse.json({
        success: true,
        message: `Snoozed for ${snoozeDays} days`,
      }))
    }

    return addSecurityHeaders(NextResponse.json({ error: "Invalid action" }, { status: 400 }))
  } catch (error) {
    console.error("Error processing reminder action:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to process action" }, { status: 500 }))
  }
}
