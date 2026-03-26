import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { redisCache } from "@/lib/redis-cache"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const companyId = searchParams.get("companyId")
    const memberId = searchParams.get("memberId")
    const includePending = searchParams.get("includePending") === "true"

    // Generate cache key
    const cacheKey = `passports:${decoded.userId}:${userId || 'all'}:${companyId || 'all'}:${memberId || 'all'}:${includePending}`
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Passports served from cache')
      return addSecurityHeaders(NextResponse.json(cachedData))
    }

    const { db } = await connectDB()

    const query: Record<string, string | Record<string, string[]>> = {}

    if (decoded.role !== "admin") {
      if (includePending) {
        query.$or = [{ userId: decoded.userId }, { userId: "checkout-pending" }]
      } else {
        query.userId = decoded.userId
      }
    } else {
      if (userId) {
        if (userId === "checkout-pending" || includePending) {
          query.$or = [{ userId: userId }, { userId: "checkout-pending" }]
        } else {
          query.userId = userId
        }
      }
      if (companyId) query.companyId = companyId
      if (memberId) query.memberId = memberId
    }

    const passports = await db
      .collection("passports")
      .find(query)
      .project({
        userId: 1,
        companyId: 1,
        memberId: 1,
        memberName: 1,
        fileName: 1,
        fileUrl: 1,
        fileType: 1,
        mimeType: 1,
        fileSize: 1,
        uploadedAt: 1,
      })
      .sort({ uploadedAt: -1 })
      .limit(100)
      .toArray()

    const result = {
      success: true,
      data: passports.map((passport) => ({
        id: passport._id.toString(),
        userId: passport.userId,
        companyId: passport.companyId,
        memberId: passport.memberId,
        memberName: passport.memberName,
        fileName: passport.fileName,
        fileUrl: passport.fileUrl,
        fileType: passport.fileType,
        mimeType: passport.mimeType,
        fileSize: passport.fileSize,
        uploadedAt: passport.uploadedAt,
      })),
    }

    // Cache for 5 minutes
    await redisCache.set(cacheKey, result, 300)

    const response = NextResponse.json(result)
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch passports" }, { status: 500 })
  }
}
