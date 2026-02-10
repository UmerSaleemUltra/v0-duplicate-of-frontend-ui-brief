import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Start Your US LLC | Checkout - BuzzFiling",
  description:
    "Begin your US LLC or C-Corp formation with BuzzFiling. Complete your order for professional US business registration with EIN, ITIN, registered agent, and full compliance support. Trusted by 700+ Pakistani entrepreneurs.",
  keywords: [
    "US LLC checkout",
    "register US business",
    "LLC formation order",
    "C-Corp registration",
    "EIN application",
    "ITIN service",
    "registered agent",
    "business formation package",
    "Delaware LLC setup",
    "Wyoming LLC formation",
  ],
  authors: [{ name: "Buzz Filing Team" }],
  creator: "Buzz Filing",
  publisher: "Buzz Filing",
  metadataBase: new URL("https://www.buzzfiling.com"),
  alternates: {
    canonical: "https://www.buzzfiling.com/checkout",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.buzzfiling.com/checkout",
    siteName: "Buzz Filing",
    title: "Start Your US LLC | Checkout - BuzzFiling",
    description:
      "Complete your US business formation order with Pakistan's #1 service provider. Get EIN, ITIN, registered agent, and full compliance support.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "BuzzFiling - US LLC Formation Checkout",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@buzzfiling",
    creator: "@buzzfiling",
    title: "Start Your US LLC | Checkout",
    description: "Begin your US business formation journey with BuzzFiling.",
    images: ["https://www.buzzfiling.com/images/buzz-filing-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}
