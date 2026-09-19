import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Admin access required" }, { status: 403 }))
    }

    const body = await req.json()
    const { statusType, statusValue } = body

    // Validate status type and value
    const validStatusTypes = ["companyStatus", "registeredAgentStatus", "businessAddressStatus", "serviceStatus"]
    const validStatusValues = ["pending", "active", "inactive"]

    if (!validStatusTypes.includes(statusType)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid status type" }, { status: 400 }))
    }

    if (!validStatusValues.includes(statusValue)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid status value" }, { status: 400 }))
    }

    const { db } = await connectDB()

    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    // Update the specific status field
    const updateData = {
      [statusType]: statusValue,
      updatedAt: new Date().toISOString(),
    }

    const result = await db
      .collection("companies")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to update status" }, { status: 500 }))
    }

    const updatedCompany = { id: result._id.toString(), ...result }

    broadcastUpdate("companies", "updated", updatedCompany)

    console.log(` Admin updated ${statusType} to ${statusValue} for company:`, company.name)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedCompany,
      }),
    )
  } catch (error) {
    console.error(" Error updating company status:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update status" }, { status: 500 }))
  }
}
