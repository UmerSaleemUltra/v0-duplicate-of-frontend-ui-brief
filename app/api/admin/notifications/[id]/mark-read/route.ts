import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    // Only admins can use this endpoint
    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 }))
    }

    if (!ObjectId.isValid(id)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid notification ID" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const result = await db
      .collection("notifications")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { isRead: true, read: true, readAt: new Date() } }
      )

    if (result.matchedCount === 0) {
      return addSecurityHeaders(NextResponse.json({ error: "Notification not found" }, { status: 404 }))
    }

    return addSecurityHeaders(
      NextResponse.json({ success: true, message: "Notification marked as read" })
    )
  } catch (error) {
    console.error("Error marking admin notification as read:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 }))
  }
}
