import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password - Secure Your Account | BuzzFiling",
  description:
    "Reset your BuzzFiling account password securely. Create a new password to regain access to your US business formation dashboard and services.",
  keywords: [
    "reset password BuzzFiling",
    "account recovery",
    "forgot password",
    "secure account access",
    "password reset"
  ],
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
