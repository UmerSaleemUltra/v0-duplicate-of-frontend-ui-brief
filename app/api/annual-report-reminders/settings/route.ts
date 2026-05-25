import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

// GET - Fetch reminder settings
export async function GET(req: NextRequest) {
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
    
    const settings = await db.collection("annual_report_settings").findOne({ type: "global" })
    
    return addSecurityHeaders(NextResponse.json({
      success: true,
      data: settings || {
        type: "global",
        reminderDays: [60, 30, 14, 7, 3, 1], // Default: send reminders at these intervals
        enableAutoSend: true,
        createdAt: new Date(),
      }
    }))
  } catch (error) {
    console.error("Error fetching settings:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 }))
  }
}

// POST - Update reminder settings
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
    const { reminderDays, enableAutoSend } = body

    if (!Array.isArray(reminderDays) || reminderDays.length === 0) {
      return addSecurityHeaders(NextResponse.json({ error: "reminderDays must be a non-empty array" }, { status: 400 }))
    }

    // Validate that all values are positive integers
    if (!reminderDays.every((day: any) => Number.isInteger(day) && day > 0)) {
      return addSecurityHeaders(NextResponse.json({ error: "All days must be positive integers" }, { status: 400 }))
    }

    const result = await db.collection("annual_report_settings").updateOne(
      { type: "global" },
      {
        $set: {
          type: "global",
          reminderDays: reminderDays.sort((a, b) => b - a), // Sort descending
          enableAutoSend: enableAutoSend !== false,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    )

    const updatedSettings = await db.collection("annual_report_settings").findOne({ type: "global" })

    return addSecurityHeaders(NextResponse.json({
      success: true,
      data: updatedSettings,
      message: `Updated reminder settings. Reminders will be sent ${reminderDays.sort((a, b) => b - a).join(", ")} days before due date.`,
    }))
  } catch (error) {
    console.error("Error updating settings:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update settings" }, { status: 500 }))
  }
}
