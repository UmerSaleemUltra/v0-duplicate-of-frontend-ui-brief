import { Metadata } from "next"
import CheckoutClient from "./checkout-client"

export const metadata: Metadata = {
  title: "Checkout - BuzzFiling",
  description: "Complete your US LLC or C-Corp formation order with BuzzFiling",
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
