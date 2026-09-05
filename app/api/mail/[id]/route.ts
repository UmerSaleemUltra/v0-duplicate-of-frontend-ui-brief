import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"

// GET /api/mail/[id] - Get mail item by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const db = await connectDB()
    const mail = await db.collection("mail").findOne({ _id: new ObjectId(id) })

    if (!mail) {
      return NextResponse.json({ error: "Mail not found" }, { status: 404 })
    }

    // Check access rights
    if (decoded.role !== "admin" && mail.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: mail._id.toString(),
        ...mail,
      },
    })
  } catch (error) {
    console.error("Error fetching mail:", error)
    return NextResponse.json({ error: "Failed to fetch mail" }, { status: 500 })
  }
}

// PUT /api/mail/[id] - Update mail item
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

    const body = await req.json()
    const db = await connectDB()

    // Check mail exists and user has access
    const mail = await db.collection("mail").findOne({ _id: new ObjectId(id) })

    if (!mail) {
      return NextResponse.json({ error: "Mail not found" }, { status: 404 })
    }

    if (decoded.role !== "admin" && mail.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    // If status is being updated to "read", set processedDate
    if (body.status === "read" && mail.status !== "read") {
      updateData.processedDate = new Date().toISOString()
    }

    const result = await db
      .collection("mail")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    return NextResponse.json({
      success: true,
      data: {
        id: result._id.toString(),
        ...result,
      },
    })
  } catch (error) {
    console.error("Error updating mail:", error)
    return NextResponse.json({ error: "Failed to update mail" }, { status: 500 })
  }
}
