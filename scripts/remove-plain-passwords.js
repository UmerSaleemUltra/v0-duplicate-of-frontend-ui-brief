/**
 * One-time cleanup script: removes the `plainPassword` field from all
 * documents in the `users` collection.
 *
 * Run with: node scripts/remove-plain-passwords.js
 * Requires MONGODB_URI to be set in the environment.
 */

import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.")
  process.exit(1)
}

async function removePlainPasswords() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB.")

    const db = client.db()
    const usersCollection = db.collection("users")

    // Count how many documents have the plainPassword field
    const count = await usersCollection.countDocuments({ plainPassword: { $exists: true } })
    console.log(`Found ${count} user(s) with a plainPassword field.`)

    if (count === 0) {
      console.log("Nothing to clean up. Exiting.")
      return
    }

    // Remove the plainPassword field from all affected documents
    const result = await usersCollection.updateMany(
      { plainPassword: { $exists: true } },
      { $unset: { plainPassword: "" } }
    )

    console.log(`Successfully removed plainPassword from ${result.modifiedCount} user document(s).`)
  } catch (error) {
    console.error("Script failed:", error)
    process.exit(1)
  } finally {
    await client.close()
    console.log("MongoDB connection closed.")
  }
}

removePlainPasswords()
