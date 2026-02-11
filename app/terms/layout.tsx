import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions | BuzzFiling Service Agreement",
  description:
    "Review BuzzFiling's terms and conditions for US LLC formation services. Understand our service agreement, refund policy, and business formation guarantees.",
  keywords: [
    "terms and conditions",
    "service agreement",
    "BuzzFiling terms",
    "legal terms",
    "LLC formation policy"
  ],
  openGraph: {
    title: "Terms and Conditions | BuzzFiling",
    description: "Read our terms of service for US business formation",
    type: "website",
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
