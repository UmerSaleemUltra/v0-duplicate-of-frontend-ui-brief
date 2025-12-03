"use client"

import { useEffect, useRef, useState } from "react"

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

        // Listen for custom events
        listenersRef.current.forEach((callbacks, event) => {
          es.addEventListener(event, (e: any) => {
            try {
              const data = JSON.parse(e.data)
              callbacks.forEach((callback) => callback(data))
            } catch (error) {}
          })
        })

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

  const on = (event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    listenersRef.current.get(event)!.add(callback)

    return () => {
      const callbacks = listenersRef.current.get(event)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          listenersRef.current.delete(event)
        }
      }
    }
  }

  return { isConnected, on }
}
