"use client"

import { useEffect } from "react"
import { ClientShell } from "@/components/client/client-shell"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()

  useEffect(() => {
    router.push("/client/dashboard")
  }, [router])

  return (
    <ClientShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Feature Removed</h2>
          <p className="text-slate-600">Invoices have been removed from this system.</p>
        </div>
      </div>
    </ClientShell>
  )
}
