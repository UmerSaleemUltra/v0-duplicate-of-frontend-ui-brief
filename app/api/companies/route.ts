import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

// GET /api/companies - Get all companies (filtered by user for clients)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectDB()
    const query = decoded.role === "admin" ? {} : { userId: decoded.userId }

    const companies = await db.collection("companies").find(query).toArray()

    return NextResponse.json({
      success: true,
      data: companies.map((company) => ({
        id: company._id.toString(),
        userId: company.userId,
        name: company.name,
        type: company.type,
        state: company.state,
        status: company.status,
        ein: company.ein,
        itin: company.itin,
        businessId: company.businessId,
        address: company.address,
        formationDate: company.formationDate,
        registeredAgent: company.registeredAgent,
        milestones: company.milestones,
        customMilestones: company.customMilestones,
        members: company.members,
        purchasedAddons: company.purchasedAddons,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}

// POST /api/companies - Create company
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, state, address, members } = body

    if (!name || !type || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectDB()

    const newCompany = {
      userId: decoded.userId,
      name,
      type,
      state,
      status: "pending",
      address,
      members: members || [],
      milestones: {
        orderProcessed: false,
        registeredAgentAssigned: false,
        mailingAddressIssued: false,
        formationCompleted: false,
        einProcessed: false,
        boiReportFiled: false,
      },
      customMilestones: [],
      purchasedAddons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("companies").insertOne(newCompany)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newCompany,
      },
    })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}
