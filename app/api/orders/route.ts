import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { sendEmail, emailTemplates } from "@/config/email"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

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
    const userRole = decoded.role || "client"
    const isAdmin = userRole === "admin"

    // Query companies collection - orders are embedded in each company
    const query = isAdmin ? {} : { userId: decoded.userId }
    console.log("[v0] API Query - isAdmin:", isAdmin, "userId:", decoded.userId, "query:", query)
    
    const companies = await db
      .collection("companies")
      .find(query)
      .limit(100)
      .toArray()

    console.log(`[v0] Found ${companies.length} companies for user`, { isAdmin, userId: decoded.userId })

    // Extract all orders from companies
    const allOrders: any[] = []
    let companiesWithOrders = 0
    let totalOrdersFound = 0
    
    for (const company of companies) {
      if (company.orders && Array.isArray(company.orders)) {
        companiesWithOrders++
        totalOrdersFound += company.orders.length
        for (const order of company.orders) {
          allOrders.push({
            id: order.id,
            userId: order.userId || company.userId,
            companyId: company._id?.toString(),
            companyName: company.name,
            // Customer info - from order or company
            customerName: order.ownerName || order.customerName || company.ownerName || "N/A",
            customerEmail: order.ownerEmail || order.customerEmail || company.ownerEmail || "N/A",
            orderType: order.orderType,
            packageType: order.packageType,
            state: order.state,
            status: order.status,
            pricing: order.pricing || {},
            paymentInfo: order.paymentInfo || {},
            selectedAddons: order.selectedAddons || [],
            purchasedAddons: order.purchasedAddons || [],
            passportDocuments: order.passportDocuments || [],
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          })
        }
      }
    }

    // Sort by creation date descending
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`[v0] Extracted ${allOrders.length} orders from ${companiesWithOrders}/${companies.length} companies`, {
      totalCompanies: companies.length,
      companiesWithOrders,
      totalOrdersFound,
      extractedOrders: allOrders.length,
      companies: companies.map(c => ({ id: c._id, name: c.name, orderCount: c.orders?.length || 0 }))
    })

    const result = {
      success: true,
      data: allOrders,
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    console.error("[v0] Orders API error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 }))
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
      companyId,
      companyName,
      orderType,
      type,
      amount,
      total,
      packagePrice,
      packageType,
      stateFilingFee,
      addonsTotal,
      selectedAddons,
      items,
      purchasedAddons,
      paymentMethod,
      whatsappPhone,
      receiptUrl,
      state,
      status,
      pricing,
      paymentInfo,
      passportDocuments,
    } = body

    if (!companyId || !companyName || (!orderType && !type)) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    const { db } = await connectDB()

    // Fetch the company to verify it exists
    const company = await db.collection("companies").findOne({ 
      _id: ObjectId.isValid(companyId) ? new ObjectId(companyId) : companyId 
    })
    
    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    console.log("[v0] Creating order for company:", company.name)

    // Create the new order to be embedded in the company
    const newOrder = {
      id: new ObjectId().toString(),
      userId: decoded.userId,
      orderType: orderType || type || "Formation",
      packageType: packageType || company.packageType || "starter",
      state: state || company.state || "N/A",
      status: status || "pending",
      pricing: pricing || {
        packagePrice: packagePrice || 0,
        stateFilingFee: stateFilingFee || 0,
        addonsTotal: addonsTotal || 0,
        subtotal: (packagePrice || 0) + (stateFilingFee || 0),
        total: total || amount || 0,
      },
      selectedAddons: selectedAddons || items || [],
      paymentInfo: paymentInfo || {
        method: paymentMethod || "stripe",
        status: "pending",
        whatsappPhone: whatsappPhone || null,
        receiptUrl: receiptUrl || null,
        date: new Date().toISOString(),
      },
      purchasedAddons: Array.isArray(purchasedAddons) ? purchasedAddons : [],
      passportDocuments: passportDocuments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add order to the company's orders array
    const updateResult = await db.collection("companies").findOneAndUpdate(
      { _id: new ObjectId(company._id) },
      {
        $push: { orders: newOrder },
        $set: { updatedAt: new Date().toISOString() },
      },
      { returnDocument: "after" }
    )

    if (!updateResult) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to create order" }, { status: 500 }))
    }

    console.log("[v0] Order created successfully:", newOrder.id)

    const createdOrder = { 
      id: newOrder.id, 
      companyId: company._id.toString(),
      companyName: company.name,
      ...newOrder 
    }

    broadcastUpdate("orders", "created", createdOrder)

    // Update company milestones
    try {
      await db.collection("companies").updateOne(
        { _id: new ObjectId(company._id) },
        {
          $set: {
            "customMilestones.0.completed": true,
            "customMilestones.0.completedDate": new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      )
    } catch (milestoneError) {
      console.log("[v0] Failed to mark milestone complete:", milestoneError)
    }

    // Send confirmation email
    try {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { name: 1, email: 1 } })

      if (user) {
        const orderEmail = emailTemplates.orderConfirmation(user.name, newOrder.id, {
          companyName,
          packageType: newOrder.packageType,
          state: newOrder.state,
          total: newOrder.pricing.total,
        })

        await sendEmail({
          to: user.email,
          subject: orderEmail.subject,
          html: orderEmail.html,
        }).catch((emailError) => {
          console.log("[v0] Email sending failed (non-critical):", emailError)
        })
      }
    } catch (emailError) {
      console.log("[v0] Email preparation failed (non-critical):", emailError)
    }

    // Create notification
    try {
      await db.collection("notifications").insertOne({
        userId: decoded.userId,
        companyId: company._id.toString(),
        type: "order",
        title: "Order Placed Successfully!",
        message: `Thank you for placing your trust in BuzzFiling! We've received your order for forming your U.S. ${newOrder.orderType}, and our team is now processing it.`,
        read: false,
        metadata: {
          orderId: newOrder.id,
          companyId: company._id.toString(),
          companyName: companyName,
          orderType: newOrder.orderType,
          amount: newOrder.pricing.total,
        },
        createdAt: new Date().toISOString(),
      })

      broadcastUpdate("notifications", "created", { userId: decoded.userId })
    } catch (notificationError) {
      console.log("[v0] Notification creation failed (non-critical):", notificationError)
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: createdOrder,
      }),
    )
  } catch (error) {
    console.error("[v0] Order creation error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to create order" }, { status: 500 }))
  }
}
