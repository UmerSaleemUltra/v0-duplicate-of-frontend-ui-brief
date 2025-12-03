import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { sseManager } from "@/lib/realtime/sse-manager"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

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

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", userId: decoded.userId })}\n\n`)

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        sseManager.removeClient(clientId)
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
