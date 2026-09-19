import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login to Your Account | Buzz Filing Client Portal",
  description:
    "Access your Buzz Filing client dashboard. Manage your US LLC, track formation progress, download documents, and access business compliance tools.",
  keywords: [
    "Buzz Filing login",
    "client portal access",
    "LLC dashboard",
    "business account login",
    "manage US company"
  ],
  openGraph: {
    title: "Login | Buzz Filing Client Portal",
    description: "Sign in to access your Buzz Filing dashboard and manage your US business",
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
