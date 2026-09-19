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

      // Listen for all realtime events with proper resource subscription
      const resources = ["orders", "companies", "documents", "mail", "notifications", "users", "passports", "addons", "promo-codes"]
      const unsubscribers: Array<() => void> = []

      resources.forEach((resource) => {
        // Subscribe to all actions (created, updated, deleted) for this resource
        const unsubscribe = broadcaster.subscribeToResource(resource, (eventData) => {
          const message = `data: ${JSON.stringify(eventData)}\n\n`
          try {
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            // Client disconnected, will be cleaned up
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
