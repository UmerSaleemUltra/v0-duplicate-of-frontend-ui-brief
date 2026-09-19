import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { validateObjectId } from "@/lib/validation"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    validateObjectId(id, "Order ID")

    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }
    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = await req.json()
    if (body.status !== "sent" && body.status !== "failed") {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid invitation status" }, { status: 400 }))
    }

    const { db } = await connectDB()
    const deliveryId = new ObjectId(id)
    const timestamp = new Date().toISOString()
    const timestampField = body.status === "sent" ? "trustpilotSentAt" : "trustpilotFailedAt"

    const delivery = await db.collection("order_completion_deliveries").findOneAndUpdate(
      { _id: deliveryId, trustpilotStatus: "claimed" },
      {
        $set: {
          trustpilotStatus: body.status,
          [timestampField]: timestamp,
          updatedAt: timestamp,
        },
      },
      { returnDocument: "after" },
    )

    // A repeated acknowledgement is harmless and must never resend an invitation.
    if (!delivery) {
      return addSecurityHeaders(NextResponse.json({ success: true, acknowledged: false }))
    }

    const deliveryState = {
      trustpilotStatus: body.status,
      [timestampField]: timestamp,
    }

    const standaloneResult = await db.collection("orders").updateOne(
      { _id: deliveryId },
      {
        $set: Object.fromEntries(
          Object.entries(deliveryState).map(([key, value]) => [`completionDelivery.${key}`, value]),
        ),
      },
    )

    if (standaloneResult.matchedCount === 0) {
      await db.collection("companies").updateOne(
        { "orders._id": deliveryId },
        {
          $set: Object.fromEntries(
            Object.entries(deliveryState).map(([key, value]) => [`orders.$.completionDelivery.${key}`, value]),
          ),
        },
      )

      await db.collection("companies").updateOne(
        { "orders.id": id },
        {
          $set: Object.fromEntries(
            Object.entries(deliveryState).map(([key, value]) => [`orders.$.completionDelivery.${key}`, value]),
          ),
        },
      )
    }

    return addSecurityHeaders(NextResponse.json({ success: true, acknowledged: true }))
  } catch (error) {
    console.error("[v0] Failed to acknowledge Trustpilot invitation")
    return addSecurityHeaders(NextResponse.json({ error: "Failed to acknowledge invitation" }, { status: 500 }))
  }
}
