import { Db } from "mongodb"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export interface AbandonedCheckout {
  _id?: string
  sessionId: string
  email: string | null
  name: string | null
  phone: string | null
  phoneNormalized: string | null
  lastStep: number
  state: string | null
  packageType: string | null
  businessName: string | null
  estimatedTotal: number
  packagePrice: number
  addons: string[]
  recovered: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Records an abandoned checkout for a user, always updating a single document
 * per person instead of creating a new one on every visit or step.
 *
 * Identity is resolved in priority order:
 *   1. email (normalized)  — strongest, survives new browser sessions
 *   2. phone (digits only) — fallback before an email is entered
 *   3. sessionId           — fallback for anonymous early steps
 *
 * Fields are merged progressively: a later visit that fills more steps adds to
 * the existing document, and empty/missing values never overwrite data that was
 * already captured on an earlier visit.
 */
export async function deduplicateAbandonedCheckout(
  db: Db,
  sessionId: string,
  email: string | null,
  data: {
    name?: string | null
    phone?: string | null
    lastStep?: number
    state?: string | null
    packageType?: string | null
    businessName?: string | null
    estimatedTotal?: number
    packagePrice?: number
    addons?: string[]
  }
): Promise<void> {
  const now = new Date()
  const collection = db.collection("abandoned_checkouts")

  // Normalize identifiers for reliable matching
  const normalizedEmail = email ? email.trim().toLowerCase() : null
  const normalizedPhone = data.phone ? data.phone.replace(/\D/g, "") : null

  // Resolve the same user across visits/sessions, preferring the strongest id.
  let existing = null
  if (normalizedEmail) {
    existing = await collection.findOne({ email: normalizedEmail })
  }
  if (!existing && normalizedPhone) {
    existing = await collection.findOne({ phoneNormalized: normalizedPhone })
  }
  if (!existing) {
    existing = await collection.findOne({ sessionId })
  }

  // Progressive merge: only write values that carry real information so a later
  // step never wipes details captured earlier.
  const setFields: Record<string, unknown> = {
    sessionId,
    recovered: false,
    updatedAt: now,
  }
  if (normalizedEmail) setFields.email = normalizedEmail
  if (data.name) setFields.name = data.name
  if (data.phone) {
    setFields.phone = data.phone
    setFields.phoneNormalized = normalizedPhone
  }
  if (data.state) setFields.state = data.state
  if (data.packageType) setFields.packageType = data.packageType
  if (data.businessName) setFields.businessName = data.businessName
  if (data.estimatedTotal) setFields.estimatedTotal = data.estimatedTotal
  if (data.packagePrice) setFields.packagePrice = data.packagePrice
  if (data.addons && data.addons.length > 0) setFields.addons = data.addons
  // Keep the furthest step the user reached rather than regressing on re-entry.
  if (typeof data.lastStep === "number") {
    setFields.lastStep = Math.max(existing?.lastStep ?? 0, data.lastStep)
  }

  if (existing) {
    await collection.updateOne({ _id: existing._id }, { $set: setFields })
    console.log("[v0] Abandoned checkout updated existing document:", {
      id: String(existing._id),
      email: normalizedEmail,
      sessionId,
    })
  } else {
    await collection.insertOne({
      sessionId,
      email: normalizedEmail,
      name: data.name || null,
      phone: data.phone || null,
      phoneNormalized: normalizedPhone,
      lastStep: data.lastStep ?? 0,
      state: data.state || null,
      packageType: data.packageType || null,
      businessName: data.businessName || null,
      estimatedTotal: data.estimatedTotal || 0,
      packagePrice: data.packagePrice || 0,
      addons: data.addons || [],
      recovered: false,
      createdAt: now,
      updatedAt: now,
    })
    console.log("[v0] Abandoned checkout created new document:", { email: normalizedEmail, sessionId })
  }
}

/**
 * Gets abandoned checkout by email.
 * Returns null if not found.
 */
export async function getAbandonedCheckoutByEmail(
  db: Db,
  email: string
): Promise<AbandonedCheckout | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const checkout = await db.collection("abandoned_checkouts").findOne({
    email: { $regex: `^${normalizedEmail}$`, $options: "i" }
  })
  return (checkout as unknown as AbandonedCheckout) || null
}

/**
 * Checks if user has a completed order in the companies collection.
 * Returns true if user has at least one company/order.
 */
export async function checkIfUserHasCompletedOrder(db: Db, email: string): Promise<boolean> {
  // Query users collection to get userId by email
  const user = await db.collection("users").findOne({ email })

  if (!user) {
    return false
  }

  // Check if user has any companies (completed orders)
  const company = await db.collection("companies").findOne({ userId: user._id.toString() })

  return !!company
}

/**
 * Removes abandoned checkout by email.
 * Called after user places an order.
 * Also broadcasts removal event for real-time UI updates.
 */
export async function removeAbandonedCheckout(db: Db, email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  console.log("[v0] Attempting to remove abandoned checkout for email:", normalizedEmail)
  
  // Use case-insensitive regex for email matching
  const result = await db.collection("abandoned_checkouts").deleteOne({
    email: { $regex: `^${normalizedEmail}$`, $options: "i" }
  })

  console.log("[v0] Removal result:", { email: normalizedEmail, deletedCount: result.deletedCount })

  if (result.deletedCount > 0) {
    console.log("[v0] Abandoned checkout removed for email:", normalizedEmail)

    // Broadcast real-time event
    try {
      broadcastUpdate("abandoned_checkouts", "removed", { email: normalizedEmail })
    } catch (broadcastError) {
      console.warn("[v0] Failed to broadcast abandoned checkout removal:", broadcastError)
      // Non-fatal — broadcast failure should not block the main flow
    }
  } else {
    console.warn("[v0] No abandoned checkout found to remove for email:", normalizedEmail)
    
    // Debug: try to find if record exists with any casing
    const existing = await db.collection("abandoned_checkouts").findOne({
      email: { $regex: `^${normalizedEmail}$`, $options: "i" }
    })
    if (existing) {
      console.log("[v0] Record exists but delete failed. Record:", existing)
    }
  }
}

/**
 * Removes all abandoned checkouts for a given user (by userId).
 * Used when user completes their first order.
 */
export async function removeAllAbandonedCheckoutsForUser(db: Db, userId: string): Promise<void> {
  // Get user's email
  const user = await db.collection("users").findOne({ _id: userId })

  if (user && user.email) {
    await removeAbandonedCheckout(db, user.email)
  }
}
