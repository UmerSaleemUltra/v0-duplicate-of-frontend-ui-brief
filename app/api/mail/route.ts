import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { blobStorage } from "@/config/storage"
import { sendEmail, emailTemplates } from "@/config/email"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import { redisCache } from "@/lib/redis-cache"

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

    // Generate cache key
    const cacheKey = `mail:${decoded.userId}:${companyId || 'all'}`
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Mail items served from cache')
      return addSecurityHeaders(NextResponse.json(cachedData))
    }

    const { db } = await connectDB()
    const query: any = {}

    if (decoded.role === "client") {
      query.userId = decoded.userId
      if (companyId) query.companyId = companyId
    } else if (companyId) {
      query.companyId = companyId
    }

    const mailItems = await db.collection("mail").find(query).sort({ receivedDate: -1 }).limit(100).toArray()

    const result = {
      success: true,
      data: mailItems.map((mail) => ({
        id: mail._id.toString(),
        userId: mail.userId,
        companyId: mail.companyId,
        companyName: mail.companyName,
        from: mail.from,
        subject: mail.subject,
        type: mail.type,
        hasAttachment: mail.hasAttachment,
        attachments: mail.attachments,
        receivedDate: mail.receivedDate,
        processedDate: mail.processedDate,
        notes: mail.notes,
        createdAt: mail.createdAt,
        updatedAt: mail.updatedAt,
      })),
    }

    // Cache for 3 minutes
    await redisCache.set(cacheKey, result, 180)

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60")
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch mail" }, { status: 500 }))
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
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
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    const files = formData.getAll("files") as File[]
    const maxFileSize = 10 * 1024 * 1024

    for (const file of files) {
      if (file && file.size > maxFileSize) {
        return addSecurityHeaders(NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 }))
      }
    }

    const uploadPromises = files
      .filter((file) => file && file.size > 0)
      .map((file) =>
        blobStorage
          .upload(file, {
            folder: "mail-attachments",
            filename: file.name,
            access: "public",
          })
          .then((uploadResult) => ({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            fileUrl: uploadResult.url,
            fileSize: file.size,
            mimeType: file.type,
          })),
      )

    const attachments = await Promise.all(uploadPromises)

    const { db } = await connectDB()

    const newMail = {
      userId,
      companyId,
      companyName,
      from,
      subject,
      type: type || "general",
      hasAttachment: attachments.length > 0,
      attachments,
      receivedDate: new Date().toISOString(),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("mail").insertOne(newMail)
    const mailId = result.insertedId.toString()

    const createdMail = { id: mailId, ...newMail }

    broadcastUpdate("mail", "created", createdMail)

    try {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) }, { projection: { name: 1, email: 1 } })

      if (user) {
        const mailEmail = emailTemplates.mailReceived(
          user.name,
          subject,
          from,
          companyName,
          type,
          createdMail.createdAt || new Date(),
        )

        await sendEmail({
          to: user.email,
          subject: mailEmail.subject,
          html: mailEmail.html,
        }).catch((emailError) => {
          console.log("[v0] Email sending failed (non-critical):", emailError)
        })

        const adminEmail = emailTemplates.adminMailReceived(
          user.name,
          companyName,
          subject,
          from,
          attachments.length,
          type,
        )

        await sendEmail({
          to: "buzzfilings@gmail.com",
          subject: adminEmail.subject,
          html: adminEmail.html,
        }).catch((adminEmailError) => {
          console.log("[v0] Admin email sending failed (non-critical):", adminEmailError)
        })
      }
    } catch (emailError) {
      console.log("[v0] Error in email notification logic:", emailError)
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdMail,
      }),
    )
  } catch (error) {
    console.log("[v0] API Error in POST /api/mail:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create mail" }, { status: 500 }))
  }
}
