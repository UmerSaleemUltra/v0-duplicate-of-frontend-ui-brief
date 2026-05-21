import { getDatabase } from "@/config/database"
import { randomBytes } from "crypto"

const TOKEN_EXPIRY_MINUTES = 30 // Token valid for 30 minutes

interface CheckoutToken {
  token: string
  email: string
  createdAt: Date
  expiresAt: Date
  used: boolean
}

/**
 * Generates a secure checkout token that must be used for signup
 * This prevents direct API calls to /api/auth/signup without going through checkout
 */
export async function generateCheckoutToken(email: string): Promise<string> {
  const db = await getDatabase()
  const tokensCollection = db.collection("checkout_tokens")

  // Generate a secure random token
  const token = randomBytes(32).toString("hex")

  const now = new Date()
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

  // Store the token in database
  await tokensCollection.insertOne({
    token,
    email: email.toLowerCase().trim(),
    createdAt: now,
    expiresAt,
    used: false,
  })

  // Clean up old expired tokens (non-blocking)
  tokensCollection.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { used: true, createdAt: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } }, // Delete used tokens after 1 hour
    ],
  }).catch(console.error)

  return token
}

/**
 * Verifies a checkout token is valid and matches the email
 */
export async function verifyCheckoutToken(
  token: string,
  email: string
): Promise<{ valid: boolean; error?: string }> {
  if (!token || !email) {
    return { valid: false, error: "Missing token or email" }
  }

  const db = await getDatabase()
  const tokensCollection = db.collection("checkout_tokens")

  const tokenDoc = await tokensCollection.findOne({
    token,
    email: email.toLowerCase().trim(),
  })

  if (!tokenDoc) {
    return { valid: false, error: "Invalid checkout token" }
  }

  if (tokenDoc.used) {
    return { valid: false, error: "This checkout session has already been used" }
  }

  if (new Date() > new Date(tokenDoc.expiresAt)) {
    return { valid: false, error: "Checkout session expired. Please restart checkout." }
  }

  return { valid: true }
}

/**
 * Invalidates a checkout token after successful signup
 */
export async function invalidateCheckoutToken(token: string): Promise<void> {
  const db = await getDatabase()
  const tokensCollection = db.collection("checkout_tokens")

  await tokensCollection.updateOne(
    { token },
    { $set: { used: true, usedAt: new Date() } }
  )
}
