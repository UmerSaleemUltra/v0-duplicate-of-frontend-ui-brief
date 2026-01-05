import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "admin" && decoded.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { db } = await connectDB()

    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User fetched:", user.email)

    const response = NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
        accountStatus: user.accountStatus || "active",
        emailVerified: user.emailVerified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
    addSecurityHeaders(response)
    return response
  } catch (error: any) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "admin" && decoded.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { name, phone, email, password, accountStatus } = body

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const { db } = await connectDB()
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }

    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (email) updateData.email = email

    if (accountStatus && decoded.role === "admin") {
      updateData.accountStatus = accountStatus
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const result = await db
      .collection("users")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User updated:", result.email)

    broadcast("user_updated", {
      id: result._id.toString(),
      email: result.email,
      name: result.name,
      accountStatus: result.accountStatus,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        id: result._id.toString(),
        email: result.email,
        name: result.name,
        phone: result.phone,
        role: result.role,
        accountStatus: result.accountStatus,
      },
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { db } = await connectDB()
    const userId = new ObjectId(id)
    const userIdString = id

    console.log("[v0] Deleting user and all related data:", id)

    await Promise.all([
      db.collection("companies").deleteMany({ userId: userIdString }),
      db.collection("orders").deleteMany({ userId: userIdString }),
      db.collection("passports").deleteMany({ userId: userIdString }),
      db.collection("notifications").deleteMany({ userId: userIdString }),
      db.collection("documents").deleteMany({ userId: userIdString }),
    ])

    const result = await db.collection("users").deleteOne({ _id: userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User deleted successfully")

    broadcast("user_deleted", { id })

    const response = NextResponse.json({
      success: true,
      message: "User and all associated data deleted successfully",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
