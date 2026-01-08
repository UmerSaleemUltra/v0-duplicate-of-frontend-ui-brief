import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] Status update request for company ID:", id)

    if (!id || !ObjectId.isValid(id)) {
      console.error("[v0] Invalid company ID format:", id)
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.error("[v0] No authorization token provided")
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      console.error("[v0] Unauthorized: Not an admin")
      return addSecurityHeaders(NextResponse.json({ error: "Admin access required" }, { status: 403 }))
    }

    const body = await req.json()
    const { statusType, statusValue } = body

    console.log("[v0] Status update request:", { statusType, statusValue })

    // Validate status type and value
    const validStatusTypes = ["companyStatus", "registeredAgentStatus", "businessAddressStatus", "serviceStatus"]
    const validStatusValues = ["pending", "active", "inactive"]

    if (!validStatusTypes.includes(statusType)) {
      console.error("[v0] Invalid status type:", statusType)
      return addSecurityHeaders(
        NextResponse.json(
          { error: `Invalid status type. Must be one of: ${validStatusTypes.join(", ")}` },
          { status: 400 },
        ),
      )
    }

    if (!validStatusValues.includes(statusValue)) {
      console.error("[v0] Invalid status value:", statusValue)
      return addSecurityHeaders(
        NextResponse.json(
          { error: `Invalid status value. Must be one of: ${validStatusValues.join(", ")}` },
          { status: 400 },
        ),
      )
    }

    const { db } = await connectDB()

    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) })

    if (!company) {
      console.error("[v0] Company not found:", id)
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    console.log("[v0] Found company:", company.name)

    // Update the specific status field
    const updateData = {
      [statusType]: statusValue,
      updatedAt: new Date().toISOString(),
    }

    const result = await db
      .collection("companies")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      console.error("[v0] Failed to update status")
      return addSecurityHeaders(NextResponse.json({ error: "Failed to update status" }, { status: 500 }))
    }

    const updatedCompany = { id: result._id.toString(), ...result }

    console.log("[v0] Successfully updated status:", { statusType, statusValue })

    broadcastUpdate("companies", "updated", updatedCompany)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedCompany,
      }),
    )
  } catch (error) {
    console.error("[v0] Error updating company status:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update status" }, { status: 500 }))
  }
}
