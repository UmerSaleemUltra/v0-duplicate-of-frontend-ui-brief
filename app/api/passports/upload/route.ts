import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { blobStorage } from "@/config/storage"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const companyId = formData.get("companyId") as string | null
    const memberId = formData.get("memberId") as string
    const memberName = formData.get("memberName") as string

    if (!file) {
      return NextResponse.json({ error: "Missing passport file" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Validate that userId is a valid ObjectId before constructing one
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    const uploadResult = await blobStorage.upload(file, {
      folder: "passports",
      filename: file.name,
      access: "public",
    })

    const db = await getDatabase()

    const passportData = {
      userId: new ObjectId(userId),
      companyId: companyId && companyId !== "" && companyId !== "null" && ObjectId.isValid(companyId) ? new ObjectId(companyId) : null,
      memberId: memberId || "0",
      memberName: memberName || "Unknown",
      fileName: file.name,
      fileUrl: uploadResult.url,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    }

    const result = await db.collection("passports").insertOne(passportData)

    broadcast("passport_uploaded", {
      id: result.insertedId.toString(),
      userId: passportData.userId.toString(),
      memberName: passportData.memberName,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        userId: passportData.userId.toString(),
        companyId: passportData.companyId?.toString() || null,
        memberId: passportData.memberId,
        memberName: passportData.memberName,
        fileUrl: passportData.fileUrl,
      },
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload passport" }, { status: 500 })
  }
}
