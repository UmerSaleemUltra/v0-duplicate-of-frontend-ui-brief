import type React from "react"
import { Unbounded } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { CompanyProvider } from "@/components/client/company-provider"
import { Toaster } from "@/components/ui/toaster"

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
})

export const metadata = {
  metadataBase: new URL("https://www.buzzfiling.com"),

  title: {
    default: "US LLC & Corporation Formation for Pakistani Entrepreneurs | Buzz Filing",
    template: "%s | Buzz Filing",
  },

  description:
    "Buzz Filing helps Pakistani entrepreneurs register US LLCs and corporations with comprehensive support including EIN application, registered agent, business address, and compliance guidance.",

  keywords: [
    "US LLC formation",
    "US corporation formation",
    "LLC registration Pakistan",
    "EIN application",
    "registered agent service",
    "US business address",
    "ITIN application",
    "company registration",
    "business formation",
    "Buzz Filing",
  ],

  authors: [{ name: "Buzz Filing", url: "https://www.buzzfiling.com" }],
  creator: "Buzz Filing",
  publisher: "Buzz Filing",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.buzzfiling.com",
    siteName: "Buzz Filing",
    title: "US LLC & Corporation Formation for Pakistani Entrepreneurs | Buzz Filing",
    description:
      "Form a US LLC or corporation with Buzz Filing. Professional support for EIN, registered agent, business address, ITIN assistance, and compliance for international founders.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzzfiling-logo.png",
        width: 1200,
        height: 630,
        alt: "Buzz Filing – US Business Formation Services",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "US LLC & Corporation Formation | Buzz Filing",
    description:
      "Professional US company formation services for international entrepreneurs. EIN application, registered agent, business address, and compliance support.",
    images: ["https://www.buzzfiling.com/images/buzzfiling-logo.png"],
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
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },

  manifest: "/site.webmanifest",

  verification: {
    google: "_j7SOmcEbiEhWO3bwy53HWXQMwmad7jhs7rQKM5oPd4",
  },

  alternates: {
    canonical: "https://www.buzzfiling.com",
  },

  category: "Business Services",
  classification: "US Company Formation & Compliance",

  other: {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
  },

  generator: "Buzz Filing",

  language: "en",
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
        <meta charSet="utf-8" />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-MRG8PLG9');`}
        </Script>

        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="google-site-verification" content="_j7SOmcEbiEhWO3bwy53HWXQMwmad7jhs7rQKM5oPd4" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "@id": "https://www.buzzfiling.com/#organization",
              name: "Buzz Filing",
              alternateName: "Buzz Filing",
              url: "https://www.buzzfiling.com",
              logo: {
                "@type": "ImageObject",
                url: "https://www.buzzfiling.com/images/buzzfiling-logo.png",
                width: 400,
                height: 120,
              },
              image: "https://www.buzzfiling.com/images/buzzfiling-logo.png",
              description:
                "Professional US business formation services for international entrepreneurs. We specialize in LLC and corporation formation, EIN application, registered agent services, and business compliance.",
              sameAs: [
                "https://facebook.com/buzzfiling",
                "https://twitter.com/buzzfiling",
                "https://linkedin.com/company/buzzfiling",
                "https://instagram.com/buzzfiling",
              ],
              serviceType: [
                "US LLC Formation",
                "US Corporation Formation",
                "EIN Application",
                "Registered Agent Service",
                "Business Address Service",
                "Compliance Support",
              ],
              areaServed: [
                {
                  "@type": "Country",
                  name: "United States",
                },
                {
                  "@type": "Country",
                  name: "Pakistan",
                },
              ],
              address: {
                "@type": "PostalAddress",
                addressLocality: "Karachi",
                addressRegion: "Sindh",
                addressCountry: "Pakistan",
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
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Registered Agent Service",
                      description: "Professional registered agent service for US entities",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "EIN Application",
                      description: "Expert assistance with EIN application and ITIN support",
                    },
                  },
                ],
              },
              slogan: "US Business Formation for International Entrepreneurs",
              knowsAbout: [
                "US LLC Formation",
                "US Business Registration",
                "EIN Application",
                "ITIN Application",
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
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://www.buzzfiling.com",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MRG8PLG9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <AuthProvider>
          <CompanyProvider>{children}</CompanyProvider>
        </AuthProvider>
        <Toaster />

        <Script id="whatsapp-widget" strategy="lazyOnload">
          {`var url = 'https://wati-integration-prod-service.clare.ai/v2/watiWidget.js?27669';
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = url;
            var options = {
              "enabled":true,
              "chatButtonSetting":{
                "backgroundColor":"#00e785",
                "ctaText":"Chat with us",
                "borderRadius":"25",
                "marginLeft": "0",
                "marginRight": "20",
                "marginBottom": "20",
                "ctaIconWATI":false,
                "position":"right"
              },
              "brandSetting":{
                "brandName":"Buzz Filing",
                "brandSubTitle":"undefined",
                "brandImg":"https://www.buzzfiling.com/favicon.ico",
                "welcomeText":"Start your U.S. company with Buzz Filing",
                "messageText":"Hi! 👋 I'd like to know more. Is anyone free to chat?",
                "backgroundColor":"#00e785",
                "ctaText":"Chat with us",
                "borderRadius":"25",
                "autoShow":false,
                "phoneNumber":"923394882800"
              }
            };
            s.onload = function() {
              if (typeof CreateWhatsappChatWidget === 'function') {
                CreateWhatsappChatWidget(options);
              }
            };
            var x = document.getElementsByTagName('script')[0];
            if (x && x.parentNode) {
              x.parentNode.insertBefore(s, x);
            }`}
        </Script>
      </body>
    </html>
  )
}
