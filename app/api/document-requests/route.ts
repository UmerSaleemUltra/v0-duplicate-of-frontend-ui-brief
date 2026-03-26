import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import { redisCache } from "@/lib/redis-cache"

// GET /api/document-requests — fetch requests
// Admin: can filter by orderId, companyId, userId
// Client: only sees their own (by userId)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")
    const companyId = searchParams.get("companyId")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    // Generate cache key
    const cacheKey = `doc-requests:${decoded.userId}:${orderId || 'all'}:${companyId || 'all'}:${userId || 'all'}:${status || 'all'}`
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Document requests served from cache')
      return addSecurityHeaders(NextResponse.json(cachedData))
    }

    const { db } = await connectDB()
    const query: any = {}

    if (decoded.role === "client") {
      // Clients only see their own requests
      query.userId = decoded.userId
      if (companyId) query.companyId = companyId
    } else {
      // Admin can filter freely
      if (orderId) query.orderId = orderId
      if (companyId) query.companyId = companyId
      if (userId) query.userId = userId
    }

    if (status) query.status = status

    const requests = await db
      .collection("document_requests")
      .find(query)
      .sort({ requestedAt: -1 })
      .limit(100)
      .toArray()

    const data = requests.map((r) => ({
      id: r._id.toString(),
      orderId: r.orderId,
      companyId: r.companyId,
      userId: r.userId,
      adminId: r.adminId,
      documentType: r.documentType,
      description: r.description,
      status: r.status,
      submittedDocumentId: r.submittedDocumentId ?? null,
      submittedDocumentUrl: r.submittedDocumentUrl ?? null,
      submittedDocumentName: r.submittedDocumentName ?? null,
      requestedAt: r.requestedAt,
      submittedAt: r.submittedAt ?? null,
      notes: r.notes ?? null,
      companyName: r.companyName ?? null,
      customerName: r.customerName ?? null,
      customerEmail: r.customerEmail ?? null,
    }))

    const result = { success: true, data }

    // Cache for 5 minutes
    await redisCache.set(cacheKey, result, 300)

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "private, no-store")
    return addSecurityHeaders(response)
  } catch {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch document requests" }, { status: 500 }))
  }
}

// POST /api/document-requests — admin creates a new request
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 }))
    }

    const body = await req.json()
    const { orderId, companyId, userId, documentType, description, companyName, customerName, customerEmail } = body

    if (!orderId || !companyId || !userId || !documentType) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields: orderId, companyId, userId, documentType" }, { status: 400 }))
    }

    const ALLOWED_TYPES = [
      "government_id",
      "passport",
      "proof_of_address",
      "tax_return",
      "bank_statement",
      "business_license",
      "articles_of_incorporation",
      "operating_agreement",
      "ein_letter",
      "other",
    ]

    if (!ALLOWED_TYPES.includes(documentType)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid document type" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const newRequest = {
      orderId,
      companyId,
      userId,
      adminId: decoded.userId,
      documentType,
      description: description?.trim() || "",
      status: "pending",
      submittedDocumentId: null,
      submittedDocumentUrl: null,
      submittedDocumentName: null,
      requestedAt: new Date().toISOString(),
      submittedAt: null,
      notes: null,
      companyName: companyName || null,
      customerName: customerName || null,
      customerEmail: customerEmail || null,
    }

    const result = await db.collection("document_requests").insertOne(newRequest)
    const created = { id: result.insertedId.toString(), ...newRequest }

    broadcastUpdate("document_requests", "created", created)

    return addSecurityHeaders(NextResponse.json({ success: true, data: created }, { status: 201 }))
  } catch {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create document request" }, { status: 500 }))
  }
}
