import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase()
    const companiesCollection = db.collection('companies')

    const result = await companiesCollection.updateMany(
      {},
      {
        $set: {
          'milestones.companyApplicationApplied': true,
          'updatedAt': new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: `Completed "Company Application Submitted" milestone for all companies`,
      stats: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to complete milestone', details: String(error) },
      { status: 500 }
    )
  }
}
