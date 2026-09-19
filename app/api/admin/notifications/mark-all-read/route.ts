import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function PUT(req: NextRequest) {
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

    // Only admins can use this endpoint
    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 }))
    }

    const { db } = await connectDB()

    // Mark ALL unread notifications as read (admin sees all users' notifications)
    const result = await db.collection("notifications").updateMany(
      { $or: [{ read: false }, { isRead: false }, { read: { $exists: false } }] },
      { $set: { read: true, isRead: true, readAt: new Date() } }
    )

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount,
        message: "All notifications marked as read",
      })
    )
  } catch (error) {
    console.error("Error marking all admin notifications as read:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 }))
  }
}
