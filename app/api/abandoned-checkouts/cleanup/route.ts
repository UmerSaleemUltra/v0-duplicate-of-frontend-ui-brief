import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

/**
 * Admin cleanup endpoint to remove abandoned checkouts for users who now have completed orders.
 * Runs a one-time scan to clean up orphaned abandoned checkout records.
 * GET /api/abandoned-checkouts/cleanup?token=admin_token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = await verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { db } = await connectDB()

    // Get all abandoned checkouts
    const allAbandoned = await db.collection("abandoned_checkouts").find({}).toArray()

    let cleanedCount = 0
    const errors = []

    // Check each abandoned checkout
    for (const checkout of allAbandoned) {
      if (!checkout.email) continue

      // Check if user with this email has a completed order
      const user = await db.collection("users").findOne({ email: checkout.email.toLowerCase() })
      
      if (user) {
        const company = await db.collection("companies").findOne({ userId: user._id.toString() })
        
        if (company) {
          // User has completed order, delete abandoned checkout
          try {
            await db.collection("abandoned_checkouts").deleteOne({ _id: checkout._id })
            cleanedCount++
            console.log("[v0] Cleaned up abandoned checkout for user with order:", checkout.email)
          } catch (deleteError) {
            errors.push({
              email: checkout.email,
              error: String(deleteError)
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      cleaned: cleanedCount,
      total: allAbandoned.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error("[v0] Error in abandoned checkout cleanup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
