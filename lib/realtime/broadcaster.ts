import { EventEmitter } from "events"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()
const REALTIME_EVENTS_KEY = "buzzfiling:realtime:events"

class RealtimeBroadcaster extends EventEmitter {
  private static instance: RealtimeBroadcaster

  private constructor() {
    super()
    this.setMaxListeners(100)
  }

  static getInstance(): RealtimeBroadcaster {
    if (!RealtimeBroadcaster.instance) {
      RealtimeBroadcaster.instance = new RealtimeBroadcaster()
    }
    return RealtimeBroadcaster.instance
  }

  broadcast(event: string, data: any) {
    this.emit(event, data)
  }

  subscribe(event: string, callback: (data: any) => void) {
    this.on(event, callback)
    return () => this.off(event, callback)
  }

  subscribeToResource(resource: string, callback: (data: any) => void) {
    const createdUnsub = this.subscribe(`${resource}:created`, callback)
    const updatedUnsub = this.subscribe(`${resource}:updated`, callback)
    const deletedUnsub = this.subscribe(`${resource}:deleted`, callback)
    
    return () => {
      createdUnsub()
      updatedUnsub()
      deletedUnsub()
    }
  }
}

export const broadcaster = RealtimeBroadcaster.getInstance()

export function broadcastUpdate(resource: string, action: string, data: any) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    resource,
    action,
    data,
    timestamp: new Date().toISOString(),
  }

  broadcaster.broadcast(`${resource}:${action}`, event)
  void redis.lpush(REALTIME_EVENTS_KEY, JSON.stringify(event)).then(() => redis.ltrim(REALTIME_EVENTS_KEY, 0, 99)).catch(() => {
    // Local SSE remains the fallback when Redis is unavailable.
  })
}

export function broadcast(event: string, data: any) {
  broadcaster.broadcast(event, data)
}
