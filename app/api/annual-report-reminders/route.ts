import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { STATE_ANNUAL_REPORT_DEADLINES, calculateNextDueDate, getUrgencyLevel } from "@/lib/annual-report-deadlines"
import { sendEmail, emailTemplates } from "@/config/email"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { db } = await connectDB()

    // Get all companies with their formation dates
    const companies = await db.collection("companies").find({
      status: { $ne: "dissolved" },
    }).toArray()

    // Get users for email info
    const users = await db.collection("users").find({}).toArray()

    // Get existing reminders tracking
    const remindersCollection = db.collection("annual_report_reminders")
    const existingReminders = await remindersCollection.find({}).toArray()
    const remindersByCompanyId = new Map(existingReminders.map(r => [r.companyId.toString(), r]))

    const reminders: any[] = []

    for (const company of companies) {
      const state = company.state
      const formationDate = company.formationDate || company.createdAt

      if (!state || !formationDate) continue

      const stateInfo = STATE_ANNUAL_REPORT_DEADLINES[state]
      if (!stateInfo) continue

      // Skip states with no annual report requirement
      if (stateInfo.fee === 0 && stateInfo.notes?.includes("No annual report")) continue

      const dueDateInfo = calculateNextDueDate(state, formationDate)
      if (!dueDateInfo) continue

      const { dueDate, daysUntil } = dueDateInfo
      const urgency = getUrgencyLevel(daysUntil)

      const user = users.find(u => u._id.toString() === company.userId?.toString())
      const existingReminder = remindersByCompanyId.get(company._id.toString())

      reminders.push({
        id: existingReminder?._id?.toString() || company._id.toString(),
        companyId: company._id.toString(),
        companyName: company.name,
        state,
        formationDate,
        dueDate: dueDate.toISOString(),
        daysUntil,
        urgency,
        fee: stateInfo.fee,
        lateFee: stateInfo.lateFee,
        notes: stateInfo.notes,
        userEmail: user?.email || null,
        userName: user?.name || company.members?.[0]?.name || "Client",
        status: existingReminder?.status || "pending",
        lastSent: existingReminder?.lastSent || null,
        sentCount: existingReminder?.sentCount || 0,
        snoozedUntil: existingReminder?.snoozedUntil || null,
      })
    }

    // Sort by urgency (most urgent first)
    reminders.sort((a, b) => a.daysUntil - b.daysUntil)

    return NextResponse.json({
      success: true,
      data: reminders,
      stats: {
        total: reminders.length,
        critical: reminders.filter(r => r.urgency === "critical").length,
        urgent: reminders.filter(r => r.urgency === "urgent").length,
        upcoming: reminders.filter(r => r.urgency === "upcoming").length,
        later: reminders.filter(r => r.urgency === "later").length,
      }
    })
  } catch (error: any) {
    console.error("Error fetching annual report reminders:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch reminders" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const { action, companyId, snoozeDays } = body

    const { db } = await connectDB()
    const remindersCollection = db.collection("annual_report_reminders")

    if (action === "send_reminder") {
      // Get company details
      const company = await db.collection("companies").findOne({ _id: new ObjectId(companyId) })
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 })
      }

      const user = await db.collection("users").findOne({ _id: new ObjectId(company.userId) })
      if (!user?.email) {
        return NextResponse.json({ error: "No email found for company owner" }, { status: 400 })
      }

      const state = company.state
      const formationDate = company.formationDate || company.createdAt
      const stateInfo = STATE_ANNUAL_REPORT_DEADLINES[state]
      const dueDateInfo = calculateNextDueDate(state, formationDate)

      if (!stateInfo || !dueDateInfo) {
        return NextResponse.json({ error: "Could not calculate due date" }, { status: 400 })
      }

      // Send email
      const emailContent = emailTemplates.annualReportReminder(
        user.name || "Valued Client",
        company.name,
        state,
        dueDateInfo.dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        dueDateInfo.daysUntil,
        stateInfo.fee
      )

      const emailResult = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      if (!emailResult.success) {
        return NextResponse.json({ error: "Failed to send email: " + emailResult.error }, { status: 500 })
      }

      // Update reminder tracking
      await remindersCollection.updateOne(
        { companyId: new ObjectId(companyId) },
        {
          $set: {
            companyId: new ObjectId(companyId),
            lastSent: new Date(),
            status: "sent",
          },
          $inc: { sentCount: 1 },
        },
        { upsert: true }
      )

      return NextResponse.json({
        success: true,
        message: `Reminder sent to ${user.email}`,
      })
    }

    if (action === "mark_complete") {
      await remindersCollection.updateOne(
        { companyId: new ObjectId(companyId) },
        {
          $set: {
            companyId: new ObjectId(companyId),
            status: "completed",
            completedAt: new Date(),
          },
        },
        { upsert: true }
      )

      return NextResponse.json({
        success: true,
        message: "Marked as completed",
      })
    }

    if (action === "snooze") {
      const snoozeUntil = new Date()
      snoozeUntil.setDate(snoozeUntil.getDate() + (snoozeDays || 7))

      await remindersCollection.updateOne(
        { companyId: new ObjectId(companyId) },
        {
          $set: {
            companyId: new ObjectId(companyId),
            status: "snoozed",
            snoozedUntil: snoozeUntil,
          },
        },
        { upsert: true }
      )

      return NextResponse.json({
        success: true,
        message: `Snoozed for ${snoozeDays || 7} days`,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error processing annual report reminder action:", error)
    return NextResponse.json({ error: error.message || "Failed to process action" }, { status: 500 })
  }
}
