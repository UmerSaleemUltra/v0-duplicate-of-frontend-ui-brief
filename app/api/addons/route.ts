import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const decoded = await verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const isAdmin = decoded.role === "admin"

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit

    const { db, ObjectId } = await connectDB()

    let addons

    if (isAdmin) {
      // Admin sees all addons
      addons = await db
        .collection("addons")
        .find({})
        .project({
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          category: 1,
          isActive: 1,
          icon: 1,
          features: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    } else {
      // Regular users only see addons assigned to them
      const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

      if (!user || !user.purchasedAddons || !Array.isArray(user.purchasedAddons) || user.purchasedAddons.length === 0) {
        // User has no purchased addons
        addons = []
      } else {
        // Get the addon IDs from user's purchasedAddons - handle both string and ObjectId
        const addonIds = user.purchasedAddons.map((pa: any) => {
          if (typeof pa.addonId === 'string') {
            return new ObjectId(pa.addonId)
          }
          return pa.addonId // Already an ObjectId
        })

        addons = await db
          .collection("addons")
          .find({ _id: { $in: addonIds }, isActive: true })
          .project({
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            isActive: 1,
            icon: 1,
            features: 1,
            createdAt: 1,
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray()
      }
    }

    const result = {
      success: true,
      data: {
        addons: addons.map((addon) => ({
          ...addon,
          id: addon._id.toString(),
          _id: undefined,
        })),
        pagination: {
          page,
          limit,
          total: addons.length,
        },
      },
    }

    const response = NextResponse.json(result)
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in GET /api/addons:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch addons" }, { status: 500 })
  }
}

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
    const { name, description, price, category, isActive, icon, features, userIds, assignToAll } = body

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, description, price",
        },
        { status: 400 },
      )
    }

    if (typeof name !== "string" || name.length > 200) {
      return NextResponse.json({ success: false, error: "Name must be under 200 characters" }, { status: 400 })
    }

    if (typeof description !== "string" || description.length > 1000) {
      return NextResponse.json({ success: false, error: "Description must be under 1000 characters" }, { status: 400 })
    }

    const { db, ObjectId } = await connectDB()

    const addonData = {
      name,
      description,
      price: Number(price),
      category: category || "other",
      isActive: isActive !== undefined ? isActive : true,
      icon: icon || undefined,
      features: features || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.userId,
    }

    const result = await db.collection("addons").insertOne(addonData)
    const addonId = result.insertedId

    // Assign addon to users if specified
    if (assignToAll) {
      await db.collection("users").updateMany(
        {},
        {
          $addToSet: {
            purchasedAddons: {
              addonId: addonId,
              purchasedAt: new Date(),
              price: addonData.price,
            },
          },
        },
      )
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const validUserIds = userIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id))
      await db.collection("users").updateMany(
        { _id: { $in: validUserIds } },
        {
          $addToSet: {
            purchasedAddons: {
              addonId: addonId,
              purchasedAt: new Date(),
              price: addonData.price,
            },
          },
        },
      )
    }

    broadcast("addon_created", {
      id: addonId.toString(),
      name: addonData.name,
      price: addonData.price,
    })

    const response = NextResponse.json({
      success: true,
      data: { addon: { ...addonData, id: addonId.toString(), _id: undefined } },
      message: "Addon created successfully",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in POST /api/addons:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create addon",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing addon ID" }, { status: 400 })
    }

    const { db } = await connectDB()
    const { ObjectId } = await import("mongodb")

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid addon ID format" }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (updateFields.name !== undefined) updateData.name = updateFields.name
    if (updateFields.description !== undefined) updateData.description = updateFields.description
    if (updateFields.price !== undefined) updateData.price = Number(updateFields.price)
    if (updateFields.category !== undefined) updateData.category = updateFields.category
    if (updateFields.isActive !== undefined) updateData.isActive = updateFields.isActive
    if (updateFields.icon !== undefined) updateData.icon = updateFields.icon
    if (updateFields.features !== undefined) updateData.features = updateFields.features

    const result = await db
      .collection("addons")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return NextResponse.json({ success: false, error: "Addon not found" }, { status: 404 })
    }

    broadcast("addon_updated", {
      id: result._id.toString(),
      name: result.name,
      isActive: result.isActive,
    })

    const response = NextResponse.json({
      success: true,
      data: { addon: { ...result, id: result._id.toString(), _id: undefined } },
      message: "Addon updated successfully",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in PUT /api/addons:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update addon",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader.replace("Bearer ", ""))
    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing addon ID" }, { status: 400 })
    }

    const { db } = await connectDB()
    const { ObjectId } = await import("mongodb")

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid addon ID format" }, { status: 400 })
    }

    const result = await db.collection("addons").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Addon not found" }, { status: 404 })
    }

    broadcast("addon_deleted", { id })

    const response = NextResponse.json({
      success: true,
      message: "Addon deleted successfully",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.log("[v0] API Error in DELETE /api/addons:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete addon",
      },
      { status: 500 },
    )
  }
}
