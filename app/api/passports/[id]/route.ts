import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { del } from "@vercel/blob"

// GET /api/passports/[id] - Get passport by ID
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
    const passport = await db.collection("passports").findOne({ _id: new ObjectId(id) })

    if (!passport) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 })
    }

    // Check access rights
    if (decoded.role !== "admin" && passport.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: passport._id.toString(),
        ...passport,
      },
    })
  } catch (error) {
    console.error("Error fetching passport:", error)
    return NextResponse.json({ error: "Failed to fetch passport" }, { status: 500 })
  }
}

// DELETE /api/passports/[id] - Delete passport (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await connectDB()
    const passport = await db.collection("passports").findOne({ _id: new ObjectId(id) })

    if (!passport) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(passport.fileUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
    } catch (error) {
      console.error("Error deleting from blob:", error)
    }

    // Delete from database
    await db.collection("passports").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: "Passport deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting passport:", error)
    return NextResponse.json({ error: "Failed to delete passport" }, { status: 500 })
  }
}
