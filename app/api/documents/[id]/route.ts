import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { del } from "@vercel/blob"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    let document = null

    if (ObjectId.isValid(id)) {
      document = await db.collection("documents").findOne({ _id: new ObjectId(id) })
    }

    if (!document) {
      document = await db.collection("documents").findOne({ id: id })
    }

    if (!document) {
      return addSecurityHeaders(NextResponse.json({ error: "Document not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && document.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: {
          id: document._id?.toString() || document.id,
          ...document,
        },
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch document" }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = await req.json()

    const { name, type, title, description, status } = body

    const { db } = await connectDB()

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (name) updateData.name = name
    if (type) updateData.type = type
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (status) updateData.status = status

    let result = null

    if (ObjectId.isValid(id)) {
      result = await db
        .collection("documents")
        .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })
    }

    if (!result) {
      result = await db
        .collection("documents")
        .findOneAndUpdate({ id: id }, { $set: updateData }, { returnDocument: "after" })
    }

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Document not found" }, { status: 404 }))
    }

    const updatedDocument = { id: result._id?.toString() || result.id, ...result }

    broadcastUpdate("documents", "updated", updatedDocument)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedDocument,
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update document" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const { db } = await connectDB()

    let document = null

    if (ObjectId.isValid(id)) {
      document = await db.collection("documents").findOne({ _id: new ObjectId(id) })
    }

    if (!document) {
      document = await db.collection("documents").findOne({ id: id })
    }

    if (!document) {
      return addSecurityHeaders(NextResponse.json({ error: "Document not found" }, { status: 404 }))
    }

    if (document.fileUrl) {
      try {
        await del(document.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
      } catch (error) {}
    }

    if (document._id) {
      await db.collection("documents").deleteOne({ _id: document._id })
    } else {
      await db.collection("documents").deleteOne({ id: document.id })
    }

    broadcastUpdate("documents", "deleted", { id })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete document" }, { status: 500 }))
  }
}
