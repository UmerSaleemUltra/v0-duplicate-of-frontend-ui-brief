import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { put } from "@vercel/blob"
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
    const mail = await db.collection("mail").findOne({ _id: new ObjectId(id) })

    if (!mail) {
      return addSecurityHeaders(NextResponse.json({ error: "Mail not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && mail.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: {
          id: mail._id.toString(),
          ...mail,
        },
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch mail" }, { status: 500 }))
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
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const { db } = await connectDB()

    const mail = await db.collection("mail").findOne({ _id: new ObjectId(id) })

    if (!mail) {
      return addSecurityHeaders(NextResponse.json({ error: "Mail not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && mail.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const contentType = req.headers.get("content-type") || ""
    let updateData: any = {}

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File
      const subject = formData.get("subject") as string
      const from = formData.get("from") as string
      const type = formData.get("type") as string
      const notes = formData.get("notes") as string

      updateData = {
        subject,
        from,
        type,
        notes: notes || mail.notes,
        updatedAt: new Date().toISOString(),
      }

      if (file && file.size > 0) {
        const blob = await put(file.name, file, {
          access: "public",
        })

        if (mail.attachments && mail.attachments.length > 0) {
          const { blobStorage } = await import("@/config/storage")
          for (const attachment of mail.attachments) {
            try {
              await blobStorage.delete(attachment.fileUrl)
            } catch (error) {}
          }
        }

        updateData.attachments = [
          {
            name: file.name,
            fileUrl: blob.url,
            size: file.size,
            type: file.type,
          },
        ]
      }
    } else {
      const body = await req.json()
      updateData = {
        ...body,
        updatedAt: new Date().toISOString(),
      }
    }

    const result = await db
      .collection("mail")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Mail not found" }, { status: 404 }))
    }

    const updatedMail = { id: result._id.toString(), ...result }

    broadcastUpdate("mail", "updated", updatedMail)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedMail,
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update mail" }, { status: 500 }))
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
    const mail = await db.collection("mail").findOne({ _id: new ObjectId(id) })

    if (!mail) {
      return addSecurityHeaders(NextResponse.json({ error: "Mail not found" }, { status: 404 }))
    }

    await db.collection("mail").deleteOne({ _id: new ObjectId(id) })

    if (mail.attachments && mail.attachments.length > 0) {
      const { blobStorage } = await import("@/config/storage")
      for (const attachment of mail.attachments) {
        try {
          await blobStorage.delete(attachment.fileUrl)
        } catch (error) {}
      }
    }

    broadcastUpdate("mail", "deleted", { id })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Mail item deleted successfully",
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete mail" }, { status: 500 }))
  }
}
