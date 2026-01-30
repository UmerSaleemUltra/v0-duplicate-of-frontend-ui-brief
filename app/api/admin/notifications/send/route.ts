import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req)
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (authResult.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = authResult.user

    const { title, message, userId, type = "info" } = await req.json()

    if (!title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create notification object
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type, // "info", "success", "warning", "error"
      userId,
      createdAt: new Date(),
      read: false,
      icon: getIconForType(type),
    }

    // Store notification in database (if available)
    // For now, returning success response
    return NextResponse.json({
      success: true,
      notification,
      message: "Notification sent successfully",
    })
  } catch (error) {
    console.error("[v0] Notification API Error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }
  return icons[type] || "ℹ"
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req)
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (authResult.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Return mock notifications for now
    const notifications = [
      {
        id: "notif_001",
        title: "New Order",
        message: "A new order has been placed",
        type: "success",
        createdAt: new Date(Date.now() - 3600000),
        read: false,
      },
      {
        id: "notif_002",
        title: "System Alert",
        message: "High memory usage detected",
        type: "warning",
        createdAt: new Date(Date.now() - 7200000),
        read: true,
      },
    ]

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error("[v0] Notification API Error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
