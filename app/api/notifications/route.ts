import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    const { db } = await connectDB()

    const query: any = { userId: decoded.userId }
    if (companyId) {
      query.$or = [{ "metadata.companyId": companyId }, { companyId: companyId }]
    }

    const notifications = await db.collection("notifications").find(query).sort({ createdAt: -1 }).limit(50).toArray()

    const result = {
      success: true,
      data: notifications.map((notif) => ({
        id: notif._id.toString(),
        userId: notif.userId,
        companyId: notif.companyId || notif.metadata?.companyId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read || notif.isRead || false,
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
        createdAt: notif.createdAt,
      })),
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 }))
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const body = await req.json()
    const { userId, type, title, message, actionUrl, metadata } = body

    if (!userId || !type || !title || !message) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    if (type === "system") {
      if (userId !== decoded.userId && decoded.role !== "admin") {
        return addSecurityHeaders(
          NextResponse.json({ error: "You can only create system notifications for yourself" }, { status: 403 }),
        )
      }
    } else if (type === "addon_purchased") {
      // Allow users to create addon_purchased notifications for their own addons
      const userIdStr = decoded.userId instanceof Object && "_id" in decoded.userId 
        ? (decoded.userId as any)._id.toString() 
        : decoded.userId.toString()
      const targetUserIdStr = userId instanceof Object && "_id" in userId 
        ? (userId as any)._id.toString() 
        : userId.toString()
      
      if (userIdStr !== targetUserIdStr && decoded.role !== "admin") {
        return addSecurityHeaders(
          NextResponse.json({ error: "You can only create notifications for yourself" }, { status: 403 }),
        )
      }
    } else if (decoded.role !== "admin") {
      return addSecurityHeaders(
        NextResponse.json({ error: "Only admins can create this type of notification" }, { status: 403 }),
      )
    }

    const { db } = await connectDB()

    const newNotification = {
      userId,
      type,
      title,
      message,
      read: false,
      actionUrl: actionUrl || null,
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("notifications").insertOne(newNotification)
    const notificationId = result.insertedId.toString()

    const createdNotification = { id: notificationId, ...newNotification }

    broadcastUpdate("notifications", "created", createdNotification)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdNotification,
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create notification" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 }))
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const milestoneName = searchParams.get("milestoneName")

    if (!companyId || !milestoneName) {
      return addSecurityHeaders(NextResponse.json({ error: "companyId and milestoneName required" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const result = await db.collection("notifications").deleteMany({
      type: "milestone_completed",
      "metadata.companyId": companyId,
      "metadata.milestoneName": milestoneName,
    })

    broadcastUpdate("notifications", "deleted", { companyId, milestoneName })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        message: "Notifications deleted successfully",
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 }))
  }
}
