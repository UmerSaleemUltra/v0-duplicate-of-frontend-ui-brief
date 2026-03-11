import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { randomBytes } from "crypto"

/**
 * Admin-only endpoint to generate (or regenerate) a shareable status token.
 *
 * POST /api/orders/:id/share-token
 * Returns: { shareToken, shareUrl }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    if (!id || id.length !== 24) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid order ID" }, { status: 400 }))
    }

    const { db } = await connectDB()

    // Generate a cryptographically secure random token
    const shareToken = randomBytes(24).toString("hex")

    // Try updating standalone orders collection
    let result = await db
      .collection("orders")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { shareToken, updatedAt: new Date().toISOString() } },
        { returnDocument: "after" },
      )

    // If not found, update embedded order inside companies
    if (!result) {
      const companies = await db
        .collection("companies")
        .find({ orders: { $exists: true, $ne: [] } })
        .toArray()

      for (const company of companies) {
        const embeddedIndex = company.orders?.findIndex((o: any) => {
          return (o._id?.toString() || o.id?.toString()) === id
        })

        if (embeddedIndex !== undefined && embeddedIndex >= 0) {
          const updatedOrders = [...company.orders]
          updatedOrders[embeddedIndex] = {
            ...updatedOrders[embeddedIndex],
            shareToken,
            updatedAt: new Date().toISOString(),
          }

          await db.collection("companies").updateOne(
            { _id: company._id },
            { $set: { orders: updatedOrders, updatedAt: new Date().toISOString() } },
          )

          result = updatedOrders[embeddedIndex]
          break
        }
      }
    }

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin
    const shareUrl = `${origin}/track/${id}?token=${shareToken}`

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: { shareToken, shareUrl },
      }),
    )
  } catch (error) {
    console.error("[share-token] Error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }))
  }
}
