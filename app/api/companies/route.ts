import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const { db } = await connectDB()

    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get("userId")

    let query: any = decoded.role === "admin" ? {} : { userId: decoded.userId }

    // If userId is provided in query, filter by it (admin only)
    if (userIdParam && decoded.role === "admin") {
      query = { userId: userIdParam }
    }

    const companies = await db
      .collection("companies")
      .find(query)
      .project({
        userId: 1,
        name: 1,
        type: 1,
        state: 1,
        status: 1,
        ein: 1,
        itin: 1,
        businessId: 1,
        formationDate: 1,
        purchasedAddons: 1,
        transactionReference: 1,
        orders: 1, // Include embedded orders array
        revenue: 1, // Include total revenue
        lastOrderDate: 1, // Include last order date
        milestones: 1, // Include milestones
        customMilestones: 1, // Include custom milestones
        registeredAgent: 1, // Include registered agent
        mailingAddress: 1, // Include mailing address
        address: 1, // Include company address
        members: 1, // Include members
        businessCategory: 1,
        businessDescription: 1,
        businessWebsite: 1,
        packageType: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .limit(200)
      .toArray()

    console.log(`[v0] GET /api/companies - Found ${companies.length} companies`)
    console.log(
      `[v0] Sample company data:`,
      companies[0]
        ? {
            id: companies[0]._id.toString(),
            name: companies[0].name,
            ordersCount: companies[0].orders?.length || 0,
            revenue: companies[0].revenue || 0,
            hasMilestones: !!companies[0].milestones,
          }
        : "No companies",
    )

    const result = {
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
        formationDate: company.formationDate,
        purchasedAddons: company.purchasedAddons || [],
        transactionReference: company.transactionReference || null,
        orders: company.orders || [], // Include orders array
        revenue: company.revenue || 0, // Include revenue
        lastOrderDate: company.lastOrderDate || null, // Include last order date
        milestones: company.milestones || {}, // Include milestones
        customMilestones: company.customMilestones || [], // Include custom milestones
        registeredAgent: company.registeredAgent || null,
        mailingAddress: company.mailingAddress || null,
        address: company.address || {},
        members: company.members || [],
        businessCategory: company.businessCategory || "",
        businessDescription: company.businessDescription || "",
        businessWebsite: company.businessWebsite || "",
        packageType: company.packageType || "basic",
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    console.error("[v0] GET /api/companies error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 }))
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const body = await req.json()

    const {
      name,
      type,
      state,
      address,
      members,
      status,
      businessCategory,
      businessDescription,
      businessWebsite,
      packageType,
      milestones,
      purchasedAddons,
      transactionReference,
      orderData,
    } = body

    if (!name || !type || !state) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Missing required fields: name, type, or state" }, { status: 400 }),
      )
    }

    if (name.length < 3 || name.length > 200) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Company name must be between 3 and 200 characters" }, { status: 400 }),
      )
    }

    const { db } = await connectDB()

    const existingCompaniesCount = await db.collection("companies").countDocuments({ userId: decoded.userId })
    const isFirstCompany = existingCompaniesCount === 0

    const processedMembers = Array.isArray(members)
      ? members.map((member) => ({
          ...member,
          passportUrl: member.passportUrl || null,
        }))
      : []

    const initialOrders = orderData
      ? [
          {
            id: new ObjectId().toString(),
            orderType: orderData.orderType || `${type} Formation`,
            packageType: orderData.packageType || packageType || "basic",
            state: state,
            status: orderData.status || "pending",
            pricing: {
              packagePrice: orderData.packagePrice || 0,
              stateFilingFee: orderData.stateFilingFee || 0,
              addonsTotal: orderData.addonsTotal || 0,
              subtotal: orderData.subtotal || 0,
              total: orderData.total || 0,
            },
            selectedAddons: orderData.selectedAddons || purchasedAddons || [],
            paymentInfo: {
              method: orderData.paymentMethod || "stripe",
              status: orderData.paymentStatus || "pending",
              whatsappPhone: orderData.whatsappPhone || null,
              receiptUrl: orderData.receiptUrl || null,
              transactionId: orderData.transactionId || transactionReference || null,
              date: new Date().toISOString(),
            },
            passportDocuments: orderData.passportDocuments || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      : []

    const totalRevenue = initialOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0)

    const newCompany = {
      userId: decoded.userId,
      name,
      type,
      state,
      status: status || "pending",
      address: address || {},
      businessCategory: businessCategory || "",
      businessDescription: businessDescription || "",
      businessWebsite: businessWebsite || "",
      packageType: packageType || "basic",
      transactionReference: transactionReference || null,
      members: processedMembers,
      milestones: milestones || {
        orderProcessed: false,
        registeredAgentAssigned: false,
        mailingAddressIssued: false,
        formationCompleted: false,
        einProcessed: false,
        boiReportFiled: false,
      },
      customMilestones: [],
      purchasedAddons: Array.isArray(purchasedAddons) ? purchasedAddons : [],
      orders: initialOrders,
      revenue: totalRevenue,
      lastOrderDate: initialOrders.length > 0 ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("companies").insertOne(newCompany)
    const companyId = result.insertedId.toString()

    const createdCompany = { id: companyId, ...newCompany }

    broadcastUpdate("companies", "created", createdCompany)

    try {
      await db.collection("passports").updateMany(
        { userId: "checkout-pending" },
        {
          $set: {
            userId: decoded.userId,
            companyId: companyId,
            updatedAt: new Date().toISOString(),
          },
        },
      )
    } catch (passportError) {}

    if (isFirstCompany) {
      try {
        await db.collection("notifications").insertOne({
          userId: decoded.userId,
          companyId: companyId,
          type: "system",
          title: "Welcome to BuzzFiling!",
          message: `Welcome! Your company "${name}" has been successfully created. We're excited to help you form your U.S. ${type.toUpperCase()}.`,
          read: false,
          metadata: {
            companyId: companyId,
            companyName: name,
          },
          createdAt: new Date().toISOString(),
        })

        broadcastUpdate("notifications", "created", { userId: decoded.userId })
      } catch (notificationError) {}
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdCompany,
      }),
    )
  } catch (error: any) {
    return addSecurityHeaders(
      NextResponse.json(
        {
          error: "Failed to create company",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 },
      ),
    )
  }
}
