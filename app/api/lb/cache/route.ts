import { NextRequest, NextResponse } from 'next/server'
import { advancedCache } from '@/lib/load-balancer'

/**
 * Cache Management Endpoint
 * GET /api/lb/cache/stats
 * DELETE /api/lb/cache - Clear all cache
 * POST /api/lb/cache/invalidate-tag - Invalidate by tag
 */

export async function GET(req: NextRequest) {
  try {
    const stats = advancedCache.getStats()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cache: {
        ...stats,
        utilizationPercent: Math.round((stats.localCacheSize / stats.maxLocalSize) * 100),
      },
    })
  } catch (error) {
    console.error('[Cache Stats] Error:', error)

    return NextResponse.json(
      { error: 'Failed to retrieve cache stats' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await advancedCache.clear()

    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cache Clear] Error:', error)

    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tag } = body

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag is required' },
        { status: 400 }
      )
    }

    await advancedCache.invalidateByTag(tag)

    return NextResponse.json({
      message: `Cache invalidated for tag: ${tag}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cache Invalidate] Error:', error)

    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}
