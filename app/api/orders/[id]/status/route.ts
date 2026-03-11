import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

/**
 * Public order status endpoint — no authentication required.
 * Validates via a `shareToken` query param stored on the order document.
 *
 * GET /api/orders/:id/status?token=<shareToken>
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Missing token" }, { status: 401 }))
    }

    if (!id || id.length !== 24) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid order ID" }, { status: 400 }))
    }

    const { db } = await connectDB()

    // Try standalone orders collection first
    let orderDoc: any = null
    let companyDoc: any = null

    try {
      orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(id) })
    } catch (_) {}

    // Fall back to embedded order in companies
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

    // Validate share token
    if (!orderDoc.shareToken || orderDoc.shareToken !== token) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid or expired token" }, { status: 403 }))
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

    // Only expose safe, non-sensitive fields
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
          type: companyDoc.type,
          state: companyDoc.state,
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
            completedAt: m.completedAt,
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
    console.error("[status-api] Error:", error)
    return addSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }))
  }
}
