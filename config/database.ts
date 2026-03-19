import { MongoClient, type Db } from "mongodb"

const MONGODB_URI =
  "mongodb+srv://Buzzfiling:2668@cluster0.ewwkzzw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_DB = "llc_formation"

// Use a module-level promise to prevent multiple simultaneous connection attempts
// (critical for serverless environments where concurrent cold-starts race)
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
