import type React from "react"
import { Unbounded } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { CompanyProvider } from "@/components/client/company-provider"

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
})

export const metadata = {
  title: "BuzzFiling - Business Formation Made Simple",
  description: "Professional business formation services with transparent pricing and comprehensive guidance",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={unbounded.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <CompanyProvider>{children}</CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
