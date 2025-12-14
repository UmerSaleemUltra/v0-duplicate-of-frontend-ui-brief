import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const {
      bankName,
      companyId,
      fullName,
      email,
      phone,
      businessName,
      ein,
      expectedMonthlyRevenue,
      businessDescription,
      fundingSource,
      additionalNotes,
    } = body

    const db = await getDatabase()

    const company = await db.collection("companies").findOne({ _id: new ObjectId(companyId) })

    const application = {
      bankName,
      companyId: new ObjectId(companyId),
      companyName: company?.name || businessName,
      userId: new ObjectId(decoded.userId),
      fullName,
      email,
      phone,
      businessName,
      ein,
      expectedMonthlyRevenue,
      businessDescription,
      fundingSource,
      additionalNotes,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("banking_applications").insertOne(application)

    // Update company banking status
    await db
      .collection("companies")
      .updateOne(
        { _id: new ObjectId(companyId) },
        { $set: { bankingStatus: "in_progress", bankingApplication: { bankName, submittedAt: new Date() } } },
      )

    return NextResponse.json({
      success: true,
      data: { ...application, id: result.insertedId, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating banking application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()

    const applications = await db
      .collection("banking_applications")
      .aggregate([
        {
          $lookup: {
            from: "companies",
            localField: "companyId",
            foreignField: "_id",
            as: "company",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: { path: "$company", preserveNullAndEmptyArrays: true },
        },
        {
          $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            id: { $toString: "$_id" },
            company_name: { $ifNull: ["$companyName", "$company.name"] },
            company_state: "$company.state",
            company_package: "$company.packageType",
            user_name: "$user.name",
            bank_name: "$bankName",
            full_name: "$fullName",
            business_name: "$businessName",
            expected_monthly_revenue: "$expectedMonthlyRevenue",
            business_description: "$businessDescription",
            funding_source: "$fundingSource",
            additional_notes: "$additionalNotes",
            admin_notes: "$adminNotes",
            created_at: "$createdAt",
            updated_at: "$updatedAt",
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json({ success: true, data: applications })
  } catch (error) {
    console.error("Error fetching banking applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
