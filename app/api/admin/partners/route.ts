// Admin API for partner management

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PartnerApiKeyManager, PartnerSessionManager } from "@/lib/partner-api"
import type { Partner } from "@/lib/types/partner"

// Verify admin authorization (implement based on your auth system)
async function verifyAdmin(authHeader: string): Promise<boolean> {
  // TODO: Implement admin verification
  // For now, just check if token exists
  return !!authHeader
}

// GET /api/admin/partners - Get all partners
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !(await verifyAdmin(authHeader))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const partners = await db
      .collection("partners")
      .find({})
      .project({
        webhookSecret: 0, // Don't expose secret
        "apiKeys.secret": 0,
      })
      .toArray()

    return NextResponse.json({
      success: true,
      data: partners,
    })
  } catch (error) {
    console.error("[v0] Get partners error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch partners" },
      { status: 500 }
    )
  }
}

// POST /api/admin/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !(await verifyAdmin(authHeader))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, domain } = body

    if (!name || !domain) {
      return NextResponse.json(
        { success: false, error: "Missing name or domain" },
        { status: 400 }
      )
    }

    // Check if partner already exists
    const existing = await db.collection("partners").findOne({ domain })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Partner with this domain already exists" },
        { status: 400 }
      )
    }

    // Create partner
    const partner: Partial<Partner> = {
      name,
      domain,
      status: "active",
      branding: {
        companyName: name,
      },
      apiKeys: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("partners").insertOne(partner as any)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...partner,
      },
    })
  } catch (error) {
    console.error("[v0] Create partner error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create partner" },
      { status: 500 }
    )
  }
}
