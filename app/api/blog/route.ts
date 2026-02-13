import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const slug = searchParams.get("slug")
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    if (slug) {
      const post = await collection.findOne({ slug })

      return NextResponse.json({
        success: true,
        data: post ? [post] : [],
      })
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

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    })
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

    return NextResponse.json({
      success: true,
      data: { ...newPost, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return NextResponse.json({ success: false, error: "Failed to create blog post" }, { status: 500 })
  }
}
