import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { validateObjectId } from "@/lib/validation"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import type { Company, User } from "@/lib/types"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] Fetching order with ID:", id)

    if (!id || typeof id !== "string" || id.trim() === "") {
      console.error("[v0] Order ID is missing or invalid")
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: "Invalid Order ID format",
            details: "Order ID is required and must be a valid string",
          },
          { status: 400 },
        ),
      )
    }

    try {
      validateObjectId(id, "Order ID")
    } catch (validationError) {
      console.error("[v0] Order ID validation failed:", validationError)
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: "Invalid Order ID format",
            details: validationError instanceof Error ? validationError.message : "Unknown validation error",
          },
          { status: 400 },
        ),
      )
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.error("[v0] No auth token provided")
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.error("[v0] Invalid auth token")
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    console.log("[v0] Auth successful, user:", decoded.userId, "role:", decoded.role)

    const { db } = await connectDB()

    console.log("[v0] Connected to database, searching for order...")

    let orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(id) })
    let isEmbeddedOrder = false
    let companyDoc: any = null

    if (!orderDoc) {
      console.log("[v0] Order not found in orders collection, searching embedded orders in companies...")

      companyDoc = await db.collection("companies").findOne({
        "orders.id": id,
      })

      if (companyDoc && companyDoc.orders) {
        // Find the specific order in the embedded orders array
        const embeddedOrder = companyDoc.orders.find((o: any) => o.id === id)
        if (embeddedOrder) {
          console.log("[v0] Found embedded order in company:", companyDoc._id.toString())
          isEmbeddedOrder = true
          // Convert embedded order to orderDoc format
          orderDoc = {
            _id: { toString: () => id }, // Mock ObjectId
            id: embeddedOrder.id,
            userId: companyDoc.userId,
            companyId: companyDoc._id.toString(),
            orderType: embeddedOrder.orderType,
            packageType: embeddedOrder.packageType,
            state: embeddedOrder.state,
            status: embeddedOrder.status,
            pricing: embeddedOrder.pricing,
            selectedAddons: embeddedOrder.selectedAddons || [],
            purchasedAddons: embeddedOrder.selectedAddons || [],
            paymentInfo: embeddedOrder.paymentInfo,
            paymentMethod: embeddedOrder.paymentInfo?.method,
            paymentStatus: embeddedOrder.paymentInfo?.status,
            transactionId: embeddedOrder.paymentInfo?.transactionId,
            transactionReference: embeddedOrder.paymentInfo?.transactionId,
            paymentDate: embeddedOrder.paymentInfo?.date,
            amount: embeddedOrder.pricing?.total,
            total: embeddedOrder.pricing?.total,
            packagePrice: embeddedOrder.pricing?.packagePrice,
            stateFilingFee: embeddedOrder.pricing?.stateFilingFee,
            addonsTotal: embeddedOrder.pricing?.addonsTotal,
            subtotal: embeddedOrder.pricing?.subtotal,
            createdAt: embeddedOrder.createdAt,
            updatedAt: embeddedOrder.updatedAt,
          }
        }
      }
    }

    if (!orderDoc) {
      console.error("[v0] Order not found in database for ID:", id)
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    console.log("[v0] Order found:", id, "Type:", isEmbeddedOrder ? "embedded" : "standalone")

    if (decoded.role !== "admin" && orderDoc.userId?.toString() !== decoded.userId) {
      console.error("[v0] User not authorized to view this order")
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    let company: Company | null = null
    let user: User | null = null
    let passportDocuments: any[] = []

    try {
      if (companyDoc) {
        company = {
          id: companyDoc._id.toString(),
          name: companyDoc.name,
          type: companyDoc.type,
          state: companyDoc.state,
          status: companyDoc.status,
          members: companyDoc.members || [],
          address: companyDoc.address,
          businessCategory: companyDoc.businessCategory,
          businessDescription: companyDoc.businessDescription,
          businessWebsite: companyDoc.businessWebsite,
          packageType: companyDoc.packageType,
          transactionReference: companyDoc.transactionReference,
          userId: companyDoc.userId?.toString(),
          ein: companyDoc.ein || null,
          itin: companyDoc.itin || null,
          businessId: companyDoc.businessId || null,
          entityType: companyDoc.entityType,
          formationDate: companyDoc.formationDate,
          milestones: {
            orderProcessed: companyDoc.milestones?.orderProcessed || true,
            registeredAgentAssigned: companyDoc.milestones?.registeredAgentAssigned || false,
            mailingAddressIssued: companyDoc.milestones?.mailingAddressIssued || false,
            formationCompleted: companyDoc.milestones?.formationCompleted || false,
            einProcessed: companyDoc.milestones?.einProcessed || false,
            boiReportFiled: companyDoc.milestones?.boiReportFiled || false,
          },
          customMilestones: companyDoc.customMilestones || [],
          registeredAgent: companyDoc.registeredAgent || null,
          mailingAddress: companyDoc.mailingAddress || null,
          purchasedAddons: companyDoc.purchasedAddons || [],
          createdAt: companyDoc.createdAt,
          updatedAt: companyDoc.updatedAt,
        } as Company
      } else if (orderDoc.companyId) {
        const companyLookupValue =
          typeof orderDoc.companyId === "string" && ObjectId.isValid(orderDoc.companyId)
            ? new ObjectId(orderDoc.companyId)
            : orderDoc.companyId

        const foundCompanyDoc = await db.collection("companies").findOne({ _id: companyLookupValue })
        if (foundCompanyDoc) {
          company = {
            id: foundCompanyDoc._id.toString(),
            name: foundCompanyDoc.name,
            type: foundCompanyDoc.type,
            state: foundCompanyDoc.state,
            status: foundCompanyDoc.status,
            members: foundCompanyDoc.members || [],
            address: foundCompanyDoc.address,
            businessCategory: foundCompanyDoc.businessCategory,
            businessDescription: foundCompanyDoc.businessDescription,
            businessWebsite: foundCompanyDoc.businessWebsite,
            packageType: foundCompanyDoc.packageType,
            transactionReference: foundCompanyDoc.transactionReference,
            userId: foundCompanyDoc.userId?.toString(),
            ein: foundCompanyDoc.ein || null,
            itin: foundCompanyDoc.itin || null,
            businessId: foundCompanyDoc.businessId || null,
            entityType: foundCompanyDoc.entityType,
            formationDate: foundCompanyDoc.formationDate,
            milestones: {
              orderProcessed: foundCompanyDoc.milestones?.orderProcessed || true,
              registeredAgentAssigned: foundCompanyDoc.milestones?.registeredAgentAssigned || false,
              mailingAddressIssued: foundCompanyDoc.milestones?.mailingAddressIssued || false,
              formationCompleted: foundCompanyDoc.milestones?.formationCompleted || false,
              einProcessed: foundCompanyDoc.milestones?.einProcessed || false,
              boiReportFiled: foundCompanyDoc.milestones?.boiReportFiled || false,
            },
            customMilestones: foundCompanyDoc.customMilestones || [],
            registeredAgent: foundCompanyDoc.registeredAgent || null,
            mailingAddress: foundCompanyDoc.mailingAddress || null,
            purchasedAddons: foundCompanyDoc.purchasedAddons || [],
            createdAt: foundCompanyDoc.createdAt,
            updatedAt: foundCompanyDoc.updatedAt,
          } as Company
        }
      }
    } catch (error) {
      console.log("[v0] Error fetching company data:", error)
    }

    try {
      if (orderDoc.userId) {
        const userLookupValue =
          typeof orderDoc.userId === "string" && ObjectId.isValid(orderDoc.userId)
            ? new ObjectId(orderDoc.userId)
            : orderDoc.userId

        const userDoc = await db.collection("users").findOne({ _id: userLookupValue })
        if (userDoc) {
          user = {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            phone: userDoc.phone,
            role: userDoc.role,
            createdAt: userDoc.createdAt,
          } as User
        }
      }
    } catch (error) {}

    try {
      const userIdObjectId =
        typeof orderDoc.userId === "string" && ObjectId.isValid(orderDoc.userId)
          ? new ObjectId(orderDoc.userId)
          : orderDoc.userId

      const companyIdObjectId =
        orderDoc.companyId && typeof orderDoc.companyId === "string" && ObjectId.isValid(orderDoc.companyId)
          ? new ObjectId(orderDoc.companyId)
          : orderDoc.companyId

      const passportQuery: any = {
        $or: [{ userId: userIdObjectId }, { companyId: companyIdObjectId }],
      }

      const passports = await db.collection("passports").find(passportQuery).toArray()

      passportDocuments = passports.map((passport) => ({
        id: passport._id?.toString(),
        userId: passport.userId?.toString(),
        companyId: passport.companyId?.toString(),
        memberId: passport.memberId,
        memberName: passport.memberName,
        fileName: passport.fileName,
        fileUrl: passport.fileUrl,
        fileType: passport.fileType || passport.mimeType || "application/pdf",
        fileSize: passport.fileSize || 0,
        uploadedAt: passport.uploadedAt,
      }))
    } catch (error) {}

    console.log("[v0] Successfully prepared order response")

    const result = {
      success: true,
      data: {
        id: orderDoc.id,
        userId: orderDoc.userId?.toString(),
        companyId: orderDoc.companyId?.toString(),
        orderType: orderDoc.orderType,
        packageType: orderDoc.packageType,
        state: orderDoc.state,
        status: orderDoc.status,
        pricing: orderDoc.pricing || {
          packagePrice: orderDoc.packagePrice || 0,
          stateFilingFee: orderDoc.stateFilingFee || 0,
          addonsTotal: orderDoc.addonsTotal || 0,
          subtotal: orderDoc.subtotal || 0,
          total: orderDoc.total || orderDoc.amount || 0,
        },
        selectedAddons: orderDoc.selectedAddons || [],
        purchasedAddons: orderDoc.purchasedAddons || [],
        paymentInfo: orderDoc.paymentInfo || {
          method: orderDoc.paymentMethod,
          status: orderDoc.paymentStatus,
          transactionId: orderDoc.transactionId,
          transactionReference: orderDoc.transactionReference,
          date: orderDoc.paymentDate || orderDoc.createdAt,
        },
        createdAt: orderDoc.createdAt,
        updatedAt: orderDoc.updatedAt,
        company,
        user,
        passportDocuments,
      },
    }

    return addSecurityHeaders(NextResponse.json(result))
  } catch (error) {
    console.error("[v0] Error in order GET:", error)
    if (error instanceof Error) {
      console.error("[v0] Error details:", error.message, error.stack)
      return addSecurityHeaders(
        NextResponse.json({ error: "Failed to fetch order", details: error.message }, { status: 500 }),
      )
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch order" }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    validateObjectId(id, "Order ID")

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
    const { db } = await connectDB()

    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) })

    if (!order) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && order.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    if (body.status === "completed" && order.companyId) {
      try {
        const companyIdObj =
          typeof order.companyId === "string" && ObjectId.isValid(order.companyId)
            ? new ObjectId(order.companyId)
            : order.companyId

        if (companyIdObj) {
          await db.collection("companies").updateOne(
            { _id: companyIdObj },
            {
              $set: {
                status: "completed",
                updatedAt: new Date().toISOString(),
              },
            },
          )
          console.log("[v0] Company status updated to completed")
        }
      } catch (error) {
        console.log("[v0] Error updating company status:", error)
      }
    }

    const result = await db
      .collection("orders")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to update order" }, { status: 500 }))
    }

    const updatedOrder = { id: result._id.toString(), ...result }

    broadcastUpdate("orders", "updated", updatedOrder)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedOrder,
      }),
    )
  } catch (error) {
    if (error instanceof Error) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to update order" }, { status: 500 }))
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update order" }, { status: 500 }))
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    validateObjectId(id, "Order ID")

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = await req.json()
    const { db } = await connectDB()

    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) })

    if (!order) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    const updateData: any = {}

    if (body.pricing) {
      updateData.pricing = body.pricing
      updateData.packagePrice = body.pricing.packagePrice
      updateData.stateFilingFee = body.pricing.stateFilingFee
      updateData.addonsTotal = body.pricing.addonsTotal
      updateData.subtotal = body.pricing.subtotal
      updateData.total = body.pricing.total
      updateData.amount = body.pricing.total
    }

    if (body.status) {
      updateData.status = body.status
    }

    updateData.updatedAt = new Date().toISOString()

    console.log("[v0] Updating order with data:", updateData)

    // Try to update in orders collection first
    let result = await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    // If not found in orders collection, try updating embedded order in companies
    if (result.matchedCount === 0) {
      console.log("[v0] Order not in orders collection, updating embedded order...")

      result = await db.collection("companies").updateOne(
        { "orders.id": id },
        {
          $set: {
            "orders.$.pricing": body.pricing,
            "orders.$.status": body.status,
            "orders.$.updatedAt": new Date().toISOString(),
          },
        },
      )
    }

    if (result.matchedCount === 0) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Order updated successfully",
      }),
    )
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    validateObjectId(id, "Order ID")

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    if (decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }))
    }

    const { db } = await connectDB()

    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) })

    if (!order) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    let companyIdObj: ObjectId | null = null

    if (order.companyId) {
      try {
        if (typeof order.companyId === "string" && ObjectId.isValid(order.companyId)) {
          companyIdObj = new ObjectId(order.companyId)
        } else if (order.companyId instanceof ObjectId) {
          companyIdObj = order.companyId
        } else {
          console.log("[v0] Invalid companyId format, skipping related deletes:", order.companyId)
        }
      } catch (conversionError) {
        console.log("[v0] Error converting companyId:", conversionError)
      }
    }

    // Delete related data if valid companyId exists
    if (companyIdObj) {
      const companyIdString = companyIdObj.toString()
      const query = { companyId: { $in: [companyIdObj, companyIdString] } }

      try {
        await Promise.all([
          db.collection("documents").deleteMany(query),
          db.collection("mail").deleteMany(query),
          db.collection("passports").deleteMany(query),
          db.collection("notifications").deleteMany(query),
        ])

        await db.collection("companies").deleteOne({ _id: companyIdObj })
        console.log("[v0] Successfully deleted related company data")
      } catch (deleteError) {
        console.log("[v0] Error deleting related data (non-critical):", deleteError)
      }
    }

    // Delete order itself
    await db.collection("orders").deleteOne({ _id: new ObjectId(id) })

    broadcastUpdate("orders", "deleted", { id })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Order and associated data deleted successfully",
      }),
    )
  } catch (error) {
    console.error("[v0] DELETE ERROR:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete order" }, { status: 500 }))
  }
}
