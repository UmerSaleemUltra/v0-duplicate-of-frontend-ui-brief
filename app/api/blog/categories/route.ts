import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const categories = await collection.distinct("category")

    return NextResponse.json({
      success: true,
      data: categories.filter(Boolean),
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}
