/**
 * Admin API: Bulk Migrate Company Application Milestone
 * 
 * This endpoint silently updates all existing companies to mark the
 * companyApplicationApplied milestone as true, without triggering
 * any notifications. This is a one-time migration for existing orders.
 * 
 * POST /api/admin/migration/company-application-milestone
 * Body: { confirm: true } (safety measure to prevent accidental calls)
 */

import { getDatabase } from "@/config/database"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Verify this is an admin/internal call
    const authHeader = request.headers.get("authorization")
    const internalSecret = process.env.INTERNAL_API_SECRET

    // Safety check: require explicit confirmation
    const { confirm } = await request.json()
    if (confirm !== true) {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: true } in request body." },
        { status: 400 }
      )
    }

    // Optional: Verify internal secret if set
    if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const companiesCollection = db.collection("companies")

    // Silently update all companies - set companyApplicationApplied to true
    const result = await companiesCollection.updateMany(
      {
        $or: [
          { milestones: { $exists: false } },
          { "milestones.companyApplicationApplied": { $exists: false } }
        ]
      },
      {
        $set: {
          "milestones.companyApplicationApplied": true,
          "updatedAt": new Date()
        }
      }
    )

    console.log(`[Admin Migration] Updated ${result.modifiedCount} companies with companyApplicationApplied milestone`)

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      stats: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("[Admin Migration] Error:", error)
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
