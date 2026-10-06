"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/auth/auth-provider"
import { useRealtime } from "@/lib/hooks/useRealtime"

const realtimeResources = [
  "companies",
  "customers",
  "documents",
  "orders",
  "notifications",
  "promo-codes",
  "blog",
  "addons",
  "users",
] as const

export function RealtimeQuerySync({ token }: { token: string | null }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { on } = useRealtime(token)

  useEffect(() => {
    if (!user) return

    const cleanups = realtimeResources.flatMap((resource) =>
      ["created", "updated", "deleted"].map((action) =>
        on(`${resource}:${action}`, (event: { resource?: string }) => {
          queryClient.invalidateQueries({ queryKey: [event.resource || resource] })
        }),
      ),
    )

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [on, queryClient, user])

  return null
}
