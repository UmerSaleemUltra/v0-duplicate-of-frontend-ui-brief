import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Buzzfiling:2668@cluster0.ewwkzzw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

async function createAdmin() {
  console.log(" Connecting to MongoDB...")
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log(" Connected to MongoDB")

    const db = client.db("llc_formation")
    const usersCollection = db.collection("users")

    console.log(" Checking for existing admin user...")

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@buzzfiling.com" })

    if (existingAdmin) {
      console.log(" Admin user already exists!")
      console.log("Admin ID:", existingAdmin._id.toString())
      console.log("Email: admin@buzzfiling.com")
      console.log("Password: admin123")
      console.log("\nYou can now login with these credentials at /login")
      return
    }

    console.log(" No admin found, creating new admin user...")

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10)
    console.log(" Password hashed successfully")

    // Create admin user
    const adminUser = {
      name: "BuzzFiling Admin",
      email: "admin@buzzfiling.com",
      phone: "+1234567890",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log(" Inserting admin user into database...")
    const result = await usersCollection.insertOne(adminUser)

    console.log("\n✅  Admin user created successfully!")
    console.log("==========================================")
    console.log("Admin ID:", result.insertedId.toString())
    console.log("Email: admin@buzzfiling.com")
    console.log("Password: admin123")
    console.log("Role: admin")
    console.log("==========================================")
    console.log("\nYou can now login at: /login")
  } catch (error) {
    console.error("\n❌  Error creating admin:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    throw error
  } finally {
    await client.close()
    console.log("\n Database connection closed")
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Failed to create admin:", error)
    process.exit(1)
  })
