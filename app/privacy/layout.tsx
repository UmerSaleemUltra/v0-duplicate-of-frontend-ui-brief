import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Buzz Filing - Your Data Protection Commitment",
  description:
    "Read Buzz Filing's privacy policy to understand how we protect your personal and business information. We prioritize data security and transparency in all US LLC formation services.",
  keywords: [
    "privacy policy",
    "data protection",
    "Buzz Filing security",
    "GDPR compliance",
    "user data privacy"
  ],
  openGraph: {
    title: "Privacy Policy | Buzz Filing",
    description: "Learn how Buzz Filing protects your personal and business information",
    type: "website",
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
