import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { sseManager } from "@/lib/realtime/sse-manager"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()
const REALTIME_EVENTS_KEY = "buzzfiling:realtime:events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Try to get token from Authorization header first, then from query parameter
  const authHeader = req.headers.get("authorization")
  let token = authHeader?.replace("Bearer ", "")
  
  if (!token) {
    const url = new URL(req.url)
    token = url.searchParams.get("token") || undefined
  }

  if (!token) {
    return new Response("Unauthorized", { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return new Response("Invalid token", { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      const clientId = sseManager.addClient(decoded.userId, controller)
      let seenEventIds = new Set<string>()
      let pollTimer: NodeJS.Timeout | null = null

      controller.enqueue(`data: ${JSON.stringify({ type: "connected", userId: decoded.userId })}\n\n`)

      const pollRedis = async () => {
        try {
          const events = await redis.lrange<string>(REALTIME_EVENTS_KEY, 0, 24)
          for (const rawEvent of events.reverse()) {
            const event = typeof rawEvent === "string" ? JSON.parse(rawEvent) : rawEvent
            if (!event?.id || seenEventIds.has(event.id)) continue
            seenEventIds.add(event.id)
            controller.enqueue(`data: ${JSON.stringify(event)}\n\n`)
          }
          if (seenEventIds.size > 200) seenEventIds = new Set(Array.from(seenEventIds).slice(-100))
        } catch {
          // The in-process broadcaster remains active if Redis polling fails.
        }
        pollTimer = setTimeout(pollRedis, 1500)
      }
      void pollRedis()

      req.signal.addEventListener("abort", () => {
        sseManager.removeClient(clientId)
        if (pollTimer) clearTimeout(pollTimer)
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
