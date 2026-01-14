import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"
import type { Company } from "@/lib/types"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
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

    const { db } = await connectDB()

    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && company.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: {
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
          address: company.address,
          businessCategory: company.businessCategory,
          businessDescription: company.businessDescription,
          businessWebsite: company.businessWebsite,
          packageType: company.packageType,
          transactionReference: company.transactionReference || null,
          members: company.members || [],
          milestones: company.milestones || {
            orderProcessed: false,
            registeredAgentAssigned: false,
            mailingAddressIssued: false,
            formationCompleted: false,
            einProcessed: false,
            boiReportFiled: false,
          },
          customMilestones: company.customMilestones || [],
          purchasedAddons: company.purchasedAddons || [],
          orders: company.orders || [],
          revenue: company.revenue || 0,
          lastOrderDate: company.lastOrderDate || null,
          ein: company.ein || null,
          itin: company.itin || null,
          businessId: company.businessId || null,
          registeredAgent: company.registeredAgent || null,
          mailingAddress: company.mailingAddress || null,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
      }),
    )
  } catch (error) {
    console.log("[v0] Error fetching company:", error)
    if (error instanceof Error) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch company" }, { status: 500 }))
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to fetch company" }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return addSecurityHeaders(NextResponse.json({ error: "Invalid company ID format" }, { status: 400 }))
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

    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) })

    if (!company) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    if (decoded.role !== "admin" && company.userId !== decoded.userId) {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const updateData: Partial<Company> = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    if (body.members && Array.isArray(body.members)) {
      updateData.members = body.members.map((member: any) => ({
        ...member,
        passportUrl: member.passportUrl || null,
      }))
    }

    if (body.orders && Array.isArray(body.orders)) {
      const totalRevenue = body.orders.reduce((sum: number, order: any) => sum + (order.pricing?.total || 0), 0)
      updateData.revenue = totalRevenue
      updateData.lastOrderDate = new Date().toISOString()
    }

    if (decoded.role === "admin" && body.status) {
      updateData.status = body.status
      console.log("[v0] Admin updating company status to:", body.status)
    }

    if (body.milestones) {
      console.log(
        "[v0] Milestone update request - Company:",
        company.name,
        "Old milestones:",
        company.milestones,
        "New milestones:",
        body.milestones,
      )

      const oldMilestones = company.milestones || {}
      const newMilestones = body.milestones

      const milestoneMap: Record<string, string> = {
        orderProcessed: "Order Successfully Processed",
        registeredAgentAssigned: "Registered Agent Assigned",
        mailingAddressIssued: "Business Mailing Address Issued",
        formationCompleted: "Company Formation Completed",
        einProcessed: "EIN Successfully Processed",
        boiReportFiled: "BOI Report Filed",
      }

      for (const [key, title] of Object.entries(milestoneMap)) {
        if (!oldMilestones[key] && newMilestones[key]) {
          console.log("[v0] Milestone completed:", key, "-", title)
          try {
            await db.collection("notifications").insertOne({
              userId: company.userId,
              type: "milestone",
              title: "Milestone Completed",
              message: `${title} for ${company.name}`,
              read: false,
              actionUrl: "/client/dashboard",
              metadata: {
                companyId: company._id.toString(),
                companyName: company.name,
                milestoneName: key,
                milestoneTitle: title,
              },
              createdAt: new Date().toISOString(),
            })

            broadcastUpdate("notifications", "created", { userId: company.userId })

            try {
              const { sendEmail, emailTemplates } = await import("@/config/email")
              const user = await db
                .collection("users")
                .findOne({ _id: new ObjectId(company.userId) }, { projection: { name: 1, email: 1 } })

              if (user) {
                const milestoneEmail = emailTemplates.milestoneCompleted(user.name, title, company.name)
                await sendEmail({ to: user.email, subject: milestoneEmail.subject, html: milestoneEmail.html })
              }
            } catch (emailError) {
              console.log("[v0] Error sending milestone email (non-critical):", emailError)
            }
          } catch (notifError) {
            console.log("[v0] Error creating milestone notification:", notifError)
          }
        } else if (oldMilestones[key] && !newMilestones[key]) {
          console.log("[v0] Milestone uncompleted:", key, "-", title)
          try {
            await db.collection("notifications").deleteMany({
              userId: company.userId,
              type: "milestone",
              "metadata.companyId": company._id.toString(),
              "metadata.milestoneName": key,
            })
          } catch (deleteError) {
            console.log("[v0] Error deleting milestone notification:", deleteError)
          }
        }
      }
    }

    const result = await db
      .collection("companies")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    if (body.milestones) {
      console.log("[v0] Milestone update completed successfully. Updated milestones:", result.milestones)
    }

    const updatedCompany = { id: result._id.toString(), ...result }

    broadcastUpdate("companies", "updated", updatedCompany)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        data: updatedCompany,
      }),
    )
  } catch (error) {
    console.error("[v0] Error updating company:", error)
    if (error instanceof Error) {
      return addSecurityHeaders(NextResponse.json({ error: "Failed to update company" }, { status: 500 }))
    }
    return addSecurityHeaders(NextResponse.json({ error: "Failed to update company" }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const { db } = await connectDB()
    const result = await db.collection("companies").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return addSecurityHeaders(NextResponse.json({ error: "Company not found" }, { status: 404 }))
    }

    broadcastUpdate("companies", "deleted", { id })

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: "Company deleted successfully",
      }),
    )
  } catch (error) {
    return addSecurityHeaders(NextResponse.json({ error: "Failed to delete company" }, { status: 500 }))
  }
}
