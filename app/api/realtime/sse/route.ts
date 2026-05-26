import type { NextRequest } from "next/server"
import { broadcaster } from "@/lib/realtime/broadcaster"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Listen for all realtime events
      const events = ["orders", "companies", "documents", "mail", "notifications", "users", "passports", "addons", "promo-codes"]
      const unsubscribers: Array<() => void> = []

      events.forEach((resource) => {
        const unsubscribe = broadcaster.subscribe(`${resource}:*`, (eventData) => {
          const message = `data: ${JSON.stringify(eventData)}\n\n`
          try {
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            // Client disconnected
          }
        })
        unsubscribers.push(unsubscribe)
      })

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        unsubscribers.forEach((unsub) => unsub())
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
