// GET /api/partners/{partnerId}/orders
// Retrieve all orders created by a partner

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PartnerApiKeyManager } from "@/lib/partner-api"

async function verifyPartnerApiKey(authHeader: string): Promise<string | null> {
  const token = authHeader.replace("Bearer ", "")

  if (!PartnerApiKeyManager.validateKeyFormat(token)) {
    return null
  }

  const partner = await db.collection("partners").findOne({
    "apiKeys.key": token,
    status: "active",
  })

  return partner?._id.toString() || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { partnerId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 }
      )
    }

    const requestingPartnerId = await verifyPartnerApiKey(authHeader)
    if (!requestingPartnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Ensure partner can only access their own orders
    if (requestingPartnerId !== params.partnerId) {
      return NextResponse.json(
        { success: false, error: "Cannot access other partner's orders" },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Build query
    const query: any = { partnerId: params.partnerId }
    if (status) {
      query.status = status
    }

    // Fetch orders
    const orders = await db
      .collection("partnerOrders")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection("partnerOrders").countDocuments(query)

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Partner orders fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: 500 }
    )
  }
}
