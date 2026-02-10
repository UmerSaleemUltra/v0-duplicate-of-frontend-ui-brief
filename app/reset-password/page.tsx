import { Metadata } from "next"
import ResetPasswordClient from "./reset-password-client"

export const metadata: Metadata = {
  title: "Reset Password - BuzzFiling",
  description: "Reset your BuzzFiling account password",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
