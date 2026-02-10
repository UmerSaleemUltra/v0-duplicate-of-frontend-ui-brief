import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Access Your BuzzFiling Dashboard",
  description: "Sign in to your BuzzFiling account to manage your US company, documents, and services.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
