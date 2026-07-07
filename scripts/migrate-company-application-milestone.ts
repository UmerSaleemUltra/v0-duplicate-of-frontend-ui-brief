/**
 * Migration Script: Add Company Application Applied Milestone
 * 
 * This script silently updates all existing companies to mark the
 * companyApplicationApplied milestone as true, without triggering
 * any notifications. This is a one-time migration for existing orders.
 * 
 * Run with: npx ts-node scripts/migrate-company-application-milestone.ts
 */

import { connectDB, getDatabase } from "@/config/database"

async function migrateCompanyApplicationMilestone() {
  try {
    console.log("[Migration] Starting Company Application Milestone migration...")
    
    const db = await getDatabase()
    const companiesCollection = db.collection("companies")

    // Silently update all companies that don't have this milestone set
    // Set companyApplicationApplied to true for all existing companies
    const result = await companiesCollection.updateMany(
      {
        // Filter: companies that either don't have milestones or don't have this specific milestone
        $or: [
          { milestones: { $exists: false } },
          { "milestones.companyApplicationApplied": { $exists: false } }
        ]
      },
      {
        $set: {
          "milestones.companyApplicationApplied": true
        }
      }
    )

    console.log(`[Migration] Updated ${result.modifiedCount} companies`)
    console.log(`[Migration] Matched ${result.matchedCount} companies`)

    if (result.modifiedCount > 0) {
      console.log("[Migration] ✓ Migration completed successfully!")
      console.log("[Migration] All existing companies now have companyApplicationApplied milestone set to true")
    } else {
      console.log("[Migration] No companies needed updating (they may already have this milestone)")
    }

    process.exit(0)
  } catch (error) {
    console.error("[Migration] Error during migration:", error)
    process.exit(1)
  }
}

migrateCompanyApplicationMilestone()
