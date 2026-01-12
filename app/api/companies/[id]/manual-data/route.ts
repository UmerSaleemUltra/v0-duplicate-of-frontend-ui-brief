import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const { dataType, data } = body

    if (!dataType || !data) {
      return NextResponse.json({ error: "Missing dataType or data" }, { status: 400 })
    }

    const db = await connectDB()
    const companiesCollection = db.collection("companies")

    let updateFields: any = {}

    if (dataType === "tax") {
      updateFields = {
        formationDate: data.formationDate,
        ein: data.ein,
        businessId: data.businessId,
        taxClassification: data.taxClassification,
        annualReportFilingDate: data.annualReportFilingDate,
        irsFilingDate: data.irsFilingDate,
        itin: data.itin,
      }
    } else if (dataType === "registered-agent") {
      updateFields = {
        registeredAgent: {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          expiryDate: data.expiryDate,
          servicePeriod: data.servicePeriod || "1 Year",
        },
      }
    } else if (dataType === "business-address") {
      updateFields = {
        businessAddress: {
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          expiryDate: data.expiryDate,
        },
      }
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
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Error updating manual data:", error)
    return NextResponse.json({ error: "Failed to update manual data" }, { status: 500 })
  }
}
