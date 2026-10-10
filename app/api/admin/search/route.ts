import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"

const MAX_RESULTS = 8

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function result(type: string, id: string, title: string, subtitle: string, href: string) {
  return { type, id, title, subtitle, href }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const decoded = token ? verifyToken(token) : null
  if (!decoded || decoded.role !== "admin") {
    return addSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
  }

  const query = text(new URL(request.url).searchParams.get("q"))
  if (query.length < 2) return NextResponse.json({ results: [] })

  try {
    const { db } = await connectDB()
    const expression = { $regex: query.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
    const results: ReturnType<typeof result>[] = []

    const [users, companies, documents, promoCodes] = await Promise.all([
      db.collection("users").find({ $or: [{ name: expression }, { email: expression }, { company: expression }] }).project({ name: 1, email: 1, company: 1 }).limit(MAX_RESULTS).toArray(),
      db.collection("companies").find({ $or: [{ name: expression }, { businessName: expression }, { email: expression }, { ein: expression }] }).project({ name: 1, businessName: 1, email: 1, userId: 1 }).limit(MAX_RESULTS).toArray(),
      db.collection("documents").find({ $or: [{ name: expression }, { fileName: expression }, { type: expression }] }).project({ name: 1, fileName: 1, type: 1, companyId: 1 }).limit(MAX_RESULTS).toArray(),
      db.collection("promo_codes").find({ $or: [{ code: expression }, { description: expression }] }).project({ code: 1, description: 1 }).limit(MAX_RESULTS).toArray(),
    ])

    users.forEach((item) => results.push(result("Customer", String(item._id), text(item.name) || text(item.email), text(item.email) || text(item.company), `/admin/customers/${item._id}`)))
    companies.forEach((item) => results.push(result("Company", String(item._id), text(item.name) || text(item.businessName) || "Unnamed company", text(item.email) || "Company profile", `/admin/customers/${item.userId || item._id}`)))
    documents.forEach((item) => results.push(result("Document", String(item._id), text(item.name) || text(item.fileName) || "Untitled document", text(item.type) || "Document", "/admin/documents")))
    promoCodes.forEach((item) => results.push(result("Promo code", String(item._id), text(item.code), text(item.description) || "Promo code", "/admin/promo-codes")))

    const orders = await db.collection("companies").aggregate([
      { $unwind: "$orders" },
      { $match: { $or: [{ "orders.orderNumber": expression }, { "orders._id": expression }, { "orders.service": expression }] } },
      { $project: { order: "$orders" } },
      { $limit: MAX_RESULTS },
    ]).toArray()
    orders.forEach((item) => results.push(result("Order", String(item.order?._id), text(item.order?.orderNumber) || String(item.order?._id), text(item.order?.service) || "Order", `/admin/orders/${item.order?._id}`)))

    return addSecurityHeaders(NextResponse.json({ results: results.slice(0, 40) }, { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }))
  } catch (error) {
    console.error("[admin-search] failed", error)
    return addSecurityHeaders(NextResponse.json({ error: "Search unavailable" }, { status: 500 }))
  }
}
