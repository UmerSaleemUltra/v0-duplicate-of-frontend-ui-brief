import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

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

    // Only admins can access this endpoint
    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 }))
    }

    const { db } = await connectDB()

    // Fetch ALL notifications for admin view (not filtered by user)
    const notifications = await db
      .collection("notifications")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

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
        isRead: notif.read || notif.isRead || false,
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
        createdAt: notif.createdAt,
      })),
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 }))
  }
}
