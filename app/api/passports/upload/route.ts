import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { verifyToken } from "@/config/jwt"
import { blobStorage } from "@/config/storage"

// POST /api/passports/upload - Upload passport file
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
    const memberName = formData.get("memberName") as string

    if (!file) {
      return NextResponse.json({ error: "Missing passport file" }, { status: 400 })
    }

    const uploadResult = await blobStorage.upload(file, {
      folder: "passports",
      filename: file.name,
      access: "public",
    })

    const db = await getDatabase()

    const passportData = {
      userId: userId || decoded.userId,
      memberName,
      fileName: file.name,
      fileUrl: uploadResult.url,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    }

    const result = await db.collection("passports").insertOne(passportData)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...passportData,
      },
    })
  } catch (error) {
    console.error("Error uploading passport:", error)
    return NextResponse.json({ error: "Failed to upload passport" }, { status: 500 })
  }
}
