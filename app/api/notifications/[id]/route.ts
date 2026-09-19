import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { db } = await connectDB()

    const notification = await db.collection("notifications").findOne({ _id: new ObjectId(id) })

    if (!notification) {
      return addSecurityHeaders(NextResponse.json({ error: "Notification not found" }, { status: 404 }))
    }

    // Only admin or the notification owner can view
    if (decoded.role !== "admin" && notification.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: {
          id: notification._id.toString(),
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: notification.read || false,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        },
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 }))
    }

    const body = await req.json()
    const { title, message } = body

    if (!title?.trim() || !message?.trim()) {
      return addSecurityHeaders(NextResponse.json({ error: "Title and message are required" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const result = await db.collection("notifications").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title: title.trim(), message: message.trim(), updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    )

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Notification not found" }, { status: 404 }))
    }

    const updatedNotification = {
      id: result._id.toString(),
      userId: result.userId,
      type: result.type,
      title: result.title,
      message: result.message,
      read: result.read || false,
      metadata: result.metadata,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }

    broadcastUpdate("notifications", "updated", updatedNotification)

    return addSecurityHeaders(NextResponse.json({ success: true, data: updatedNotification }))
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update notification" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 }))
    }

    const { db } = await connectDB()

    const result = await db.collection("notifications").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return addSecurityHeaders(NextResponse.json({ error: "Notification not found" }, { status: 404 }))
    }

    broadcastUpdate("notifications", "deleted", { id })

    return addSecurityHeaders(NextResponse.json({ success: true, message: "Notification deleted" }))
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete notification" }, { status: 500 }))
  }
}
