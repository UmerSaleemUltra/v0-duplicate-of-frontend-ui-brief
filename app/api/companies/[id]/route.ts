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
          businessCategory: company.businessCategory,
          businessDescription: company.businessDescription,
          businessWebsite: company.businessWebsite,
          packageType: company.packageType,
          members: company.members || [],
        milestones: company.milestones || {
          orderSuccessfullyProcessed: false,
          registeredAgentAssigned: false,
          businessMailingAddressIssued: false,
          companyApplicationApplied: false,
          companyFormationCompleted: false,
          einApplicationSubmitted: false,
          einObtained: false,
        },
          customMilestones: company.customMilestones || [],
          purchasedAddons: company.purchasedAddons || [],
          orders: company.orders || [],
          revenue: company.revenue || 0,
          lastOrderDate: company.lastOrderDate || null,
          ein: company.ein || null,
          itinMembers: company.itinMembers || [],
          businessId: company.businessId || null,
          registeredAgent: company.registeredAgent || null,
          mailingAddress: company.mailingAddress || null,
          taxClassification: company.taxClassification || null,
          annualReportFilingDate: company.annualReportFilingDate || null,
          irsFilingDate: company.irsFilingDate || null,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
      }),
    )
  } catch (error) {
    console.log(" Error fetching company:", error)
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

    // Role-based field whitelist for company updates.
    // Clients can only edit safe profile fields; sensitive operational fields are admin-only.
    const adminOnlyFields = [
      "status", "companyStatus", "registeredAgentStatus", "businessAddressStatus", "serviceStatus",
      "ein", "itin", "businessId", "registeredAgent", "mailingAddress",
      "milestones", "customMilestones", "revenue", "orders",
      "taxClassification", "annualReportFilingDate", "irsFilingDate",
    ]
    const clientAllowedFields = [
      "name", "type", "state", "businessCategory", "businessDescription",
      "businessWebsite", "packageType", "members",
    ]

    const allowedFields = decoded.role === "admin"
      ? [...adminOnlyFields, ...clientAllowedFields]
      : clientAllowedFields

    const updateData: Partial<Company> = { updatedAt: new Date().toISOString() }
    for (const field of allowedFields) {
      if (field in body) (updateData as any)[field] = body[field]
    }

    if (body.members && Array.isArray(body.members)) {
      updateData.members = body.members.map((member: any) => ({
        ...member,
        passportUrl: member.passportUrl || null,
      }))
    }

    // Admin-only: recalculate revenue from scratch if orders array is being replaced
    if (decoded.role === "admin" && body.orders && Array.isArray(body.orders)) {
      const totalRevenue = body.orders.reduce((sum: number, order: any) => {
        return sum + (order.pricing?.total ?? order.amount ?? order.total ?? 0)
      }, 0)
      updateData.revenue = totalRevenue
      updateData.lastOrderDate = new Date().toISOString()
    }

    if (decoded.role === "admin" && body.status) {
      updateData.status = body.status
    }

    if (body.milestones) {
      console.log(
        " Milestone update request - Company:",
        company.name,
        "Old milestones:",
        company.milestones,
        "New milestones:",
        body.milestones,
      )

      const oldMilestones = company.milestones || {}
      const newMilestones = body.milestones

      const milestoneMap: Record<string, { title: string; message: string; emailTemplate: string }> = {
        orderSuccessfullyProcessed: {
          title: "Order Processing Started",
          message: `We have started processing your order to create "${company.name}". You can track progress in your dashboard.`,
          emailTemplate: "orderStarted",
        },
        registeredAgentAssigned: {
          title: "Registered Agent Assigned",
          message: `A registered agent has been assigned for your company "${company.name}". You can track all updates in your dashboard.`,
          emailTemplate: "registeredAgentAssigned",
        },
        businessMailingAddressIssued: {
          title: "Mailing Address Assigned",
          message: `Your company "${company.name}" now has an official mailing address. Check your dashboard for details.`,
          emailTemplate: "businessAddressAssigned",
        },
        companyApplicationApplied: {
          title: "Company Application Applied",
          message: `Your company application for "${company.name}" has been submitted to the state. We'll update you when we receive confirmation.`,
          emailTemplate: "companyApplicationApplied",
        },
        companyFormationCompleted: {
          title: "Company Formation Complete",
          message: `Congratulations! Your company "${company.name}" is now officially registered. Check your dashboard for all documents and next steps.`,
          emailTemplate: "companyFormed",
        },
        einApplicationSubmitted: {
          title: "EIN Application Submitted",
          message: `Your EIN application for "${company.name}" has been successfully submitted. You'll be notified once it's approved.`,
          emailTemplate: "einUploaded",
        },
        einObtained: {
          title: "EIN Obtained",
          message: `Congratulations! Your EIN for "${company.name}" has been issued. Check your dashboard for the official EIN document.`,
          emailTemplate: "einObtained",
        },
      }

      for (const [key, config] of Object.entries(milestoneMap)) {
        if (!oldMilestones[key] && newMilestones[key]) {
          console.log(" Milestone completed:", key, "-", config.title)
          try {
            await db.collection("notifications").insertOne({
              userId: company.userId,
              type: "milestone",
              title: config.title,
              message: config.message,
              read: false,
              actionUrl: "/client/dashboard",
              metadata: {
                companyId: company._id.toString(),
                companyName: company.name,
                milestoneName: key,
                milestoneTitle: config.title,
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
                const emailTemplateFunc = (emailTemplates as any)[config.emailTemplate]
                if (emailTemplateFunc) {
                  const milestoneEmail = emailTemplateFunc(user.name, company.name)
                  await sendEmail({ to: user.email, subject: milestoneEmail.subject, html: milestoneEmail.html })
                  console.log(" Sent milestone email:", config.emailTemplate)
                }
              }
            } catch (emailError) {
              console.log(" Error sending milestone email (non-critical):", emailError)
            }
          } catch (notifError) {
            console.log(" Error creating milestone notification:", notifError)
          }
        } else if (oldMilestones[key] && !newMilestones[key]) {
          console.log(" Milestone uncompleted:", key, "-", config.title)
          try {
            await db.collection("notifications").deleteMany({
              userId: company.userId,
              type: "milestone",
              "metadata.companyId": company._id.toString(),
              "metadata.milestoneName": key,
            })
          } catch (deleteError) {
            console.log(" Error deleting milestone notification:", deleteError)
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
      console.log(" Milestone update completed successfully. Updated milestones:", result.milestones)
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
    console.error(" Error updating company:", error)
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
