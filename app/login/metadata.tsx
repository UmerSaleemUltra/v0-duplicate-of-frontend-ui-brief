import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Client Portal | BuzzFiling",
  description:
    "Access your BuzzFiling client dashboard. Manage your US LLC or C-Corp, track formation status, access documents, view mailroom, and manage compliance. Secure login for registered clients.",
  keywords: [
    "BuzzFiling login",
    "client portal",
    "LLC dashboard",
    "business management",
    "document access",
    "mailroom login",
    "compliance tracker",
    "client account",
  ],
  authors: [{ name: "Buzz Filing Team" }],
  creator: "Buzz Filing",
  publisher: "Buzz Filing",
  metadataBase: new URL("https://www.buzzfiling.com"),
  alternates: {
    canonical: "https://www.buzzfiling.com/login",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.buzzfiling.com/login",
    siteName: "Buzz Filing",
    title: "Login - Client Portal | BuzzFiling",
    description: "Access your client dashboard to manage your US business, documents, and compliance.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "BuzzFiling Client Portal Login",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@buzzfiling",
    creator: "@buzzfiling",
    title: "Login - Client Portal",
    description: "Access your BuzzFiling client dashboard.",
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
