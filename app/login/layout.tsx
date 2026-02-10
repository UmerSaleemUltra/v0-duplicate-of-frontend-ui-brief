import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Access Your Dashboard | BuzzFiling",
  description:
    "Sign in to your BuzzFiling account to manage your US LLC or C-Corp, access documents, track orders, and manage your business formation services.",
  keywords: [
    "BuzzFiling login",
    "client dashboard access",
    "US business account",
    "LLC management portal",
    "business formation login"
  ],
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
