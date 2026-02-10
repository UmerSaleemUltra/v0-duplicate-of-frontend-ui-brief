import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Start Your US LLC - BuzzFiling Checkout",
  description: "Complete your US LLC or C-Corp formation order. Fast, reliable, and affordable business formation services from Pakistan.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
