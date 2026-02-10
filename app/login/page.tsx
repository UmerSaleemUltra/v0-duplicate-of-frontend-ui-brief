import { Metadata } from "next"
import LoginClient from "./login-client"

export const metadata: Metadata = {
  title: "Login - BuzzFiling",
  description: "Sign in to your BuzzFiling account to manage your US business",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return <LoginClient />
}
