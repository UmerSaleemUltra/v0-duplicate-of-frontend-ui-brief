import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = "mongodb+srv://umer:171175@cluster0.zbqcm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_DB = "llc_formation"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(MONGODB_URI)
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
