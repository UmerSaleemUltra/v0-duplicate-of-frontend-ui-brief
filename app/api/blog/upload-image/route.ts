import { type NextRequest, NextResponse } from "next/server"
import { blobStorage, validateFileType, validateFileSize, FILE_TYPES, MAX_FILE_SIZE } from "@/config/storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!validateFileType(file, FILE_TYPES.IMAGES)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      )
    }

    if (!validateFileSize(file, MAX_FILE_SIZE.IMAGE)) {
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    const result = await blobStorage.upload(file, {
      folder: "blog",
      filename: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      access: "public",
    })

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        filename: file.name,
        size: file.size,
      },
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 },
    )
  }
}
