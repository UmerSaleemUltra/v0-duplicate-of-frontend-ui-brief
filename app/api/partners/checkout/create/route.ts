// POST /api/partners/checkout/create
// Creates a checkout session for white-label partners

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PartnerApiKeyManager, PartnerSessionManager } from "@/lib/partner-api"
import type { PartnerCheckoutSession } from "@/lib/types/partner"

// Verify partner API key
async function verifyPartnerApiKey(
  authHeader: string
): Promise<{ partnerId: string; error?: string } | null> {
  const token = authHeader.replace("Bearer ", "")

  if (!PartnerApiKeyManager.validateKeyFormat(token)) {
    return { partnerId: "", error: "Invalid API key format" }
  }

  // Find partner with matching API key
  // In production, you'd query your database
  const partner = await db.collection("partners").findOne({
    "apiKeys.key": token,
    status: "active",
  })

  if (!partner) {
    return { partnerId: "", error: "API key not found or partner inactive" }
  }

  return { partnerId: partner._id.toString() }
}

export async function POST(request: NextRequest) {
  try {
    // Verify API key from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 }
      )
    }

    const auth = await verifyPartnerApiKey(authHeader)
    if (auth?.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["businessName", "email", "state", "packageType"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create checkout session
    const sessionId = PartnerSessionManager.generateSessionId()
    const expiresAt = PartnerSessionManager.getExpirationTime()

    const checkoutSession: PartnerCheckoutSession = {
      id: sessionId,
      partnerId: auth.partnerId || "",
      email: body.email,
      businessName: body.businessName,
      phone: body.phone,
      state: body.state,
      packageType: body.packageType,
      addons: body.addons || [],
      redirectUrl: body.redirectUrl || "",
      expiresAt: expiresAt.toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
    }

    // Store session in database
    await db.collection("partnerCheckoutSessions").insertOne(checkoutSession)

    // Store custom data if provided
    if (body.customData) {
      await db.collection("partnerCustomData").insertOne({
        sessionId,
        partnerId: auth.partnerId,
        customData: body.customData,
        createdAt: new Date(),
      })
    }

    // Generate checkout URL with session ID
    const checkoutUrl = new URL("/checkout", process.env.NEXT_PUBLIC_APP_URL || "https://buzzfiling.com")
    checkoutUrl.searchParams.set("session", sessionId)
    checkoutUrl.searchParams.set("partner", auth.partnerId || "")

    return NextResponse.json({
      success: true,
      data: {
        checkoutSessionId: sessionId,
        checkoutUrl: checkoutUrl.toString(),
        expiresIn: 3600,
      },
    })
  } catch (error) {
    console.error("[v0] Partner checkout error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create checkout session",
      },
      { status: 500 }
    )
  }
}
