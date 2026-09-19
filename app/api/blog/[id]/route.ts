import { type NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getDatabase } from "@/config/database"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const post = await collection.findOne({ _id: new ObjectId(id) })

    if (!post) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch blog post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, slug, content, excerpt, featuredImage, category, tags, metaTitle, metaDescription, status } = body

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 })
    }

    if (!title || !slug || !content) {
      return NextResponse.json({ success: false, error: "Title, slug, and content are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    // Check if slug is taken by another post
    if (slug) {
      const existingPost = await collection.findOne({
        slug,
        _id: { $ne: new ObjectId(id) },
      })
      if (existingPost) {
        return NextResponse.json({ success: false, error: "A post with this slug already exists" }, { status: 400 })
      }
    }

    const updateData: any = {
      title,
      slug,
      content,
      excerpt: excerpt || "",
      featuredImage: featuredImage || "",
      category,
      tags: Array.isArray(tags) ? tags : [],
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || "",
      status,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 })
    }

    // Any publish status change (published ↔ draft) affects the sitemap URL list.
    revalidateTag("sitemap")

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error updating blog post:", error)
    return NextResponse.json({ success: false, error: "Failed to update blog post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 })
    }

    // Remove the deleted post's URL from the sitemap immediately.
    revalidateTag("sitemap")

    return NextResponse.json({ success: true, message: "Blog post deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json({ success: false, error: "Failed to delete blog post" }, { status: 500 })
  }
}
