import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { del } from "@vercel/blob"

// GET /api/documents/[id] - Get document by ID
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
    const document = await db.collection("documents").findOne({ _id: new ObjectId(id) })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check access rights
    if (decoded.role !== "admin" && document.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: document._id.toString(),
        ...document,
      },
    })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - Delete document
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
    const document = await db.collection("documents").findOne({ _id: new ObjectId(id) })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(document.fileUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
    } catch (error) {
      console.error("Error deleting from blob:", error)
    }

    // Delete from database
    await db.collection("documents").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
