import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, adminNotes } = body

    const db = await getDatabase()

    const result = await db.collection("banking_applications").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status,
          adminNotes,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Update company banking status if completed
    if (status === "approved") {
      await db
        .collection("companies")
        .updateOne({ _id: new ObjectId(result.companyId) }, { $set: { bankingStatus: "completed" } })
    }

    return NextResponse.json({
      success: true,
      data: { ...result, id: result._id.toString() },
    })
  } catch (error) {
    console.error("Error updating banking application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
