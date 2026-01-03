import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Receipt upload API called")

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN is not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Blob storage is not configured. Please add BLOB_READ_WRITE_TOKEN to environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("receipt") as File
    const orderId = formData.get("orderId") as string

    console.log("[v0] Receipt upload - orderId:", orderId, "file:", file?.name)

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only image files (JPEG, PNG, WEBP) are allowed" },
        { status: 400 },
      )
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size must be less than 5MB" }, { status: 400 })
    }

    const pathname = `payment-receipts/${orderId}/receipt-${Date.now()}.${file.name.split(".").pop()}`

    console.log("[v0] Uploading to blob storage:", pathname)

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      token: token,
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
      },
    })
  } catch (error: any) {
    console.error("[v0] Payment receipt upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to upload payment receipt",
      },
      { status: 500 },
    )
  }
}
