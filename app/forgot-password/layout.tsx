import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Your Password | Buzz Filing Account Recovery",
  description:
    "Forgot your Buzz Filing password? Reset it securely and regain access to your US LLC management dashboard and business documents.",
  keywords: [
    "password reset",
    "forgot password",
    "account recovery",
    "Buzz Filing support",
    "reset login credentials"
  ],
  openGraph: {
    title: "Reset Password | Buzz Filing",
    description: "Securely reset your Buzz Filing account password",
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
