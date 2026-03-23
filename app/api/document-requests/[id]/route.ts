import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { blobStorage } from "@/config/storage"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

// GET /api/document-requests/[id] — get single request
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const decoded = verifyToken(token)
    if (!decoded) return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))

    const { db } = await connectDB()
    const request = await db.collection("document_requests").findOne({ _id: new ObjectId(id) })

    if (!request) return addSecurityHeaders(NextResponse.json({ error: "Not found" }, { status: 404 }))

    // Client can only see their own
    if (decoded.role === "client" && request.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: {
          id: request._id.toString(),
          ...request,
          _id: undefined,
        },
      }),
    )
  } catch {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch document request" }, { status: 500 }))
  }
}

// PATCH /api/document-requests/[id] — update request (client submits doc, admin updates status/notes)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const decoded = verifyToken(token)
    if (!decoded) return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))

    const { db } = await connectDB()
    const existing = await db.collection("document_requests").findOne({ _id: new ObjectId(id) })
    if (!existing) return addSecurityHeaders(NextResponse.json({ error: "Not found" }, { status: 404 }))

    // Clients can only update their own
    if (decoded.role === "client" && existing.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const contentType = req.headers.get("content-type") || ""

    let patch: any = {}

    if (contentType.includes("multipart/form-data")) {
      // Client uploading a document file
      const formData = await req.formData()
      const file = formData.get("file") as File | null

      if (!file) {
        return addSecurityHeaders(NextResponse.json({ error: "No file provided" }, { status: 400 }))
      }

      const maxSize = 200 * 1024 * 1024
      if (file.size > maxSize) {
        return addSecurityHeaders(NextResponse.json({ error: "File exceeds 200MB limit" }, { status: 400 }))
      }

      // Upload the file to blob storage
      const uploadResult = await blobStorage.upload(file, {
        folder: "document-requests",
        filename: file.name,
        access: "public",
      })

      // Also create a document record in the documents collection
      const newDocument = {
        userId: existing.userId,
        companyId: existing.companyId,
        title: `${existing.documentType.replace(/_/g, " ")} (Requested)`,
        fileName: file.name,
        name: file.name,
        type: existing.documentType,
        documentType: existing.documentType,
        category: "requested",
        fileUrls: [{ url: uploadResult.url, name: file.name, size: file.size, mimeType: file.type }],
        fileUrl: uploadResult.url,
        fileSize: file.size,
        mimeType: file.type,
        fileCount: 1,
        uploadedBy: "client",
        uploadedByName: decoded.name || decoded.email,
        status: "available",
        documentRequestId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docResult = await db.collection("documents").insertOne(newDocument)
      const documentId = docResult.insertedId.toString()

      patch = {
        status: "submitted",
        submittedDocumentId: documentId,
        submittedDocumentUrl: uploadResult.url,
        submittedDocumentName: file.name,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } else {
      // JSON update — admin changing status/notes
      const body = await req.json()

      if (decoded.role === "client") {
        // Clients can only mark as submitted (without file — but we prefer file upload path above)
        patch = { updatedAt: new Date().toISOString() }
      } else {
        // Admin can update status and notes
        const { status, notes } = body
        const VALID_STATUSES = ["pending", "submitted", "approved", "rejected"]
        if (status && !VALID_STATUSES.includes(status)) {
          return addSecurityHeaders(NextResponse.json({ error: "Invalid status" }, { status: 400 }))
        }
        if (status) patch.status = status
        if (notes !== undefined) patch.notes = notes
        patch.updatedAt = new Date().toISOString()
      }
    }

    await db.collection("document_requests").updateOne({ _id: new ObjectId(id) }, { $set: patch })

    const updated = await db.collection("document_requests").findOne({ _id: new ObjectId(id) })
    const result = { id: updated!._id.toString(), ...updated, _id: undefined }

    broadcastUpdate("document_requests", "updated", result)

    return addSecurityHeaders(NextResponse.json({ success: true, data: result }))
  } catch {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update document request" }, { status: 500 }))
  }
}

// DELETE /api/document-requests/[id] — admin only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const { db } = await connectDB()
    await db.collection("document_requests").deleteOne({ _id: new ObjectId(id) })

    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete document request" }, { status: 500 }))
  }
}
