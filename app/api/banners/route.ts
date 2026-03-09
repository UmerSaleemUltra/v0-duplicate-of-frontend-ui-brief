import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

// GET — client fetches their own company's active banner
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

    if (!companyId) {
      return addSecurityHeaders(NextResponse.json({ error: "companyId is required" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const banner = await db
      .collection("banners")
      .findOne({ companyId, active: true }, { sort: { createdAt: -1 } })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: banner
          ? {
              id: banner._id.toString(),
              companyId: banner.companyId,
              message: banner.message,
              type: banner.type || "info",
              active: banner.active,
              createdAt: banner.createdAt,
            }
          : null,
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 }))
  }
}

// POST — admin sets a banner for a company (replaces any existing one)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 }))
    }

    const body = await req.json()
    const { companyId, message, type = "info" } = body

    if (!companyId || !message || !message.trim()) {
      return addSecurityHeaders(NextResponse.json({ error: "companyId and message are required" }, { status: 400 }))
    }

    const validTypes = ["info", "warning", "success", "error"]
    if (!validTypes.includes(type)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid banner type" }, { status: 400 }))
    }

    const { db } = await connectDB()

    // Deactivate any existing banners for this company
    await db.collection("banners").updateMany({ companyId }, { $set: { active: false } })

    // Insert new active banner
    const newBanner = {
      companyId,
      message: message.trim(),
      type,
      active: true,
      createdBy: decoded.userId,
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("banners").insertOne(newBanner)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: { id: result.insertedId.toString(), ...newBanner },
      }),
      { status: 201 },
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create banner" }, { status: 500 }))
  }
}

// DELETE — admin removes the active banner for a company
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 }))
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return addSecurityHeaders(NextResponse.json({ error: "companyId is required" }, { status: 400 }))
    }

    const { db } = await connectDB()

    await db.collection("banners").updateMany({ companyId, active: true }, { $set: { active: false } })

    return addSecurityHeaders(NextResponse.json({ success: true, message: "Banner removed" }))
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to remove banner" }, { status: 500 }))
  }
}
