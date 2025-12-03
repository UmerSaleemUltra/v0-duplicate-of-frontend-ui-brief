import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { broadcast } from "@/lib/realtime/broadcaster"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, companyId, members } = body

    if (!userId || !companyId) {
      return NextResponse.json({ error: "Missing required fields: userId, companyId" }, { status: 400 })
    }

    const { db } = await connectDB()

    let company
    try {
      company = await db.collection("companies").findOne({
        _id: new ObjectId(companyId),
      })
    } catch {
      company = await db.collection("companies").findOne({
        _id: companyId,
      })
    }

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const query = {
      userId: userId,
      $or: [{ companyId: null }, { companyId: { $exists: false } }, { companyId: "" }],
    }

    const passportsToLink = await db.collection("passports").find(query).toArray()

    if (passportsToLink.length === 0) {
      const existingPassports = await db
        .collection("passports")
        .find({
          userId: userId,
        })
        .toArray()

      const response = NextResponse.json({
        success: true,
        message: "No passports found to link",
        data: {
          updatedCount: 0,
          passports: existingPassports.map((p) => ({
            id: p._id.toString(),
            memberName: p.memberName,
            memberId: p.memberId,
            companyId: p.companyId,
            fileUrl: p.fileUrl,
          })),
        },
      })
      addSecurityHeaders(response)
      return response
    }

    let updatedCount = 0
    const updateResults = []

    for (const passport of passportsToLink) {
      const matchingMember = company.members?.find((member: { firstName: string; lastName: string; name?: string }) => {
        const passportName = passport.memberName?.toLowerCase().trim()
        const memberFullName = `${member.firstName} ${member.lastName}`.toLowerCase().trim()
        const memberName = member.name?.toLowerCase().trim()

        return passportName === memberFullName || passportName === memberName
      })

      if (matchingMember) {
        const memberId = matchingMember.id || matchingMember._id?.toString() || passport.memberId || "0"

        await db.collection("passports").updateOne(
          { _id: passport._id },
          {
            $set: {
              companyId: companyId,
              memberId: memberId,
              updatedAt: new Date().toISOString(),
            },
          },
        )

        updatedCount++
        updateResults.push({
          memberName: passport.memberName,
          memberId: memberId,
          fileUrl: passport.fileUrl,
          status: "linked",
        })
      } else {
        await db.collection("passports").updateOne(
          { _id: passport._id },
          {
            $set: {
              companyId: companyId,
              updatedAt: new Date().toISOString(),
            },
          },
        )

        updatedCount++
        updateResults.push({
          memberName: passport.memberName,
          memberId: passport.memberId,
          fileUrl: passport.fileUrl,
          status: "linked_without_member",
        })
      }
    }

    broadcast("passports_linked", {
      userId,
      companyId,
      count: updatedCount,
    })

    const updatedPassports = await db
      .collection("passports")
      .find({
        userId: userId,
        companyId: companyId,
      })
      .toArray()

    const response = NextResponse.json({
      success: true,
      message: `Successfully linked ${updatedCount} passport(s) to company`,
      data: {
        updatedCount: updatedCount,
        passports: updatedPassports.map((p) => ({
          id: p._id.toString(),
          memberName: p.memberName,
          memberId: p.memberId,
          companyId: p.companyId,
          userId: p.userId,
          fileUrl: p.fileUrl,
          fileName: p.fileName,
        })),
        updateResults: updateResults,
      },
    })
    addSecurityHeaders(response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to link passports", details: error.message }, { status: 500 })
  }
}
