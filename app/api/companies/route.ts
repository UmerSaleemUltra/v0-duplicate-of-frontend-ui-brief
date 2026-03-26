import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import { ObjectId } from "mongodb"
import { sendEmail, emailTemplates } from "@/config/email"
import { redisCache } from "@/lib/redis-cache"

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

    // Generate cache key
    const cacheKey = `companies:${decoded.role}:${decoded.userId}:${userIdParam || 'all'}`
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Companies data served from cache')
      return addSecurityHeaders(NextResponse.json(cachedData))
    }

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
        companyStatus: 1,
        registeredAgentStatus: 1,
        businessAddressStatus: 1,
        serviceStatus: 1,
        ein: 1,
        itin: 1,
        businessId: 1,
        formationDate: 1,
        purchasedAddons: 1,
        orders: 1, // Include embedded orders array
        revenue: 1, // Include total revenue
        lastOrderDate: 1, // Include last order date
        milestones: 1, // Include milestones
        customMilestones: 1, // Include custom milestones
        registeredAgent: 1, // Include registered agent
        mailingAddress: 1, // Include mailing address
        members: 1, // Include members
        businessCategory: 1,
        businessDescription: 1,
        businessWebsite: 1,
        packageType: 1,
        taxClassification: 1,
        annualReportFilingDate: 1,
        irsFilingDate: 1,
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
      data: companies.map((company) => {
        // Use the stored revenue value — it is authoritative and maintained by all
        // write paths (order create/update/delete). Do NOT recalculate here from
        // partial data (e.g. first order only) as that would silently overwrite
        // correct multi-order revenue with a wrong value.
        const revenue = company.revenue ?? 0

        return {
          id: company._id.toString(),
          userId: company.userId,
          name: company.name,
          type: company.type,
          state: company.state,
          status: company.status,
          companyStatus: company.companyStatus || "pending",
          registeredAgentStatus: company.registeredAgentStatus || "pending",
          businessAddressStatus: company.businessAddressStatus || "pending",
          serviceStatus: company.serviceStatus || "pending",
          ein: company.ein,
          itin: company.itin,
          businessId: company.businessId,
          formationDate: company.formationDate,
          purchasedAddons: company.purchasedAddons || [],
          orders: company.orders || [],
          revenue: revenue,
          lastOrderDate: company.lastOrderDate || null, // Include last order date
          milestones: company.milestones || {}, // Include milestones
          customMilestones: company.customMilestones || [], // Include custom milestones
          registeredAgent: company.registeredAgent || null,
          mailingAddress: company.mailingAddress || null,
          members: company.members || [],
          businessCategory: company.businessCategory || "",
          businessDescription: company.businessDescription || "",
          businessWebsite: company.businessWebsite || "",
          packageType: company.packageType || "basic",
          taxClassification: company.taxClassification || "Not Yet",
          annualReportFilingDate: company.annualReportFilingDate || null,
          irsFilingDate: company.irsFilingDate || null,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        }
      }),
    }

    // Cache the result for 5 minutes (300 seconds)
    await redisCache.set(cacheKey, result, 300)

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60")
    return addSecurityHeaders(response)
  } catch (error) {
    console.error("[v0] GET /api/companies error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 }))
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    console.log("[v0] POST /api/companies - Auth header present:", !!authHeader)
    console.log("[v0] POST /api/companies - Token extracted:", !!token)

    if (!token || token.trim() === "") {
      console.log("[v0] POST /api/companies - REJECTED: No token provided")
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: "Unauthorized",
            message: "Authentication token is required to create a company",
          },
          { status: 401 },
        ),
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log("[v0] POST /api/companies - REJECTED: Invalid or expired token")
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: "Invalid token",
            message: "Your session has expired or the authentication token is invalid",
          },
          { status: 401 },
        ),
      )
    }

    console.log("[v0] POST /api/companies - Authenticated user:", decoded.userId, "Role:", decoded.role)

    const body = await req.json()

    const {
      name,
      type,
      state,
    members,
      status,
      businessCategory,
      businessDescription,
      businessWebsite,
      packageType,
      milestones,
      purchasedAddons,
      orderData,
      companyStatus,
      registeredAgentStatus,
      businessAddressStatus,
      serviceStatus,
      taxClassification,
      annualReportFilingDate,
      irsFilingDate,
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
      ? members.map((member) => {
          const { dateOfBirth, Ssn, firstName, middleName, lastName, email, phone, ...safeMember } = member
          return {
            ...safeMember,
            passportUrl: member.passportUrl || null,
          }
        })
      : []

    const initialOrders = orderData
      ? [
          {
            id: new ObjectId().toString(),
            userId: decoded.userId, // Force use of authenticated user ID
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
      userId: decoded.userId, // Always use authenticated user ID
      name,
      type,
      state,
      status: status || "pending",
      companyStatus: companyStatus || "active", // Changed from "pending" to "active"
      registeredAgentStatus: registeredAgentStatus || "pending",
      businessAddressStatus: businessAddressStatus || "pending",
      serviceStatus: serviceStatus || "pending", // Explicitly set to "pending"
      businessCategory: businessCategory || "",
      businessDescription: businessDescription || "",
      businessWebsite: businessWebsite || "",
      packageType: packageType || "basic",
      members: processedMembers,
      milestones: milestones || {
        orderSuccessfullyProcessed: false,
        registeredAgentAssigned: false,
        businessMailingAddressIssued: false,
        companyFormationCompleted: false,
        einApplicationSubmitted: false,
        einObtained: false,
      },
      customMilestones: [],
      purchasedAddons: Array.isArray(purchasedAddons) ? purchasedAddons : [],
      orders: initialOrders,
      revenue: totalRevenue,
      lastOrderDate: initialOrders.length > 0 ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // added tax fields to new company object
      taxClassification: taxClassification || "Not Yet",
      annualReportFilingDate: annualReportFilingDate || null,
      irsFilingDate: irsFilingDate || null,
    }

    const result = await db.collection("companies").insertOne(newCompany)
    const companyId = result.insertedId.toString()

    const createdCompany = { id: companyId, ...newCompany }

    console.log("[v0] POST /api/companies - Company created successfully:", companyId, "for user:", decoded.userId)

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
        // Create welcome notification (email already sent during signup)
        await db.collection("notifications").insertOne({
          userId: decoded.userId,
          companyId: companyId,
          type: "system",
          title: "Welcome to Buzz Filing!",
          message: `Congratulations! Your account has been created and your company "${name}" setup has started. Check your dashboard for details.`,
          read: false,
          metadata: {
            companyId: companyId,
            companyName: name,
          },
          createdAt: new Date().toISOString(),
        })

        broadcastUpdate("notifications", "created", { userId: decoded.userId })
      } catch (notificationError) {
        console.error("[v0] Error sending welcome notification:", notificationError)
      }
    }

    if (initialOrders.length > 0) {
      try {
        const order = initialOrders[0]

        // Create order placed notification
        await db.collection("notifications").insertOne({
          userId: decoded.userId,
          companyId: companyId,
          type: "order_placed",
          title: "Order Received!",
          message: `Thank you! Your order to create "${name}" has been received. We'll start processing it shortly.`,
          read: false,
          metadata: {
            companyId: companyId,
            orderId: order.id,
            orderTotal: order.pricing.total,
          },
          createdAt: new Date().toISOString(),
        })

        // Get user email and send order confirmation email
        const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

        if (user && user.email) {
          const emailTemplate = emailTemplates.orderConfirmation(
            user.name || "Valued User",
            name,
            order.orderType,
            `$${order.pricing.total}`,
            order.id,
            name,
          )
          await sendEmail({
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          })
          console.log("[v0] Order confirmation email sent to:", user.email)
        }

        // Send admin notification
        try {
          console.log("[v0] Starting admin email send for new company order:", companyId)
          const adminEmail = process.env.ADMIN_EMAIL || "buzzfilings@gmail.com"
          console.log("[v0] Admin email configured as:", adminEmail)
          
          const adminOrderEmail = emailTemplates.adminNewOrder(
            user?.name || "Customer",
            name,
            order.orderType,
            `$${order.pricing.total}`,
            companyId,
            user?.email || "Unknown",
          )
          console.log("[v0] Admin email template created:", adminOrderEmail.subject)
          
          const adminEmailResult = await sendEmail({
            to: adminEmail,
            subject: adminOrderEmail.subject,
            html: adminOrderEmail.html,
          })
          
          console.log("[v0] Admin notification email result:", adminEmailResult)
          if (!adminEmailResult?.success) {
            console.error("[v0] Admin email failed:", adminEmailResult?.error)
          } else {
            console.log("[v0] Admin email sent successfully to:", adminEmail)
          }
        } catch (adminEmailError) {
          console.error("[v0] Admin notification email exception:", adminEmailError instanceof Error ? adminEmailError.message : String(adminEmailError))
          console.error("[v0] Admin email full error:", adminEmailError)
        }

        broadcastUpdate("notifications", "created", { userId: decoded.userId, companyId })
      } catch (orderError) {
        console.error("[v0] Error sending order notification/email:", orderError)
      }
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdCompany,
      }),
    )
  } catch (error: any) {
    console.error("[v0] POST /api/companies error:", error)
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
