import { NextRequest, NextResponse } from 'next/server'
import { queueManager } from '@/lib/load-balancer'

/**
 * Queue Status Endpoint
 * GET /api/lb/queue/status/:requestId
 * POST /api/lb/queue/process - Process next queued request
 */

export async function GET(req: NextRequest) {
  try {
    const stats = await queueManager.getStats()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      queue: {
        pending: stats.pending,
        processing: stats.processing,
        failed: stats.failed,
        completed: stats.completed,
        avgWaitTime: Math.round(stats.avgWaitTime),
      },
    })
  } catch (error) {
    console.error('[Queue Status] Error:', error)

    return NextResponse.json(
      { error: 'Failed to retrieve queue status' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Dequeue next priority request
    const request = await queueManager.dequeue(3) // Start with highest priority

    if (!request) {
      // Try lower priorities
      for (let priority = 2; priority >= 0; priority--) {
        const req = await queueManager.dequeue(priority)
        if (req) {
          return NextResponse.json({
            request: req,
            message: 'Queued request dequeued for processing',
          })
        }
      }

      return NextResponse.json(
        { message: 'No queued requests' },
        { status: 204 }
      )
    }

    return NextResponse.json({
      request,
      message: 'Request ready for processing',
    })
  } catch (error) {
    console.error('[Queue Process] Error:', error)

    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    )
  }
}
