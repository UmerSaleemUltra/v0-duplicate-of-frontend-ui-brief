import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/config/database"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "No post IDs provided" }, { status: 400 })
    }

    // Validate all IDs
    const validIds = ids.filter((id) => ObjectId.isValid(id))
    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: "No valid post IDs provided" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const result = await collection.deleteMany({
      _id: { $in: validIds.map((id) => new ObjectId(id)) },
    })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} post(s) deleted successfully`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("Error bulk deleting posts:", error)
    return NextResponse.json({ success: false, error: "Failed to delete posts" }, { status: 500 })
  }
}
