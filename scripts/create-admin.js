import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://umer:171175@cluster0.zbqcm.mongodb.net/llc_formation?retryWrites=true&w=majority&appName=Cluster0"

async function createAdmin() {
  console.log("[v0] Connecting to MongoDB...")
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("[v0] Connected to MongoDB")

    const db = client.db("llc_formation")
    const usersCollection = db.collection("users")

    console.log("[v0] Checking for existing admin user...")

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@buzzfiling.com" })

    if (existingAdmin) {
      console.log("[v0] Admin user already exists!")
      console.log("Admin ID:", existingAdmin._id.toString())
      console.log("Email: admin@buzzfiling.com")
      console.log("Password: admin123")
      console.log("\nYou can now login with these credentials at /login")
      return
    }

    console.log("[v0] No admin found, creating new admin user...")

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10)
    console.log("[v0] Password hashed successfully")

    // Create admin user
    const adminUser = {
      name: "BuzzFiling Admin",
      email: "admin@buzzfiling.com",
      phone: "+1234567890",
      password: hashedPassword,
      role: "admin",
      accountStatus: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] Inserting admin user into database...")
    const result = await usersCollection.insertOne(adminUser)

    console.log("\n✅ [v0] Admin user created successfully!")
    console.log("==========================================")
    console.log("Admin ID:", result.insertedId.toString())
    console.log("Email: admin@buzzfiling.com")
    console.log("Password: admin123")
    console.log("Role: admin")
    console.log("==========================================")
    console.log("\nYou can now login at: /login")
  } catch (error) {
    console.error("\n❌ [v0] Error creating admin:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    throw error
  } finally {
    await client.close()
    console.log("\n[v0] Database connection closed")
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[v0] Failed to create admin:", error)
    process.exit(1)
  })
