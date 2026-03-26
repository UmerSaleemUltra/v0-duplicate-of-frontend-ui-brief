import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"
import { redisCache } from "@/lib/redis-cache"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate cache key - admin only
    const cacheKey = 'users:admin:all'
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Users list served from cache')
      return addSecurityHeaders(NextResponse.json(cachedData))
    }

    const { db } = await connectDB()
    const { searchParams } = new URL(req.url)
    const includeCompanies = searchParams.get("includeCompanies") === "true"

    const users = await db
      .collection("users")
      .find({})
      .project({
        email: 1,
        name: 1,
        phone: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(1000) // Increased limit for larger customer bases
      .toArray()

    let result: any = {
      success: true,
      data: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    }

    // If includeCompanies is requested, fetch associated companies for each user
    if (includeCompanies) {
      const companies = await db
        .collection("companies")
        .find({})
        .project({
          userId: 1,
          name: 1,
        })
        .toArray()

      // Create a map of userId -> companies for efficient lookup
      const companiesByUserId = new Map<string, string[]>()
      companies.forEach((company) => {
        const userId = company.userId.toString()
        if (!companiesByUserId.has(userId)) {
          companiesByUserId.set(userId, [])
        }
        companiesByUserId.get(userId)!.push(company.name)
      })

      // Enrich user data with company names
      result.data = result.data.map((user: any) => ({
        ...user,
        companyNames: companiesByUserId.get(user.id) || [],
      }))
    }

    // Cache for 10 minutes
    await redisCache.set(cacheKey, result, 600)

    const response = NextResponse.json(result)
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, phone, password, role, isCheckout } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!isCheckout) {
      const authHeader = req.headers.get("authorization")
      const token = authHeader?.replace("Bearer ", "")

      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const decoded = verifyToken(token)
      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { db } = await connectDB()

    const existingUser = await db
      .collection("users")
      .findOne({ email }, { projection: { _id: 1, email: 1, name: 1, phone: 1, role: 1 } })

    if (existingUser) {
      if (isCheckout) {
        return NextResponse.json({
          success: true,
          userExists: true,
          data: {
            id: existingUser._id.toString(),
            email: existingUser.email,
            name: existingUser.name,
            phone: existingUser.phone,
            role: existingUser.role,
          },
        })
      }
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      email,
      name,
      phone: phone || null,
      password: hashedPassword,
      plainPassword: password,
      role: role || "client",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("users").insertOne(newUser)

    console.log("[v0] User created:", result.insertedId.toString())

    broadcast("user_created", {
      id: result.insertedId.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    })

    const response = NextResponse.json({
      success: true,
      userExists: false,
      data: {
        id: result.insertedId.toString(),
        _id: result.insertedId.toString(),
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
      },
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
