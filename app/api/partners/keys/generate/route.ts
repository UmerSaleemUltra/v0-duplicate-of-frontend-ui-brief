// POST /api/partners/keys/generate
// Generate new API keys for a partner (admin only)

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PartnerApiKeyManager } from "@/lib/partner-api"

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization (implement your admin check)
    const adminToken = request.headers.get("Authorization")
    if (!adminToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Add admin verification logic
    // For now, we'll assume auth is verified

    const body = await request.json()
    const { partnerId, keyName } = body

    if (!partnerId || !keyName) {
      return NextResponse.json(
        { success: false, error: "Missing partnerId or keyName" },
        { status: 400 }
      )
    }

    // Generate new key pair
    const { key, secret } = PartnerApiKeyManager.generateKeyPair()

    const newApiKey = {
      id: `key_${Date.now()}`,
      key,
      secret,
      name: keyName,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revokedAt: null,
    }

    // Add key to partner
    const result = await db
      .collection("partners")
      .updateOne({ _id: partnerId }, { $push: { apiKeys: newApiKey } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newApiKey.id,
        key: newApiKey.key,
        secret: newApiKey.secret, // Only show secret once
        name: newApiKey.name,
        createdAt: newApiKey.createdAt,
      },
    })
  } catch (error) {
    console.error("[v0] Generate API key error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate API key",
      },
      { status: 500 }
    )
  }
}
