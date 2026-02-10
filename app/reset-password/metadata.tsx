import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password | BuzzFiling",
  description:
    "Reset your BuzzFiling account password. Secure password recovery for your client portal account. Regain access to your US business dashboard and documents.",
  keywords: [
    "reset password",
    "password recovery",
    "account access",
    "forgot password",
    "BuzzFiling account",
    "client portal reset",
  ],
  authors: [{ name: "Buzz Filing Team" }],
  creator: "Buzz Filing",
  publisher: "Buzz Filing",
  metadataBase: new URL("https://www.buzzfiling.com"),
  alternates: {
    canonical: "https://www.buzzfiling.com/reset-password",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.buzzfiling.com/reset-password",
    siteName: "Buzz Filing",
    title: "Reset Password | BuzzFiling",
    description: "Securely reset your BuzzFiling account password and regain access to your client portal.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "BuzzFiling Password Reset",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@buzzfiling",
    creator: "@buzzfiling",
    title: "Reset Password",
    description: "Reset your BuzzFiling account password.",
    images: ["https://www.buzzfiling.com/images/buzz-filing-logo.png"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
