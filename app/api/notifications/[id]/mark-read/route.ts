import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { db } = await connectDB()
    const notification = await db.collection("notifications").findOne({ _id: new ObjectId(id) })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    if (notification.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db
      .collection("notifications")
      .updateOne({ _id: new ObjectId(id) }, { $set: { isRead: true, read: true, readAt: new Date() } })

    broadcast("notification_read", { id, userId: decoded.userId })

    const response = NextResponse.json({
      success: true,
      message: "Notification marked as read",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}
