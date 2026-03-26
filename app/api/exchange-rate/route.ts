import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      rate: data.rates.PKR,
    })
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
