import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAdminAuth } from "@/lib/api-middleware"

/**
 * Bulk migrate milestone for existing companies WITHOUT sending notifications
 * This is a one-time migration endpoint for admin use only
 * POST /api/admin/bulk-milestone-migrate
 * Body: { milestoneName: string }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await verifyAdminAuth(request)
    if (!adminAuth.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { milestoneName } = await request.json()

    if (!milestoneName) {
      return NextResponse.json(
        { error: "milestoneName is required" },
        { status: 400 }
      )
    }

    console.log(
      `[Bulk Migration] Starting bulk update for milestone: ${milestoneName}`
    )

    // Update all companies to complete this milestone without creating notifications
    const result = await db.collection("companies").updateMany(
      {},
      {
        $set: {
          [`milestones.${milestoneName}`]: true,
          updatedAt: new Date(),
        },
      }
    )

    console.log(
      `[Bulk Migration] Updated ${result.modifiedCount} companies for milestone: ${milestoneName}`
    )

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} companies`,
      milestoneName,
      modifiedCount: result.modifiedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Bulk Migration] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to bulk migrate milestone",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
