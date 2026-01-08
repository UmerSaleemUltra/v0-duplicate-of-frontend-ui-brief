import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] Manual data update request for company ID:", id)

    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      console.error("[v0] No authorization token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      console.error("[v0] Unauthorized: Not an admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const { dataType, data } = body

    console.log("[v0] Manual data update:", { dataType, dataKeys: Object.keys(data || {}) })

    if (!dataType || !data) {
      return NextResponse.json({ error: "Missing dataType or data" }, { status: 400 })
    }

    const db = await connectDB()
    const companiesCollection = db.collection("companies")

    let updateFields: any = {}

    if (dataType === "tax") {
      updateFields = {
        formationDate: data.formationDate || null,
        ein: data.ein || null,
        businessId: data.businessId || null,
        taxClassification: data.taxClassification || null,
        annualReportFilingDate: data.annualReportFilingDate || null,
        irsFilingDate: data.irsFilingDate || null,
      }
      console.log("[v0] Updating tax fields:", updateFields)
    } else if (dataType === "registered-agent") {
      updateFields = {
        registeredAgent: {
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          expiryDate: data.expiryDate || null,
          servicePeriod: data.servicePeriod || "1 Year",
        },
      }
      console.log("[v0] Updating registered agent:", updateFields.registeredAgent)
    } else if (dataType === "business-address") {
      updateFields = {
        businessAddress: {
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          expiryDate: data.expiryDate || null,
        },
      }
      console.log("[v0] Updating business address:", updateFields.businessAddress)
    } else {
      return NextResponse.json({ error: "Invalid dataType" }, { status: 400 })
    }

    // Remove undefined values
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === undefined) {
        delete updateFields[key]
      }
    })

    const result = await companiesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updateFields, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    )

    if (!result) {
      console.error("[v0] Company not found:", id)
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    console.log("[v0] Manual data updated successfully for company:", result.name)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Error updating manual data:", error)
    return NextResponse.json({ error: "Failed to update manual data" }, { status: 500 })
  }
}
