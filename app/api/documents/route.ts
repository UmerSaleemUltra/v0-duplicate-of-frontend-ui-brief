import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { verifyToken } from "@/config/jwt"
import { blobStorage } from "@/config/storage"

// GET /api/documents - Get all documents (filtered by user for clients)
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

    const documents = await db.collection("documents").find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
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
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedBy: doc.uploadedBy,
        uploadedByName: doc.uploadedByName,
        status: doc.status,
        isMailDocument: doc.isMailDocument,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// POST /api/documents - Upload document
export async function POST(req: NextRequest) {
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

    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const companyId = formData.get("companyId") as string
    const title = formData.get("title") as string
    const type = formData.get("type") as string
    const category = formData.get("category") as string
    const isMailDocument = formData.get("isMailDocument") === "true"

    if (!file || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const uploadResult = await blobStorage.upload(file, {
      folder: "documents",
      filename: file.name,
      access: "public",
    })

    const db = await getDatabase()

    const newDocument = {
      userId: userId || decoded.userId,
      companyId,
      title: title || file.name,
      name: file.name,
      type: type || "other",
      category: category || "general",
      fileUrl: uploadResult.url,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: decoded.role,
      uploadedByName: decoded.name || decoded.email,
      status: "available",
      isMailDocument: isMailDocument || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("documents").insertOne(newDocument)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newDocument,
      },
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
