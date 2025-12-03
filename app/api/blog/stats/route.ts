import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const [totalPosts, publishedPosts, draftPosts, totalViews, categories] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "published" }),
      collection.countDocuments({ status: "draft" }),
      collection
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$views" },
            },
          },
        ])
        .toArray(),
      collection.distinct("category"),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews: totalViews[0]?.total || 0,
        categoriesCount: categories.length,
      },
    })
  } catch (error) {
    console.error("Error fetching blog stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch blog stats" }, { status: 500 })
  }
}
