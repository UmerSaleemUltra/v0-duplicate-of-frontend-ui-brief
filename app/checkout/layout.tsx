import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Start Your US LLC | BuzzFiling Checkout",
  description:
    "Complete your US LLC formation in minutes. Simple checkout process for business registration in any US state. Get your EIN, registered agent, and compliance support.",
  keywords: [
    "LLC formation checkout",
    "start US business",
    "register LLC online",
    "business formation service",
    "US company registration"
  ],
  openGraph: {
    title: "Start Your US LLC | BuzzFiling Checkout",
    description: "Complete your US LLC formation in minutes with BuzzFiling's simple checkout process",
    type: "website",
  },
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
