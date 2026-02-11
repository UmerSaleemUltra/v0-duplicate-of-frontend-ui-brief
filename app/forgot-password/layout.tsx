import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Your Password | BuzzFiling Account Recovery",
  description:
    "Forgot your BuzzFiling password? Reset it securely and regain access to your US LLC management dashboard and business documents.",
  keywords: [
    "password reset",
    "forgot password",
    "account recovery",
    "BuzzFiling support",
    "reset login credentials"
  ],
  openGraph: {
    title: "Reset Password | BuzzFiling",
    description: "Securely reset your BuzzFiling account password",
    type: "website",
  },
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
