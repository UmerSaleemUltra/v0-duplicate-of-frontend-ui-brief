"use client"
export const dynamic = "force-dynamic"

import { Suspense, lazy } from "react"
import { ClientShell } from "@/components/client/client-shell"

const AddonCheckoutContent = lazy(() => import("./checkout-content"))

export default function Page() {
  return (
    <ClientShell>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading checkout...</div>}>
        <AddonCheckoutContent />
      </Suspense>
    </ClientShell>
  )
}
