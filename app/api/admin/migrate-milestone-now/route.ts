import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'

/**
 * One-time migration endpoint
 * Adds companyApplicationApplied milestone to all existing companies
 * WITHOUT notifications
 * 
 * Usage: POST /api/admin/migrate-milestone-now
 */

export async function POST(request: NextRequest) {
  try {
    // Get admin auth check if your app requires it
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.includes('Bearer')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await connectToDatabase()
    const companiesCollection = db.collection('companies')

    // Bulk update all companies that don't have this milestone yet
    const result = await companiesCollection.updateMany(
      {
        'milestones.companyApplicationApplied': { $exists: false }
      },
      {
        $set: {
          'milestones.companyApplicationApplied': true,
          'updatedAt': new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[Migration Error]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}
