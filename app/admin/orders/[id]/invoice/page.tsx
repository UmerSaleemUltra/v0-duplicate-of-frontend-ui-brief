"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { ArrowLeft, Printer } from "lucide-react"
import Image from "next/image"

export default function InvoicePage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const orderRes = await fetch(`/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!orderRes.ok) throw new Error("Failed to load order")
        const orderData = await orderRes.json()
        const ord = orderData.data
        setOrder(ord)

        if (ord?.companyId) {
          const compRes = await fetch(`/api/companies/${ord.companyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (compRes.ok) {
            const compData = await compRes.json()
            setCompany(compData.data)

            // Load customer from company userId
            const userId = compData.data?.userId
            if (userId) {
              const userRes = await fetch(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (userRes.ok) {
                const userData = await userRes.json()
                setCustomer(userData.data)
              }
            }
          }
        }
      } catch (err) {
        console.error("[v0] Invoice load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading invoice...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Invoice not found.</div>
      </div>
    )
  }

  // ── Data helpers ──────────────────────────────────────────────────────────

  const pricing = order?.pricing || {}
  const packagePrice = pricing.packagePrice ?? 0
  const stateFee = pricing.stateFilingFee ?? 0
  const addonsTotal = pricing.addonsTotal ?? 0
  const subtotal = packagePrice + stateFee + addonsTotal
  const discount = pricing.discount ?? 0
  const payment = pricing.payment ?? 0
  const balance = subtotal - discount - payment

  const paymentStatus = order?.paymentInfo?.status || "pending"
  const paymentStatusLabel =
    paymentStatus === "paid"
      ? "Paid"
      : paymentStatus === "pending_verification"
        ? "Pending Verification"
        : paymentStatus === "partial"
          ? "Partial Paid"
          : "Pending"

  const invoiceNumber = order?.id?.toUpperCase?.()?.slice(-8) || order?.id || "N/A"
  const invoiceDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A"

  const serviceType = company?.type
    ? `${company.state || ""} ${company.type} Formation`.trim()
    : order?.orderType || "LLC Formation"

  const selectedAddons: any[] = order?.selectedAddons || []

  // Table rows: base service + state fee + addons
  const lineItems = [
    {
      description: `${company?.state || ""} ${company?.type || "LLC"} Formation — ${(company?.packageType || order?.packageType || "Standard").split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Package`,
      qty: 1,
      rate: packagePrice,
      amount: packagePrice,
    },
    {
      description: `${company?.state || ""} State Filing Fee`,
      qty: 1,
      rate: stateFee,
      amount: stateFee,
    },
    ...selectedAddons.map((a: any) => ({
      description: typeof a === "object" ? a.name : a,
      qty: 1,
      rate: typeof a === "object" ? (a.price ?? 0) : 0,
      amount: typeof a === "object" ? (a.price ?? 0) : 0,
    })),
  ].filter((row) => row.amount > 0 || row.description)

  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <>
      {/* Top toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-[#ff0d13] text-white hover:bg-[#cc0a0f] transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Page background */}
      <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:p-0 print:py-0">
        {/* Invoice container */}
        <div
          className="bg-white mx-auto shadow-lg print:shadow-none"
          style={{ maxWidth: 880, fontFamily: "Arial, sans-serif" }}
        >
          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", padding: "36px 40px 20px" }}>
            <div style={{ marginBottom: 10 }}>
              <Image
                src="/images/buzz-filing-logo.png"
                alt="Buzz Filing"
                width={180}
                height={52}
                style={{ display: "inline-block", objectFit: "contain" }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
              <div>30 N Gould St, Ste R, Sheridan, WY 82801</div>
              <div>
                <a href="https://buzzfiling.com" style={{ color: "#555", textDecoration: "none" }}>
                  www.buzzfiling.com
                </a>
              </div>
              <div>
                <a href="mailto:support@buzzfiling.com" style={{ color: "#555", textDecoration: "none" }}>
                  support@buzzfiling.com
                </a>
                &nbsp;|&nbsp;
                <a href="mailto:info@buzzfiling.com" style={{ color: "#555", textDecoration: "none" }}>
                  info@buzzfiling.com
                </a>
              </div>
              <div>+1 (307) 555-0100 | +1 (307) 555-0101</div>
            </div>
          </div>

          {/* ── TITLE ──────────────────────────────────────────────────── */}
          <div style={{ padding: "0 40px 20px" }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1a1a1a", textAlign: "left" }}>
              <span style={{ color: "#ff0d13" }}>Hi!</span> This is Your Invoice.
            </h1>
          </div>

          {/* ── INVOICE INFO — 3 COL ───────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 0,
              padding: "0 40px 28px",
            }}
          >
            {/* Col 1: Bill To */}
            <div style={{ paddingRight: 20 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#999",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Bill To
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
                {customer?.name || "Client"}
              </div>
              {customer?.email && (
                <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>{customer.email}</div>
              )}
              {customer?.phone && (
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{customer.phone}</div>
              )}
            </div>

            {/* Col 2: Invoice details */}
            <div style={{ paddingRight: 20 }}>
              {[
                ["Invoice Number", `#${invoiceNumber}`],
                ["Invoice Date", invoiceDate],
                ["Service Type", serviceType],
                ["Invoice By", "Buzz Filing"],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#999",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Col 3: Payment Status box */}
            <div>
              <div
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  overflow: "hidden",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    background: "#ff0d13",
                    color: "white",
                    padding: "8px 16px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Payment Status
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  {paymentStatusLabel}
                </div>
              </div>
            </div>
          </div>

          {/* ── SERVICES TABLE ─────────────────────────────────────────── */}
          <div style={{ padding: "0 40px 28px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {["Description", "Qty", "Rate", "Amount"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: h === "Description" ? "left" : "right",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#555",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderBottom: "2px solid #e5e5e5",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td style={{ padding: "11px 14px", fontSize: 13, color: "#1a1a1a" }}>{row.description}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: "#555", textAlign: "right" }}>
                      {row.qty}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: "#555", textAlign: "right" }}>
                      {fmt(row.rate)}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1a1a1a", textAlign: "right" }}>
                      {fmt(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── TOTALS ─────────────────────────────────────────────────── */}
          <div style={{ padding: "0 40px 32px", display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                background: "#1a1a1a",
                color: "white",
                borderRadius: 10,
                padding: "20px 28px",
                minWidth: 240,
              }}
            >
              {[
                ["Sub Total", fmt(subtotal), false],
                ["Discount", fmt(discount), false],
                ["Payment", fmt(payment), false],
              ].map(([label, value, bold]) => (
                <div
                  key={label as string}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    paddingBottom: 10,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Balance
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#ff6b6b" }}>{fmt(balance)}</span>
              </div>
            </div>
          </div>

          {/* ── THANK YOU ──────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", padding: "0 40px 20px" }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
              Thank you for your{" "}
              <span style={{ color: "#ff0d13" }}>business!</span>
            </p>
          </div>

          {/* ── PAYMENT TERMS ──────────────────────────────────────────── */}
          {order?.paymentInfo?.terms && (
            <div style={{ padding: "0 40px 20px" }}>
              <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>
                {order.paymentInfo.terms}
              </p>
            </div>
          )}

          {/* ── BANK INFO ──────────────────────────────────────────────── */}
          <div style={{ padding: "0 40px 32px" }}>
            <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#999",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Pay Bank
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                {[
                  ["Account Title", "Buzz Filing LLC"],
                  ["Account Number", "XXXX-XXXX-XXXX"],
                  ["Bank Name", "Bank of America"],
                  ["Branch", "Sheridan, WY"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>{label}: </span>
                    <span style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <div
            style={{
              background: "#ff0d13",
              padding: "14px 40px",
              display: "flex",
              justifyContent: "center",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {[
              "www.buzzfiling.com",
              "support@buzzfiling.com",
              "+1 (307) 555-0100",
              "+1 (307) 555-0101",
            ].map((item) => (
              <span key={item} style={{ color: "white", fontSize: 12, fontWeight: 500 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  )
}
