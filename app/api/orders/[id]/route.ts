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

    const { db } = await connectDB()

    let orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(id) })

    if (!orderDoc) {
      console.log("[v0] Order not found in orders collection, searching companies...")
      const companyWithOrder = await db.collection("companies").findOne({
        "orders._id": new ObjectId(id),
      })

      if (companyWithOrder && companyWithOrder.orders) {
        const embeddedOrder = companyWithOrder.orders.find((order: any) => order._id.toString() === id)

        if (embeddedOrder) {
          console.log("[v0] Found embedded order in company:", companyWithOrder._id.toString())
          orderDoc = {
            ...embeddedOrder,
            companyId: companyWithOrder._id,
            userId: companyWithOrder.userId || embeddedOrder.userId,
          }
        }
      }
    }

    if (!orderDoc) {
      console.log("[v0] Order not found in either collection")
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    console.log("[v0] Order found:", orderDoc._id.toString())

    if (decoded.role !== "admin" && orderDoc.userId?.toString() !== decoded.userId) {
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
        id: orderDoc._id.toString(),
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
    console.log("[v0] Error in order GET:", error)
    if (error instanceof Error) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch order" }, { status: 500 }))
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch order" }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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
