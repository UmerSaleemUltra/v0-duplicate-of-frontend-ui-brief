import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const [totalPosts, publishedPosts, draftPosts, categories] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "published" }),
      collection.countDocuments({ status: "draft" }),
      collection.distinct("category"),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        categoriesCount: categories.length,
      },
    })
  } catch (error) {
    console.error("Error fetching blog stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch blog stats" }, { status: 500 })
  }
}
