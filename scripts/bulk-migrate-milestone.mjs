#!/usr/bin/env node

/**
 * Bulk Migration Script
 * Updates all existing companies with the companyApplicationApplied milestone
 * WITHOUT sending any notifications
 * 
 * Usage: node scripts/bulk-migrate-milestone.mjs
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'filings'
const COLLECTION_NAME = 'companies'

async function migrateCompanies() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('[Migration] Connecting to MongoDB...')
    await client.connect()
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    console.log('[Migration] Starting bulk update...')
    
    // Update all companies that don't have the companyApplicationApplied milestone
    const result = await collection.updateMany(
      {
        'milestones.companyApplicationApplied': { $exists: false }
      },
      {
        $set: {
          'milestones.companyApplicationApplied': true
        }
      }
    )

    console.log('\n✓ Migration Complete!')
    console.log(`  - Matched companies: ${result.matchedCount}`)
    console.log(`  - Updated companies: ${result.modifiedCount}`)
    console.log(`  - Timestamp: ${new Date().toISOString()}`)

    if (result.modifiedCount > 0) {
      console.log('\n✓ All companies now have the companyApplicationApplied milestone')
      console.log('✓ No notifications were sent to customers')
    } else {
      console.log('\n! No companies needed updating (all already have the milestone)')
    }

  } catch (error) {
    console.error('[Migration] Error:', error.message)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n[Migration] Database connection closed')
  }
}

migrateCompanies()
