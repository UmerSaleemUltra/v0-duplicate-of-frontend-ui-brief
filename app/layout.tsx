import type React from "react"
import { Unbounded } from "next/font/google"
import Script from "next/script"
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
    default: "BuzzFiling | US LLC & C-Corp Formation for Pakistani & International Founders",
    template: "%s | BuzzFiling",
  },
  description:
    "BuzzFiling helps Pakistani and international entrepreneurs register US LLCs and C-Corporations. Services include EIN assistance, registered agent, US business address, ITIN support, and ongoing compliance guidance.",

  keywords: [
    "US LLC formation Pakistan",
    "form US LLC from Pakistan",
    "US company registration Pakistan",
    "US business formation service",
    "register US company online",
    "BuzzFiling",
    "US C-Corp formation",
    "foreign owned LLC USA",
    "US LLC for non residents",
    "EIN application service",
    "apply EIN from Pakistan",
    "ITIN application service",
    "apply ITIN from Pakistan",
    "US registered agent service",
    "US business address service",
    "virtual business address USA",
    "New Mexico LLC formation",
    "Florida LLC formation",
    "Montana LLC formation",
    "Wyoming LLC formation",
    "start US business from Pakistan",
    "open US company from Pakistan",
    "US company for ecommerce",
    "US company for Amazon sellers",
    "LLC registration service",
    "US business setup Pakistan",
  ],

  authors: [{ name: "BuzzFiling", url: "https://buzzfiling.com" }],
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
    title: "BuzzFiling | US LLC & C-Corp Formation for Pakistani & International Founders",
    description:
      "Register your US LLC or C-Corporation with BuzzFiling. Get help with EIN, registered agent, US business address, ITIN support, and compliance guidance for non-resident founders.",
    images: [
      {
        url: "https://buzzfiling.com/images/buzzfiling-logo.png",
        width: 1200,
        height: 630,
        alt: "BuzzFiling – US Company Formation & Compliance Support",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "BuzzFiling | US Company Formation for Pakistani Founders",
    description:
      "US LLC & C-Corp formation with EIN assistance, registered agent, US business address, ITIN support, and compliance guidance for non-resident founders.",
    images: ["https://buzzfiling.com/images/buzzfiling-logo.png"],
    creator: "@buzzfiling",
    site: "@buzzfiling",
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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/buzzfiling-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-16x16.png", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/images/buzzfiling-logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/images/buzzfiling-logo.png",
      },
    ],
  },

  manifest: "/site.webmanifest",

  verification: {
    google: "75c07262157089ce",
  },

  alternates: {
    canonical: "https://buzzfiling.com",
  },

  category: "Business Services",
  classification: "US Company Formation & Compliance",

  other: {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  },
    generator: 'v0.app'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dc2626" },
    { media: "(prefers-color-scheme: dark)", color: "#dc2626" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={unbounded.variable}>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-9NH7KYTZH5" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9NH7KYTZH5');
            gtag('config', 'GT-MBLBWX43');
          `}
        </Script>

        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "@id": "https://buzzfiling.com/#organization",
              name: "BuzzFiling",
              alternateName: "Buzz Filing",
              url: "https://buzzfiling.com",
              logo: {
                "@type": "ImageObject",
                url: "https://buzzfiling.com/images/buzzfiling-logo.png",
                width: 400,
                height: 120,
              },
              image: "https://buzzfiling.com/images/buzzfiling-logo.png",
              description:
                "BuzzFiling is Pakistan's premier US business formation service, helping entrepreneurs establish US LLCs and Corporations with comprehensive support including EIN, registered agent, business address, and compliance services.",
              priceRange: "$149 - $448",
              address: {
                "@type": "PostalAddress",
                addressCountry: "PK",
                addressLocality: "Pakistan",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "30.3753",
                longitude: "69.3451",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+92-300-0000000",
                contactType: "Customer Service",
                email: "support@buzzfiling.com",
                availableLanguage: ["English", "Urdu"],
                areaServed: "PK",
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
                bestRating: "5",
                worstRating: "1",
                ratingCount: "10000",
                reviewCount: "8500",
              },
              serviceType: [
                "US LLC Formation",
                "US Corporation Formation",
                "EIN Application",
                "Registered Agent Service",
                "Business Address Service",
                "Compliance Support",
              ],
              areaServed: {
                "@type": "Country",
                name: "Pakistan",
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Business Formation Services",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "US LLC Formation",
                      description: "Complete US LLC formation with EIN and registered agent",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "US Corporation Formation",
                      description: "Full-service US Corporation registration and setup",
                    },
                  },
                ],
              },
              founder: {
                "@type": "Person",
                name: "BuzzFiling Team",
              },
              foundingDate: "2020",
              slogan: "Pakistan's #1 US Business Formation Service",
              knowsAbout: [
                "US LLC Formation",
                "US Business Registration",
                "EIN Application",
                "Registered Agent Services",
                "Business Compliance",
                "International Business Setup",
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How long does it take to form a US LLC from Pakistan?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "BuzzFiling forms your US LLC in approximately 4 weeks, including EIN application, registered agent setup, and all necessary documentation.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What services are included in BuzzFiling's LLC formation package?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Our package includes state filing, EIN application, registered agent service for one year, business address, compliance support, and dedicated customer service.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can Pakistani citizens form a US LLC?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes! Pakistani citizens and residents can legally form a US LLC. BuzzFiling specializes in helping Pakistani entrepreneurs establish their US business presence.",
                  },
                },
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://buzzfiling.com",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Services",
                  item: "https://buzzfiling.com/#services",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Pricing",
                  item: "https://buzzfiling.com/#pricing",
                },
              ],
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
