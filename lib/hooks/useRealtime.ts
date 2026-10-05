"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useRealtime(token: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  useEffect(() => {
    if (!token) return

    const connect = () => {
      try {
        const es = new EventSource(`/api/realtime?token=${token}`)

        es.onopen = () => {
          setIsConnected(true)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        }

        es.onerror = () => {
          setIsConnected(false)
          es.close()
          // Reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 5000)
        }

        const dispatchEvent = (eventName: string, data: unknown) => {
          listenersRef.current.get(eventName)?.forEach((callback) => callback(data))
        }

        // The server sends standard SSE messages. Route resource/action events to listeners.
        es.onmessage = (message) => {
          try {
            const data = JSON.parse(message.data)
            if (data?.resource && data?.action) {
              dispatchEvent(`${data.resource}:${data.action}`, data)
            }
            if (data?.type) dispatchEvent(data.type, data)
          } catch {
            // Ignore malformed keepalive messages.
          }
        }

        eventSourceRef.current = es
      } catch (error) {
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [token])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    listenersRef.current.get(event)!.add(callback)

    return () => {
      const callbacks = listenersRef.current.get(event)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) listenersRef.current.delete(event)
      }
    }
  }, [])

  return { isConnected, on }
}
