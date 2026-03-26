import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { redisCache } from "@/lib/redis-cache"

export async function GET(request: NextRequest) {
  try {
    // Generate cache key
    const cacheKey = 'blog:categories:all'
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Blog categories served from cache')
      return NextResponse.json(cachedData)
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const categories = await collection.distinct("category")

    const result = {
      success: true,
      data: categories.filter(Boolean),
    }

    // Cache for 24 hours (86400 seconds)
    await redisCache.set(cacheKey, result, 86400)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}
