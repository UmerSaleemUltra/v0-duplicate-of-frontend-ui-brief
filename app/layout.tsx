import type React from "react"
import { Unbounded } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { CompanyProvider } from "@/components/client/company-provider"

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
})

export const metadata = {
  metadataBase: new URL("https://buzzfiling.com"),
  title: {
    default: "BuzzFiling - Pakistan's #1 US Business Formation Service | Form Your LLC Today",
    template: "%s | BuzzFiling - US Business Formation",
  },
  description:
    "BuzzFiling is Pakistan's leading US business formation service. Form your US LLC or Corporation in 4 weeks with EIN, registered agent, and compliance support. Trusted by 10,000+ entrepreneurs.",
  keywords: [
    "US LLC formation",
    "US business formation Pakistan",
    "form US LLC from Pakistan",
    "US company registration",
    "EIN application",
    "registered agent service",
    "US corporation formation",
    "business formation service",
    "BuzzFiling",
    "Pakistan business formation",
    "US business setup",
    "LLC formation service",
  ],
  authors: [{ name: "BuzzFiling" }],
  creator: "BuzzFiling",
  publisher: "BuzzFiling",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://buzzfiling.com",
    siteName: "BuzzFiling",
    title: "BuzzFiling - Pakistan's #1 US Business Formation Service",
    description:
      "Form your US LLC or Corporation in 4 weeks with Pakistan's most trusted business formation service. Get EIN, registered agent, and full compliance support.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BuzzFiling - US Business Formation Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuzzFiling - Pakistan's #1 US Business Formation Service",
    description: "Form your US LLC or Corporation in 4 weeks. Trusted by 10,000+ Pakistani entrepreneurs.",
    images: ["/og-image.jpg"],
    creator: "@buzzfiling",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: "https://buzzfiling.com",
  },
  generator: "v0.app",
  other: {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={unbounded.variable}>
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BuzzFiling",
              url: "https://buzzfiling.com",
              logo: "https://buzzfiling.com/logo.png",
              description:
                "Pakistan's leading US business formation service helping entrepreneurs form LLCs and Corporations.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "PK",
                addressLocality: "Pakistan",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+1-555-123-4567",
                contactType: "Customer Service",
                email: "support@buzzfiling.com",
                availableLanguage: ["English", "Urdu"],
              },
              sameAs: [
                "https://facebook.com/buzzfiling",
                "https://twitter.com/buzzfiling",
                "https://linkedin.com/company/buzzfiling",
                "https://instagram.com/buzzfiling",
              ],
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "10000",
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <CompanyProvider>{children}</CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
