import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

// GET /api/invoices - Get all invoices (filtered by user for clients)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectDB()
    const query = decoded.role === "admin" ? {} : { userId: decoded.userId }

    const invoices = await db.collection("invoices").find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: invoices.map((invoice) => ({
        id: invoice._id.toString(),
        userId: invoice.userId,
        companyId: invoice.companyId,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        items: invoice.items,
        notes: invoice.notes,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST /api/invoices - Create invoice (admin only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, companyId, amount, dueDate, items, notes } = body

    if (!userId || !companyId || !amount || !dueDate || !items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectDB()

    // Generate invoice number
    const count = await db.collection("invoices").countDocuments()
    const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`

    const newInvoice = {
      userId,
      companyId,
      invoiceNumber,
      amount,
      status: "sent",
      dueDate,
      items,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("invoices").insertOne(newInvoice)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newInvoice,
      },
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
