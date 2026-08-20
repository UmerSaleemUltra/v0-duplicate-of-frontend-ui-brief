import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

/**
 * Stores (upserts) a Web Push subscription for a checkout lead, keyed by the
 * subscription endpoint so re-subscribing updates the same record. The
 * sessionId / email / phone identity is saved alongside so the recovery flow
 * can look the subscription up when the lead leaves the page.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, email, phone, subscription } = body

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Subscription required" }, { status: 400 })
    }
    if (!sessionId && !email) {
      return NextResponse.json({ error: "Identity required" }, { status: 400 })
    }

    const { db } = await connectDB()
    const now = new Date()
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null
    const normalizedPhone = phone ? String(phone).replace(/\D/g, "") : null

    await db.collection("push_subscriptions").updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          subscription,
          sessionId: sessionId || null,
          email: normalizedEmail,
          phoneNormalized: normalizedPhone,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving push subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
