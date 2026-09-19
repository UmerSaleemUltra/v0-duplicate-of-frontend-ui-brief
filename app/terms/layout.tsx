import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions | Buzz Filing Service Agreement",
  description:
    "Review Buzz Filing's terms and conditions for US LLC formation services. Understand our service agreement, refund policy, and business formation guarantees.",
  keywords: [
    "terms and conditions",
    "service agreement",
    "Buzz Filing terms",
    "legal terms",
    "LLC formation policy"
  ],
  openGraph: {
    title: "Terms and Conditions | Buzz Filing",
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
