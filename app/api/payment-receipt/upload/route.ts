import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log(" Receipt upload API called")

    const token = "vercel_blob_rw_enipxGoXoWBCpr7X_5w7RhF4GZzv9S4dBcF8lVwfbINaiXm"
    if (!token) {
      console.error(" BLOB_READ_WRITE_TOKEN is not configured")
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

    console.log(" Receipt upload - orderId:", orderId, "file:", file?.name)

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only image files (JPEG, PNG, WEBP) or PDF are allowed" },
        { status: 400 },
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size must be less than 10MB" }, { status: 400 })
    }

    const folder = orderId ? `payment-receipts/${orderId}` : `payment-receipts/pending`
    const pathname = `${folder}/receipt-${Date.now()}.${file.name.split(".").pop()}`

    console.log(" Uploading to blob storage:", pathname)

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      token: token,
    })

    console.log(" Upload successful:", blob.url)

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
      },
    })
  } catch (error: any) {
    console.error(" Payment receipt upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to upload payment receipt",
      },
      { status: 500 },
    )
  }
}
