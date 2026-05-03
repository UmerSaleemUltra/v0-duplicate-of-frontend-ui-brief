import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

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

    const abandonedCheckouts = await db
      .collection("abandoned_checkouts")
      .find({
        createdAt: { $gte: thirtyDaysAgo },
        recovered: { $ne: true }
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray()

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

// Track abandoned checkout
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

    const now = new Date()
    const checkoutData = {
      sessionId,
      email: email || null,
      name: name || null,
      phone: phone || null,
      lastStep: lastStep || 0,
      state: state || null,
      packageType: packageType || null,
      businessName: businessName || null,
      estimatedTotal: estimatedTotal || 0,
      packagePrice: packagePrice || 0,
      addons: addons || [],
      recovered: false,
      updatedAt: now
    }

    // Upsert - update if exists, create if not
    await db.collection("abandoned_checkouts").updateOne(
      { sessionId },
      { 
        $set: checkoutData,
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking abandoned checkout:", error)
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
