import { type NextRequest, NextResponse } from "next/server"
import { getSecurityThreats } from "@/lib/security/security-db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    const threats = await getSecurityThreats(limit, skip)

    return NextResponse.json({ threats })
  } catch (error) {
    console.error("[SECURITY API] Failed to get threats:", error)
    return NextResponse.json({ error: "Failed to get threats" }, { status: 500 })
  }
}
