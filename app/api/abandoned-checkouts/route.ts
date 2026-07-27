import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { deduplicateAbandonedCheckout, checkIfUserHasCompletedOrder } from "@/lib/abandoned-checkout-service"

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
    
    // Get abandoned checkouts from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const allAbandoned = await db
      .collection("abandoned_checkouts")
      .find({
        createdAt: { $gte: thirtyDaysAgo },
        recovered: { $ne: true }
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray()

    // Filter out abandoned checkouts for users who now have completed orders
    const abandonedCheckouts = []
    for (const checkout of allAbandoned) {
      if (checkout.email) {
        const hasOrder = await checkIfUserHasCompletedOrder(db, checkout.email)
        if (!hasOrder) {
          // User doesn't have order yet, include in abandoned list
          abandonedCheckouts.push(checkout)
        } else {
          // User now has completed order, remove from abandoned checkouts in background
          console.log("[v0] Found user with completed order in abandoned list:", checkout.email)
          db.collection("abandoned_checkouts").deleteOne({ _id: checkout._id }).catch(err => {
            console.warn("[v0] Failed to clean up abandoned checkout:", err)
          })
        }
      } else {
        // No email, include in list
        abandonedCheckouts.push(checkout)
      }
    }

    // Calculate stats
    const totalAbandoned = abandonedCheckouts.length
    const last24h = abandonedCheckouts.filter(c => {
      const createdAt = new Date(c.createdAt)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      return createdAt >= oneDayAgo
    }).length

    const last7Days = abandonedCheckouts.filter(c => {
      const createdAt = new Date(c.createdAt)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return createdAt >= sevenDaysAgo
    }).length

    // Calculate potential revenue lost
    const potentialRevenue = abandonedCheckouts.reduce((sum, checkout) => {
      return sum + (checkout.estimatedTotal || checkout.packagePrice || 0)
    }, 0)

    // Calculate step breakdown
    const stepBreakdown: Record<string, number> = {
      "Account": 0,
      "State & Package": 0,
      "Business Info": 0,
      "Owner Info": 0,
      "Review": 0,
      "Payment": 0
    }

    const stepNames = ["Account", "State & Package", "Business Info", "Owner Info", "Review", "Payment"]
    abandonedCheckouts.forEach(checkout => {
      const stepName = stepNames[checkout.lastStep] || "Unknown"
      stepBreakdown[stepName] = (stepBreakdown[stepName] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: abandonedCheckouts,
      stats: {
        total: totalAbandoned,
        last24h,
        last7Days,
        potentialRevenue,
        stepBreakdown
      }
    })
  } catch (error) {
    console.error("Error fetching abandoned checkouts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Track abandoned checkout with deduplication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sessionId, 
      email, 
      name,
      phone,
      lastStep, 
      state, 
      packageType, 
      businessName,
      estimatedTotal,
      packagePrice,
      addons
    } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const { db } = await connectDB()

    // Check if customer already has a completed order
    // If yes, don't save to abandoned checkouts (they're a customer, not abandoned)
    if (email) {
      const hasOrder = await checkIfUserHasCompletedOrder(db, email)
      if (hasOrder) {
        console.log("[v0] User already has completed order, skipping abandoned checkout:", email)
        return NextResponse.json({ 
          success: true, 
          message: "User already has completed order" 
        })
      }
    }

    // Use service function for deduplication
    // If email+sessionId exists, it will update the existing record
    // Otherwise, it creates a new one
    await deduplicateAbandonedCheckout(db, sessionId, email, {
      name,
      phone,
      lastStep,
      state,
      packageType,
      businessName,
      estimatedTotal,
      packagePrice,
      addons
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error tracking abandoned checkout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Mark as recovered
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = await verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { sessionId, recovered } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const { db } = await connectDB()

    await db.collection("abandoned_checkouts").updateOne(
      { sessionId },
      { 
        $set: { 
          recovered: recovered ?? true,
          recoveredAt: new Date()
        } 
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating abandoned checkout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete old records
export async function DELETE(request: NextRequest) {
  try {
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

    // Delete records older than 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const result = await db.collection("abandoned_checkouts").deleteMany({
      createdAt: { $lt: ninetyDaysAgo }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    })
  } catch (error) {
    console.error("Error deleting abandoned checkouts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
