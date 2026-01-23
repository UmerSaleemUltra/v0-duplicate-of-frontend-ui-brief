import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader.replace("Bearer ", ""))
    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { addonId, userIds, assignToAll } = body

    if (!addonId) {
      return NextResponse.json({ success: false, error: "Missing addon ID" }, { status: 400 })
    }

    const { db } = await connectDB()
    const { ObjectId } = await import("mongodb")

    // Verify addon exists
    const addon = await db.collection("addons").findOne({ _id: new ObjectId(addonId) })
    if (!addon) {
      return NextResponse.json({ success: false, error: "Addon not found" }, { status: 404 })
    }

    let updateResult

    if (assignToAll) {
      // Get all user IDs (excluding admin)
      const allUsers = await db.collection("users").find({ email: { $ne: "admin@buzzfiling.com" } }).project({ _id: 1 }).toArray()
      const allUserIds = allUsers.map((u) => u._id)

      // Update addon with all user IDs (or empty array to indicate assigned to all)
      await db.collection("addons").updateOne(
        { _id: new ObjectId(addonId) },
        { $set: { assignedUserIds: [] } }
      )

      // Assign to all users
      updateResult = await db.collection("users").updateMany(
        { email: { $ne: "admin@buzzfiling.com" } },
        {
          $addToSet: {
            purchasedAddons: {
              addonId: new ObjectId(addonId),
              purchasedAt: new Date(),
              price: addon.price,
            },
          },
        },
      )
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Assign to specific users
      const validUserIds = userIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

      // Update addon with assigned user IDs
      await db.collection("addons").updateOne(
        { _id: new ObjectId(addonId) },
        { $set: { assignedUserIds: validUserIds } }
      )

      // Assign to specific users
      updateResult = await db.collection("users").updateMany(
        { _id: { $in: validUserIds } },
        {
          $addToSet: {
            purchasedAddons: {
              addonId: new ObjectId(addonId),
              purchasedAt: new Date(),
              price: addon.price,
            },
          },
        },
      )
    } else {
      return NextResponse.json({ success: false, error: "Please select users or assign to all" }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      message: `Addon assigned to ${updateResult.modifiedCount} user(s)`,
      data: { modifiedCount: updateResult.modifiedCount },
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in POST /api/addons/assign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to assign addon",
      },
      { status: 500 },
    )
  }
}
