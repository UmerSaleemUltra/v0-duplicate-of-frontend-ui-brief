import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"

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

    const { db } = await connectDB()

    let document
    try {
      document = await db.collection("documents").findOne({ _id: new ObjectId(id) })
    } catch (e) {
      document = await db.collection("documents").findOne({ id: id })
    }

    if (!document) {
      document = await db.collection("documents").findOne({ _id: id as string })
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (decoded.role !== "admin" && document.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fileResponse = await fetch(document.fileUrl)

    if (!fileResponse.ok) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 })
    }

    const fileBlob = await fileResponse.blob()

    const fileName = document.name || document.fileName || document.title || "document"

    return new NextResponse(fileBlob, {
      headers: {
        "Content-Type": document.mimeType || document.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
  }
}
