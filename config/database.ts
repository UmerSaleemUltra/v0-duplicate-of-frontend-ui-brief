import { MongoClient, type Db } from "mongodb"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Buzzfiling:2668@cluster0.ewwkzzw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_DB = process.env.MONGODB_DB || "llc_formation"

// Module-level cached promise — one connection shared across all serverless invocations
// on the same warm instance, eliminating redundant cold-start TCP handshakes.
let clientPromise: Promise<MongoClient> | null = null
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      // Compress wire traffic between app and Atlas — reduces bandwidth ~3-5x on large reads
      compressors: ["zlib"],
    })
  }
  return clientPromise
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await getClientPromise()
  const db = client.db(MONGODB_DB)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase()
  return db
}

export const connectDB = connectToDatabase

/**
 * Call once at app startup (e.g. in a server action or admin route).
 * Creates compound indexes on the hottest query paths so MongoDB uses
 * index scans instead of full collection scans — typically 10-100x faster
 * on collections with >1000 documents.
 */ers
export async function ensureIndexes(): Promise<void> {
  try {
    const db = await getDatabase()

    await Promise.all([
      // Notifications: most queries filter by userId + sort by createdAt
      db.collection("notifications").createIndex(
        { userId: 1, createdAt: -1 },
        { background: true, name: "idx_notifications_user_date" }
      ),
      // Notifications: unread count query
      db.collection("notifications").createIndex(
        { userId: 1, read: 1 },
        { background: true, name: "idx_notifications_user_read" }
      ),
      // Orders: admin list sorted by date
      db.collection("orders").createIndex(
        { createdAt: -1 },
        { background: true, name: "idx_orders_date" }
      ),
      // Orders: per-user lookup
      db.collection("orders").createIndex(
        { userId: 1, createdAt: -1 },
        { background: true, name: "idx_orders_user_date" }
      ),
      // Users: login by email (must be unique)
      db.collection("users").createIndex(
        { email: 1 },
        { background: true, unique: true, name: "idx_users_email" }
      ),
      // Blog: slug lookup (public blog pages)
      db.collection("blog_posts").createIndex(
        { slug: 1 },
        { background: true, unique: true, sparse: true, name: "idx_blog_slug" }
      ),
      // Blog: list sorted by publishedAt
      db.collection("blog_posts").createIndex(
        { status: 1, publishedAt: -1 },
        { background: true, name: "idx_blog_status_date" }
      ),
      // Documents: per-user + per-order lookups
      db.collection("documents").createIndex(
        { userId: 1 },
        { background: true, name: "idx_documents_user" }
      ),
      db.collection("documents").createIndex(
        { orderId: 1 },
        { background: true, name: "idx_documents_order" }
      ),
      // Promo codes: unique code lookup
      db.collection("promo_codes").createIndex(
        { code: 1 },
        { background: true, unique: true, name: "idx_promo_codes_code" }
      ),
      // Abandoned checkouts: email + sessionId deduplication (compound index)
      db.collection("abandoned_checkouts").createIndex(
        { email: 1, sessionId: 1 },
        { background: true, name: "idx_abandoned_checkouts_email_session" }
      ),
      // Abandoned checkouts: email-based removal lookup
      db.collection("abandoned_checkouts").createIndex(
        { email: 1 },
        { background: true, name: "idx_abandoned_checkouts_email" }
      ),
      // Abandoned checkouts: auto-expiration after 90 days
      db.collection("abandoned_checkouts").createIndex(
        { createdAt: 1 },
        { background: true, expireAfterSeconds: 7776000, name: "idx_abandoned_checkouts_ttl" }
      ),
    ])
  } catch {
    // Non-fatal — indexes may already exist or Atlas free tier limits apply
  }
}