import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { redisCache } from "@/lib/redis-cache"

export async function GET(request: NextRequest) {
  try {
    // Generate cache key
    const cacheKey = 'blog:stats:all'
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Blog stats served from cache')
      return NextResponse.json(cachedData)
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const [totalPosts, publishedPosts, draftPosts, categories] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "published" }),
      collection.countDocuments({ status: "draft" }),
      collection.distinct("category"),
    ])

    const result = {
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        categoriesCount: categories.length,
      },
    }

    // Cache for 24 hours
    await redisCache.set(cacheKey, result, 86400)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching blog stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch blog stats" }, { status: 500 })
  }
}
