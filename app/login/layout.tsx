import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login to Your Account | BuzzFiling Client Portal",
  description:
    "Access your BuzzFiling client dashboard. Manage your US LLC, track formation progress, download documents, and access business compliance tools.",
  keywords: [
    "BuzzFiling login",
    "client portal access",
    "LLC dashboard",
    "business account login",
    "manage US company"
  ],
  openGraph: {
    title: "Login | BuzzFiling Client Portal",
    description: "Sign in to access your BuzzFiling dashboard and manage your US business",
    type: "website",
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
