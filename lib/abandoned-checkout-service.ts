import { Db } from "mongodb"
import { broadcastUpdate } from "@/lib/realtime/broadcaster"

export interface AbandonedCheckout {
  _id?: string
  sessionId: string
  email: string | null
  name: string | null
  phone: string | null
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
 * Deduplicates abandoned checkout by email + sessionId.
 * If record exists, updates it; otherwise creates new record.
 * This prevents duplicate entries for the same user/session.
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
  // Normalize email to lowercase for consistency
  const normalizedEmail = email ? email.trim().toLowerCase() : null

  const checkoutData = {
    sessionId,
    email: normalizedEmail,
    name: data.name || null,
    phone: data.phone || null,
    lastStep: data.lastStep ?? 0,
    state: data.state || null,
    packageType: data.packageType || null,
    businessName: data.businessName || null,
    estimatedTotal: data.estimatedTotal || 0,
    packagePrice: data.packagePrice || 0,
    addons: data.addons || [],
    recovered: false,
    updatedAt: now,
  }

  // Upsert by email + sessionId combination
  await db.collection("abandoned_checkouts").updateOne(
    { email: normalizedEmail, sessionId },
    {
      $set: checkoutData,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  )

  console.log("[v0] Abandoned checkout deduplicated:", { email: normalizedEmail, sessionId })
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
  return (checkout as AbandonedCheckout) || null
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
