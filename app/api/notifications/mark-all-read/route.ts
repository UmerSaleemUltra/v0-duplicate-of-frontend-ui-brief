import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

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

    const { db } = await connectDB()

    const result = await db.collection("notifications").updateMany(
      { userId: decoded.userId, read: false },
      {
        $set: {
          read: true,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    broadcastUpdate("notifications", "marked-all-read", { userId: decoded.userId })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount,
        message: "All notifications marked as read",
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 }))
  }
}
