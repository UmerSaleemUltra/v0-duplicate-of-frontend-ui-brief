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

    const { db } = await connectDB()

    const filter = isAdmin ? {} : { isActive: true }

    const addons = await db
      .collection("addons")
      .find(filter)
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
          total: await db.collection("addons").countDocuments(filter),
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
    const { name, description, price, category, isActive, icon, features } = body

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

    const { db } = await connectDB()

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
    const addonId = result.insertedId.toString()

    broadcast("addon_created", {
      id: addonId,
      name: addonData.name,
      price: addonData.price,
    })

    const response = NextResponse.json({
      success: true,
      data: { addon: { ...addonData, id: addonId, _id: undefined } },
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
