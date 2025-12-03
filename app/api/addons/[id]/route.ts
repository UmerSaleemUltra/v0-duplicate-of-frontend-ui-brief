import type { NextRequest } from "next/server"
import { connectDB } from "@/config/database"
import { apiResponse, apiError, requireAuth } from "@/lib/api-middleware"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      console.log("[v0] Invalid addon ID format:", id)
      return apiError("Invalid addon ID format", 400)
    }

    const { db } = await connectDB()
    const addonsCollection = db.collection("addons")

    const addon = await addonsCollection.findOne({ _id: new ObjectId(id) })

    if (!addon) {
      return apiError("Addon not found", 404)
    }

    const response = apiResponse({
      ...addon,
      id: addon._id.toString(),
      _id: undefined,
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in GET /api/addons/[id]:", error)
    return apiError("Failed to get addon", 500)
  }
}

export const PUT = requireAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    if (user.role !== "admin") {
      return apiError("Admin access required", 403)
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      console.log("[v0] Invalid addon ID format:", id)
      return apiError("Invalid addon ID format", 400)
    }

    const body = await request.json()
    const { db } = await connectDB()
    const addonsCollection = db.collection("addons")

    const updateData: Record<string, string | number | boolean> = {
      updatedAt: new Date().toISOString(),
    }

    if (body.name) {
      if (typeof body.name !== "string" || body.name.length > 200) {
        return apiError("Invalid name: must be string under 200 characters", 400)
      }
      updateData.name = body.name
    }
    if (body.description) {
      if (typeof body.description !== "string" || body.description.length > 1000) {
        return apiError("Invalid description: must be string under 1000 characters", 400)
      }
      updateData.description = body.description
    }
    if (body.price !== undefined) updateData.price = Number.parseFloat(body.price)
    if (body.category) updateData.category = body.category
    if (body.processingTime) updateData.processingTime = body.processingTime
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const result = await addonsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!result) {
      return apiError("Addon not found", 404)
    }

    broadcast("addon_updated", {
      id: result._id.toString(),
      ...updateData,
    })

    const response = apiResponse({
      ...result,
      id: result._id.toString(),
      _id: undefined,
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in PUT /api/addons/[id]:", error)
    return apiError("Failed to update addon", 500)
  }
})

export const DELETE = requireAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (user.role !== "admin") {
        return apiError("Admin access required", 403)
      }

      const { id } = await params

      if (!ObjectId.isValid(id)) {
        console.log("[v0] Invalid addon ID format:", id)
        return apiError("Invalid addon ID format", 400)
      }

      const { db } = await connectDB()
      const addonsCollection = db.collection("addons")

      const result = await addonsCollection.deleteOne({ _id: new ObjectId(id) })

      if (result.deletedCount === 0) {
        return apiError("Addon not found", 404)
      }

      broadcast("addon_deleted", { id })

      const response = apiResponse({ message: "Addon deleted successfully" })
      addSecurityHeaders(response)
      return response
    } catch (error) {
      console.log("[v0] API Error in DELETE /api/addons/[id]:", error)
      return apiError("Failed to delete addon", 500)
    }
  },
)
