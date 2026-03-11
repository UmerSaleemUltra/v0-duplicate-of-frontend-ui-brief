import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

/**
 * Public order view endpoint — no authentication or token required.
 * Returns company and order data for the given order ID.
 *
 * GET /api/orders/:id/public
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || id.length !== 24) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid order ID" }, { status: 400 }))
    }

    const { db } = await connectDB()

    let orderDoc: any = null
    let companyDoc: any = null

    // Try standalone orders collection first
    try {
      orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(id) })
    } catch (_) {}

    // Fall back to embedded order inside companies
    if (!orderDoc) {
      const companies = await db
        .collection("companies")
        .find({ orders: { $exists: true, $ne: [] } })
        .toArray()

      for (const company of companies) {
        const embedded = company.orders?.find((o: any) => {
          return (o._id?.toString() || o.id?.toString()) === id
        })
        if (embedded) {
          orderDoc = { ...embedded, _id: embedded._id || embedded.id, companyId: company._id }
          companyDoc = company
          break
        }
      }
    }

    if (!orderDoc) {
      return addSecurityHeaders(NextResponse.json({ error: "Order not found" }, { status: 404 }))
    }

    // Fetch associated company if not already loaded
    if (!companyDoc && orderDoc.companyId) {
      try {
        const cId =
          typeof orderDoc.companyId === "string" && ObjectId.isValid(orderDoc.companyId)
            ? new ObjectId(orderDoc.companyId)
            : orderDoc.companyId
        companyDoc = await db.collection("companies").findOne({ _id: cId })
      } catch (_) {}
    }

    const safeOrder = {
      id: orderDoc._id?.toString() || id,
      status: orderDoc.status,
      packageType: orderDoc.packageType,
      state: orderDoc.state,
      createdAt: orderDoc.createdAt,
      updatedAt: orderDoc.updatedAt,
    }

    const safeCompany = companyDoc
      ? {
          name: companyDoc.name,
          entityType: companyDoc.entityType || companyDoc.type,
          state: companyDoc.state,
          serviceStatus: companyDoc.serviceStatus,
          ein: companyDoc.ein,
          businessId: companyDoc.businessId,
          milestones: companyDoc.milestones || {
            orderSuccessfullyProcessed: false,
            registeredAgentAssigned: false,
            businessMailingAddressIssued: false,
            companyFormationCompleted: false,
            einApplicationSubmitted: false,
            einObtained: false,
          },
          customMilestones: (companyDoc.customMilestones || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            completed: m.completed,
          })),
        }
      : null

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: { order: safeOrder, company: safeCompany },
      }),
    )
  } catch (error) {
    console.error("[public-order-api] Error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }))
  }
}
