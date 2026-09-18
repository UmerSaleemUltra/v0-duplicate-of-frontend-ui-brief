import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

// GET /api/notifications - Get user notifications
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectDB()
    const notifications = await db
      .collection("notifications")
      .find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      success: true,
      data: notifications.map((notif) => ({
        id: notif._id.toString(),
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
        createdAt: notif.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// POST /api/notifications - Create notification (admin only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, type, title, message, actionUrl, metadata } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectDB()

    const newNotification = {
      userId,
      type,
      title,
      message,
      isRead: false,
      actionUrl,
      metadata,
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("notifications").insertOne(newNotification)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newNotification,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
