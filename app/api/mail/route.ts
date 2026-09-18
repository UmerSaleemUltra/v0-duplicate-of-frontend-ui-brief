import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { verifyToken } from "@/config/jwt"
import { blobStorage } from "@/config/storage"

// GET /api/mail - Get all mail items (filtered by user for clients)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    const db = await getDatabase()
    const query: any = {}

    if (decoded.role === "client") {
      query.userId = decoded.userId
      if (companyId) query.companyId = companyId
    } else if (companyId) {
      query.companyId = companyId
    }

    const mailItems = await db.collection("mail").find(query).sort({ receivedDate: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: mailItems.map((mail) => ({
        id: mail._id.toString(),
        userId: mail.userId,
        companyId: mail.companyId,
        companyName: mail.companyName,
        from: mail.from,
        subject: mail.subject,
        type: mail.type,
        status: mail.status,
        hasAttachment: mail.hasAttachment,
        attachments: mail.attachments,
        receivedDate: mail.receivedDate,
        processedDate: mail.processedDate,
        notes: mail.notes,
        createdAt: mail.createdAt,
        updatedAt: mail.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching mail:", error)
    return NextResponse.json({ error: "Failed to fetch mail" }, { status: 500 })
  }
}

// POST /api/mail - Create mail item (admin only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const userId = formData.get("userId") as string
    const companyId = formData.get("companyId") as string
    const companyName = formData.get("companyName") as string
    const from = formData.get("from") as string
    const subject = formData.get("subject") as string
    const type = formData.get("type") as string
    const notes = formData.get("notes") as string

    if (!userId || !companyId || !companyName || !from || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const attachments: any[] = []
    const files = formData.getAll("files") as File[]

    for (const file of files) {
      if (file && file.size > 0) {
        const uploadResult = await blobStorage.upload(file, {
          folder: "mail-attachments",
          filename: file.name,
          access: "public",
        })

        attachments.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          fileUrl: uploadResult.url,
          fileSize: file.size,
          mimeType: file.type,
        })
      }
    }

    const db = await getDatabase()

    const newMail = {
      userId,
      companyId,
      companyName,
      from,
      subject,
      type: type || "general",
      status: "new",
      hasAttachment: attachments.length > 0,
      attachments,
      receivedDate: new Date().toISOString(),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("mail").insertOne(newMail)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newMail,
      },
    })
  } catch (error) {
    console.error("Error creating mail:", error)
    return NextResponse.json({ error: "Failed to create mail" }, { status: 500 })
  }
}
