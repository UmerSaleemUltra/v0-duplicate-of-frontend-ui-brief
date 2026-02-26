import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { blobStorage } from "@/config/storage"
import { sendAdminEmail, emailTemplates } from "@/config/email"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

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

    const { db } = await connectDB()
    const query: any = {}

    if (decoded.role === "client") {
      query.userId = decoded.userId
      if (companyId) query.companyId = companyId
    } else if (companyId) {
      query.companyId = companyId
    }

    const documents = await db.collection("documents").find(query).sort({ createdAt: -1 }).limit(100).toArray()

    const result = {
      success: true,
      data: documents.map((doc) => ({
        id: doc._id.toString(),
        userId: doc.userId,
        companyId: doc.companyId,
        title: doc.title,
        name: doc.name,
        type: doc.type,
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileUrls: doc.fileUrls,
        fileSize: doc.fileSize,
        fileCount: doc.fileCount,
        mimeType: doc.mimeType,
        uploadedBy: doc.uploadedBy,
        uploadedByName: doc.uploadedByName,
        status: doc.status,
        createdAt: doc.createdAt,
        uploadedAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 }))
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
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    const userId = formData.get("userId") as string
    const companyId = formData.get("companyId") as string
    const title = formData.get("title") as string
    const type = formData.get("type") as string
    const category = formData.get("category") as string

    if (files.length === 0 || !companyId) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    const maxFileSize = 200 * 1024 * 1024
    for (const file of files) {
      if (file.size > maxFileSize) {
        return addSecurityHeaders(NextResponse.json({ error: `File ${file.name} exceeds 200MB limit` }, { status: 400 }))
      }
    }

    const uploadPromises = files.map((file) =>
      blobStorage
        .upload(file, {
          folder: "documents",
          filename: file.name,
          access: "public",
        })
        .then((uploadResult) => ({
          url: uploadResult.url,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        })),
    )

    const fileUrls = await Promise.all(uploadPromises)
    const totalSize = fileUrls.reduce((sum, file) => sum + file.size, 0)

    const { db } = await connectDB()

    const newDocument = {
      userId: userId || decoded.userId,
      companyId,
      title: title || files[0].name,
      fileName: files.length > 1 ? `${files.length} files` : files[0].name,
      name: title || files[0].name,
      type: type || "other",
      documentType: type || "other",
      category: category || "general",
      fileUrls: fileUrls,
      fileUrl: fileUrls[0].url,
      fileSize: totalSize,
      mimeType: files[0].type,
      fileCount: files.length,
      uploadedBy: decoded.role,
      uploadedByName: decoded.name || decoded.email,
      status: "available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("documents").insertOne(newDocument)
    const documentId = result.insertedId.toString()

    const createdDocument = { id: documentId, ...newDocument }

    broadcastUpdate("documents", "created", createdDocument)

    try {
      const targetUserId = userId || decoded.userId
      const company = await db
        .collection("companies")
        .findOne({ _id: new ObjectId(companyId) }, { projection: { name: 1 } })

      const uploaderName = decoded.name || decoded.email || "Unknown"
      const fileList = fileUrls.map((f) => f.name).join(", ")
      const documentTitle =
        files.length > 1
          ? `${title || "Documents"} (${files.length} files: ${fileList})`
          : title || files[0].name

      const documentEmail = emailTemplates.documentUploaded(
        uploaderName,
        documentTitle,
        company?.name || companyId,
      )

      await sendAdminEmail({
        subject: documentEmail.subject,
        html: documentEmail.html,
      }).catch((emailError) => {
        console.error("Admin email sending failed (non-critical):", emailError)
      })
    } catch (emailError) {
      console.error("Error in email notification logic:", emailError)
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdDocument,
      }),
    )
  } catch (error) {
    console.log("[v0] API Error in POST /api/documents:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to upload document" }, { status: 500 }))
  }
}
