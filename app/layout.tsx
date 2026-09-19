import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AppProviders } from "@/components/app-providers"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://buzzfiling.com"),
  title: "Buzz Filing",
  description: "Business formation services from Buzz Filing.",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
