import { NextResponse } from "next/server"
import { redisCache } from "@/lib/redis-cache"

export async function GET() {
  try {
    // Generate cache key
    const cacheKey = 'exchange:rate:usd-pkr'
    
    // Try to get from cache first
    const cachedData = await redisCache.get(cacheKey)
    if (cachedData) {
      console.log('[v0] Exchange rate served from cache')
      return NextResponse.json(cachedData)
    }

    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate")
    }

    const data = await response.json()

    const result = {
      success: true,
      rate: data.rates.PKR,
    }

    // Cache for 1 hour (3600 seconds)
    await redisCache.set(cacheKey, result, 3600)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch exchange rate",
      },
      { status: 500 },
    )
  }
}
