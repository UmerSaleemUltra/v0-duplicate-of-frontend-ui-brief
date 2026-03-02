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

    console.log("[v0] GET /api/orders/[id] - Order ID:", id)

    if (!id || typeof id !== "string" || id.trim() === "") {
      console.log("[v0] Invalid order ID format")
      return addSecurityHeaders(NextResponse.json({ error: "Invalid Order ID format" }, { status: 400 }))
    }

    // Only validate if it looks like a MongoDB ObjectId
    if (id.length === 24) {
      try {
        validateObjectId(id, "Order ID")
      } catch (validationError) {
        console.log("[v0] ObjectId validation failed:", validationError)
        return addSecurityHeaders(NextResponse.json({ error: "Invalid Order ID format" }, { status: 400 }))
      }
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.log("[v0] No auth token provided")
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("[v0] Invalid token")
      return addSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    console.log("[v0] Auth verified for user:", decoded.userId, "role:", decoded.role)

    const { db } = await connectDB()
    console.log("[v0] Database connected")

    let orderDoc = null
    let orderSource = null

    try {
      orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(id) })
      if (orderDoc) {
        orderSource = "orders collection"
        console.log("[v0] Order found in orders collection")
      }
    } catch (error) {
      console.log("[v0] Error searching orders collection:", error)
    }

    if (!orderDoc) {
      console.log("[v0] Order not found in orders collection, searching companies...")
      try {
        // Search for embedded order by string ID first
        let companyWithOrder = await db.collection("companies").findOne({
          "orders.id": id,
        })

        // If not found, try with ObjectId
        if (!companyWithOrder) {
          companyWithOrder = await db.collection("companies").findOne({
            "orders._id": new ObjectId(id),
          })
        }

        // If still not found, try string comparison
        if (!companyWithOrder) {
          const companies = await db
            .collection("companies")
            .find({ orders: { $exists: true, $ne: [] } })
            .toArray()

          for (const company of companies) {
            if (company.orders && Array.isArray(company.orders)) {
              const embeddedOrder = company.orders.find((order: any) => {
                const orderId = order._id?.toString() || order.id?.toString() || order.id
                return orderId === id
              })

              if (embeddedOrder) {
                companyWithOrder = company
                break
              }
            }
          }
        }

        if (companyWithOrder && companyWithOrder.orders) {
          console.log("[v0] Found company with embedded orders:", companyWithOrder._id.toString())

          const embeddedOrder = companyWithOrder.orders.find((order: any) => {
            const orderId = order._id?.toString() || order.id?.toString() || order.id
            return orderId === id
          })

          if (embeddedOrder) {
            console.log("[v0] Found embedded order in company")
            orderSource = "embedded in companies collection"
            orderDoc = {
              ...embeddedOrder,
              _id: embeddedOrder._id || embeddedOrder.id,
              companyId: companyWithOrder._id,
              userId: companyWithOrder.userId || embeddedOrder.userId,
            }
          }
        }
      } catch (error) {
        console.log("[v0] Error searching companies collection:", error)
      }
    }

    if (!orderDoc) {
      console.log("[v0] Order not found in either collection")
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: "Order not found",
            details: `No order with ID ${id} found in database`,
          },
          { status: 404 },
        ),
      )
    }

    console.log("[v0] Order found:", orderDoc._id?.toString() || orderDoc.id, "from", orderSource)

    if (decoded.role !== "admin" && orderDoc.userId?.toString() !== decoded.userId) {
      console.log("[v0] Access forbidden - user:", decoded.userId, "order user:", orderDoc.userId?.toString())
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    let company: Company | null = null
    let user: User | null = null
    let passportDocuments: any[] = []

    try {
      if (orderDoc.companyId) {
        const companyLookupValue =
          typeof orderDoc.companyId === "string" && ObjectId.isValid(orderDoc.companyId)
            ? new ObjectId(orderDoc.companyId)
            : orderDoc.companyId

        const companyDoc = await db.collection("companies").findOne({ _id: companyLookupValue })
        if (companyDoc) {
          company = {
            id: companyDoc._id.toString(),
            name: companyDoc.name,
            type: companyDoc.type,
            state: companyDoc.state,
            status: companyDoc.status,
            members: companyDoc.members || [],
            businessCategory: companyDoc.businessCategory,
            businessDescription: companyDoc.businessDescription,
            businessWebsite: companyDoc.businessWebsite,
            packageType: companyDoc.packageType,
            userId: companyDoc.userId?.toString(),
            ein: companyDoc.ein || null,
            itin: companyDoc.itin || null,
            businessId: companyDoc.businessId || null,
            entityType: companyDoc.entityType,
            formationDate: companyDoc.formationDate,
          milestones: {
            orderSuccessfullyProcessed: companyDoc.milestones?.orderSuccessfullyProcessed || false,
            registeredAgentAssigned: companyDoc.milestones?.registeredAgentAssigned || false,
            businessMailingAddressIssued: companyDoc.milestones?.businessMailingAddressIssued || false,
            companyFormationCompleted: companyDoc.milestones?.companyFormationCompleted || false,
            einApplicationSubmitted: companyDoc.milestones?.einApplicationSubmitted || false,
            einObtained: companyDoc.milestones?.einObtained || false,
          },
            customMilestones: companyDoc.customMilestones || [],
            registeredAgent: companyDoc.registeredAgent || null,
            registeredAgentStatus: companyDoc.registeredAgentStatus || "pending",
            mailingAddress: companyDoc.mailingAddress || null,
            businessAddressStatus: companyDoc.businessAddressStatus || "pending",
            companyStatus: companyDoc.companyStatus || "pending",
            serviceStatus: companyDoc.serviceStatus || "pending",
            purchasedAddons: companyDoc.purchasedAddons || [],
            createdAt: companyDoc.createdAt,
            updatedAt: companyDoc.updatedAt,
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

    const result = {
      success: true,
      data: {
        id: orderDoc._id?.toString() || orderDoc.id,
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
    console.log("[v0] Error in order GET:", error)
    if (error instanceof Error) {
      console.log("[v0] Error message:", error.message)
      console.log("[v0] Error stack:", error.stack)
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: "Failed to fetch order",
            details: error.message,
          },
          { status: 500 },
        ),
      )
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch order" }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    try {
      validateObjectId(id, "Order ID")
    } catch (validationError) {
      console.log("[v0] ObjectId validation failed in PUT:", validationError)
      return addSecurityHeaders(NextResponse.json({ error: "Invalid Order ID format" }, { status: 400 }))
    }

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

    let order = await db.collection("orders").findOne({ _id: new ObjectId(id) })
    let isEmbeddedOrder = false
    let companyId: ObjectId | string | null = null

    if (!order) {
      // Search in companies for embedded order
      const companies = await db
        .collection("companies")
        .find({ orders: { $exists: true, $ne: [] } })
        .toArray()

      for (const company of companies) {
        const embeddedOrder = company.orders?.find((o: any) => {
          const orderId = o._id?.toString() || o.id?.toString() || o.id
          return orderId === id
        })
        if (embeddedOrder) {
          order = embeddedOrder
          isEmbeddedOrder = true
          companyId = company._id
          console.log("[v0] Found embedded order in company:", company._id.toString())
          break
        }
      }
    }

    if (!order) {
      console.log("[v0] Order not found in PUT:", id)
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && order.userId?.toString() !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const allowedUpdateFields = ["status", "paymentStatus", "paymentMethod", "notes", "pricing", "purchasedAddons", "selectedAddons", "paymentInfo", "receiptUrl"]
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    for (const field of allowedUpdateFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (body.status === "completed" && (order.companyId || companyId)) {
      const cId = order.companyId || companyId
      const companyIdObj = typeof cId === "string" && ObjectId.isValid(cId) ? new ObjectId(cId) : cId

      if (companyIdObj) {
        await db.collection("companies").updateOne(
          { _id: companyIdObj },
          {
            $set: {
              companyStatus: "completed",
              updatedAt: new Date().toISOString(),
            },
          },
        )

        try {
          const { sendEmail, emailTemplates } = await import("@/config/email")
          const company = await db.collection("companies").findOne({ _id: companyIdObj })
          if (company && company.userId) {
            const user = await db
              .collection("users")
              .findOne({ _id: new ObjectId(company.userId) }, { projection: { name: 1, email: 1 } })

            if (user) {
              const completionEmail = emailTemplates.orderCompleted(user.name, company.name)
              await sendEmail({ to: user.email, subject: completionEmail.subject, html: completionEmail.html })
              console.log("[v0] Sent order completion email to:", user.email)
            }
          }
        } catch (emailError) {
          console.log("[v0] Error sending order completion email (non-critical):", emailError)
        }
      }
    }

    // Build company-level fields to sync when purchasedAddons or pricing are updated.
    // The DB stores purchasedAddons, pricing, and revenue at the TOP-LEVEL company doc,
    // not inside the embedded orders[] array — so we must update the company directly.
    const companyLevelUpdate: any = { updatedAt: new Date().toISOString() }
    if ("purchasedAddons" in body) {
      companyLevelUpdate.purchasedAddons = body.purchasedAddons
    }
    if ("pricing" in body) {
      companyLevelUpdate.pricing = body.pricing
      // Recalculate revenue: subtotal (package+state) + addonsTotal
      const addonsTotal = body.pricing?.addonsTotal ?? 0
      const subtotal = body.pricing?.subtotal ?? (body.pricing?.packagePrice ?? 0) + (body.pricing?.stateFilingFee ?? 0)
      companyLevelUpdate.revenue = subtotal + addonsTotal
    }
    const hasCompanyLevelChanges = "purchasedAddons" in body || "pricing" in body

    let result
    if (isEmbeddedOrder && companyId) {
      const companyIdObj =
        typeof companyId === "string" && ObjectId.isValid(companyId) ? new ObjectId(companyId) : companyId

      // Build $set: update embedded order + any company-level fields together
      const setPayload: any = {
        ...companyLevelUpdate,
      }

      // Try matching by _id first
      let updatedCompany = await db.collection("companies").findOneAndUpdate(
        {
          _id: companyIdObj,
          "orders._id": new ObjectId(id),
        },
        {
          $set: {
            ...setPayload,
            "orders.$[elem]": { ...order, ...updateData },
          },
        },
        {
          arrayFilters: [{ "elem._id": new ObjectId(id) }],
          returnDocument: "after",
        },
      )

      if (!updatedCompany) {
        console.log("[v0] Update by _id failed, trying by id field")
        updatedCompany = await db.collection("companies").findOneAndUpdate(
          { _id: companyIdObj },
          {
            $set: {
              ...setPayload,
              "orders.$[elem]": { ...order, ...updateData },
            },
          },
          {
            arrayFilters: [{ "elem.id": id }],
            returnDocument: "after",
          },
        )
      }
      result = updatedCompany
    } else {
      // Update standalone order
      result = await db
        .collection("orders")
        .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

      // For standalone orders, also sync company-level fields if we have a companyId
      if (hasCompanyLevelChanges && result?.companyId) {
        const cId = result.companyId
        const cObjId = typeof cId === "string" && ObjectId.isValid(cId) ? new ObjectId(cId) : cId
        if (cObjId) {
          await db.collection("companies").updateOne({ _id: cObjId }, { $set: companyLevelUpdate })
        }
      }
    }

    if (!result) {
      console.log("[v0] Update operation returned no result")
      return addSecurityHeaders(NextResponse.json({ error: "Failed to update order" }, { status: 500 }))
    }

    const updatedOrder = { id: result._id?.toString() || id, ...result }
    broadcastUpdate("orders", "updated", updatedOrder)
    if (hasCompanyLevelChanges) {
      broadcastUpdate("companies", "updated", { id: result._id?.toString() })
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedOrder,
      }),
    )
  } catch (error) {
    console.log("[v0] PUT Error:", error)
    if (error instanceof Error) {
      console.log("[v0] Error details:", error.message)
      console.log("[v0] Error stack:", error.stack)
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update order" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || typeof id !== "string" || id.trim() === "") {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid Order ID" }, { status: 400 }))
    }

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

    // Try to find the order in the standalone orders collection first
    let order: any = null
    let isEmbedded = false
    let embeddedCompanyId: ObjectId | null = null

    // Attempt lookup by ObjectId in the orders collection
    if (ObjectId.isValid(id)) {
      try {
        order = await db.collection("orders").findOne({ _id: new ObjectId(id) })
      } catch (_) {}
    }

    // If not found as standalone, search embedded orders inside companies
    if (!order) {
      const companies = await db
        .collection("companies")
        .find({ orders: { $exists: true, $not: { $size: 0 } } })
        .toArray()

      for (const company of companies) {
        if (!Array.isArray(company.orders)) continue
        const embedded = company.orders.find((o: any) => {
          const oid = o._id?.toString() || o.id?.toString() || o.id
          return oid === id
        })
        if (embedded) {
          order = { ...embedded, companyId: company._id.toString() }
          isEmbedded = true
          embeddedCompanyId = company._id
          break
        }
      }
    }

    if (!order) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    let companyIdObj: ObjectId | null = embeddedCompanyId

    if (!companyIdObj && order.companyId) {
      try {
        if (typeof order.companyId === "string" && ObjectId.isValid(order.companyId)) {
          companyIdObj = new ObjectId(order.companyId)
        } else if (order.companyId instanceof ObjectId) {
          companyIdObj = order.companyId
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

    if (isEmbedded && embeddedCompanyId) {
      // For embedded orders already deleted via company, nothing extra needed
    } else if (ObjectId.isValid(id)) {
      // Delete standalone order
      await db.collection("orders").deleteOne({ _id: new ObjectId(id) })
    }

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
