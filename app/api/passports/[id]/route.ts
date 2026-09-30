import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/config/database"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { del } from "@vercel/blob"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { db } = await connectDB()
    const passport = await db.collection("passports").findOne({ _id: new ObjectId(id) })

    if (!passport) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 })
    }

    if (decoded.role !== "admin" && passport.userId !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const response = NextResponse.json({
      success: true,
      data: {
        id: passport._id.toString(),
        ...passport,
      },
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch passport" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { companyId, memberId, memberName } = body

    const { db } = await connectDB()

    const updateData: Record<string, string> = {}
    if (companyId !== undefined) updateData.companyId = companyId
    if (memberId !== undefined) updateData.memberId = memberId
    if (memberName !== undefined) updateData.memberName = memberName

    const result = await db.collection("passports").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 })
    }

    broadcast("passport_updated", { id, ...updateData })

    const response = NextResponse.json({
      success: true,
      message: "Passport updated successfully",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to update passport" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
    const passport = await db.collection("passports").findOne({ _id: new ObjectId(id) })

    if (!passport) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 })
    }

    try {
      await del(passport.fileUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
    } catch (error) {}

    await db.collection("passports").deleteOne({ _id: new ObjectId(id) })

    broadcast("passport_deleted", { id })

    const response = NextResponse.json({
      success: true,
      message: "Passport deleted successfully",
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete passport" }, { status: 500 })
  }
}
