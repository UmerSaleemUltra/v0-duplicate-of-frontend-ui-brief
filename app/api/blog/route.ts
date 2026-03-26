import { type NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getDatabase } from "@/config/database"
import { redisCache } from "@/lib/redis-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const slug = searchParams.get("slug")
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    // Generate cache key
    const cacheKey = `blog:${status || 'all'}:${slug || 'all'}:${category || 'all'}:${limit}:${skip}`
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Blog posts served from cache')
      return NextResponse.json(cachedData)
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    if (slug) {
      const post = await collection.findOne({ slug })

      const result = {
        success: true,
        data: post ? [post] : [],
      }
      
      await redisCache.set(cacheKey, result, 600) // 10 minutes
      return NextResponse.json(result)
    }

    const query: any = {}
    if (status) {
      query.status = status
    }
    if (category) {
      query.category = category
    }

    const posts = await collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    const total = await collection.countDocuments(query)

    console.log("[v0] Fetched", posts.length, "blog posts")

    const result = {
      success: true,
      data: posts,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    }

    // Cache for 10 minutes
    await redisCache.set(cacheKey, result, 600)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching blog posts:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch blog posts" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, content, excerpt, featuredImage, category, tags, metaTitle, metaDescription, status } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ success: false, error: "Title, slug, and content are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    // Check if slug already exists
    const existingPost = await collection.findOne({ slug })
    if (existingPost) {
      return NextResponse.json({ success: false, error: "A post with this slug already exists" }, { status: 400 })
    }

    const newPost = {
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 160),
      featuredImage: featuredImage || null,
      category: category || "Uncategorized",
      tags: tags || [],
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || content.substring(0, 160),
      status: status || "draft",
      author: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: status === "published" ? new Date() : null,
    }

    const result = await collection.insertOne(newPost)

    // Invalidate blog cache
    await redisCache.invalidatePattern('blog:*')

    // If the post is published immediately, invalidate the sitemap cache
    // so the new URL appears in real-time without waiting for the interval.
    if (newPost.status === "published") {
      revalidateTag("sitemap")
    }

    return NextResponse.json({
      success: true,
      data: { ...newPost, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return NextResponse.json({ success: false, error: "Failed to create blog post" }, { status: 500 })
  }
}
