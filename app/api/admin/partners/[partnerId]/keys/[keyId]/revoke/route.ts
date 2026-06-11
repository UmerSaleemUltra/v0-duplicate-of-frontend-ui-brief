// POST /api/admin/partners/{partnerId}/keys/{keyId}/revoke
// Revoke a partner's API key

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

async function verifyAdmin(authHeader: string): Promise<boolean> {
  return !!authHeader // Implement based on your auth system
}

export async function POST(
  request: NextRequest,
  { params }: { params: { partnerId: string; keyId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !(await verifyAdmin(authHeader))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const result = await db
      .collection("partners")
      .updateOne(
        { _id: params.partnerId },
        {
          $set: {
            "apiKeys.$[elem].revokedAt": new Date().toISOString(),
          },
        },
        {
          arrayFilters: [{ "elem.id": params.keyId }],
        }
      )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Revoke API key error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to revoke API key" },
      { status: 500 }
    )
  }
}
