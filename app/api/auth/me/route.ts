import type { NextRequest } from "next/server"
import { getDatabase } from "@/config/database"
import { apiResponse, apiError, requireAuth } from "@/lib/api-middleware"
import { ObjectId } from "mongodb"

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) }, { projection: { password: 0 } })

    if (!userDoc) {
      return apiError("User not found", 404)
    }

    return apiResponse({ id: userDoc._id.toString(), ...userDoc })
  } catch (error) {
    console.error(" Get user error:", error)
    return apiError("Failed to get user", 500)
  }
})
