import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout - Start Your US Business | BuzzFiling",
  description:
    "Complete your US LLC or C-Corp formation order. Quick and secure checkout process with bank transfer payment options. Start your US business today.",
  keywords: [
    "US LLC checkout",
    "business formation order",
    "company registration payment",
    "US business setup",
    "LLC formation checkout"
  ],
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
