import { type NextRequest, NextResponse } from "next"
import { blobStorage } from "@/config/storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("receipt") as File
    const orderId = formData.get("orderId") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only image files (JPEG, PNG, WEBP) are allowed" },
        { status: 400 },
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const uploadResult = await blobStorage.upload(file, {
      folder: `payment-receipts/${orderId}`,
      filename: `receipt-${Date.now()}.${file.name.split(".").pop()}`,
      access: "public",
    })

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        pathname: uploadResult.pathname,
      },
    })
  } catch (error) {
    console.error("Payment receipt upload error:", error)
    return NextResponse.json({ success: false, error: "Failed to upload payment receipt" }, { status: 500 })
  }
}
