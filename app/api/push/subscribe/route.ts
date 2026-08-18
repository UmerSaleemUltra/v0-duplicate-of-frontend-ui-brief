import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

// Store or refresh a browser push subscription for an abandoned-checkout lead.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, sessionId, email } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const { db } = await connectDB()
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null

    await db.collection("push_subscriptions").updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          sessionId: sessionId || null,
          email: normalizedEmail,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to store push subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
