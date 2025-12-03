import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Blog image upload API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    console.log("[v0] File received:", file ? file.name : "no file")

    if (!file) {
      console.log("[v0] No file in formData")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `blog/${timestamp}-${sanitizedName}`

    console.log("[v0] Uploading to blob storage:", filename)

    const blob = await put(filename, file, {
      access: "public",
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        filename: file.name,
        size: file.size,
      },
    })
  } catch (error) {
    console.error("[v0] Error uploading image:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 },
    )
  }
}
