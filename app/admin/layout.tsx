import type React from "react"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        #whatsapp-chat-widget,
        #wati-chat-widget,
        .wati-chat-widget,
        .whatsapp-chat-button,
        [id^="wati"],
        [class^="wati"],
        [id*="whatsapp-widget"],
        [class*="whatsapp-widget"] {
          display: none !important;
        }
      `}</style>
      <AdminShell>{children}</AdminShell>
    </>
  )
}
