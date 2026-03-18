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
    default: "Buzz Filing | Top LLC Formation Company in Karachi, Pakistan | Best US Company Registration Services",
    template: "%s | Buzz Filing",
  },

  description:
    "Buzz Filing is Pakistan's #1 US LLC and C-Corp formation service provider in Karachi. Best company registration services, ITIN & EIN assistance, registered agent, US business address, and compliance support for Pakistani and international entrepreneurs.",

  keywords: [
    "LLC registration in Karachi",
    "LLC formation Karachi",
    "company registration Karachi",
    "business registration Karachi",
    "register LLC in Karachi",
    "how to register LLC in Pakistan",
    "LLC registration Pakistan",
    "US LLC registration from Pakistan",
    "US LLC formation from Karachi",
    "form US LLC from Karachi",
    "LLC service providers in Karachi",
    "LLC consultants in Karachi",
    "best LLC service in Karachi",
    "affordable LLC registration Karachi",
    "cheap LLC registration Pakistan",
    "LLC registration cost Karachi",
    "LLC formation fees Pakistan",
    "US company registration Karachi",
    "US business setup from Pakistan",
    "start US business from Karachi",
    "online LLC registration Pakistan",
    "remote LLC formation Karachi",
    "EIN for LLC Pakistan",
    "EIN application Karachi",
    "ITIN application Pakistan",
    "registered agent service Pakistan",
    "US business address Karachi",
    "virtual office USA from Pakistan",
    "Amazon seller LLC Pakistan",
    "Shopify LLC registration Karachi",
    "freelancer LLC Pakistan",
    "remote worker LLC Karachi",
    "e-commerce LLC Pakistan",
    "digital business LLC Karachi",
    "Top LLC formation companies in Karachi",
    "Best company registration services in Pakistan",
    "Best ITIN & US LLC service providers in Karachi",
    "Buzz Filing services",
    "Buzz Filing Pakistan",
    "LLC registration Karachi Pakistan",
    "US business formation Pakistan",
    "EIN application service Karachi",
    "Pakistani entrepreneurs US LLC",
    "US LLC formation Pakistan",
    "form US LLC from Pakistan",
    "US company registration Pakistan",
    "US business formation service",
    "register US company online",
    "Buzz Filing",
    "buzzfiling",
    "Buzz Filing Karachi",
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
    "Delaware LLC formation",
    "start US business from Pakistan",
    "open US company from Pakistan",
    "US company for ecommerce",
    "US company for Amazon sellers",
    "LLC registration service",
    "US business setup Pakistan",
    "best LLC service Karachi",
    "top company formation Pakistan",
    "Pakistani entrepreneurs US LLC",
    "non-resident US company formation",
    "LLC registration online Karachi",
    "company formation consultant Karachi",
    "business setup consultant Pakistan",
    "Karachi LLC service",
    "Pakistan LLC service",
    "LLC kaise banaye Pakistan",
    "US company kaise register kare",
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
    title: "Buzz Filing | Top LLC Formation Company in Karachi, Pakistan | Best US Company Registration Services",
    description:
      "Register your US LLC or C-Corporation with Buzz Filing in Karachi. Get help with EIN, registered agent, US business address, ITIN support, and compliance guidance for non-resident founders.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzzfiling-logo.png",
        width: 1200,
        height: 630,
        alt: "Buzz Filing – US Company Formation & Compliance Support",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Buzz Filing | US Company Formation for Pakistani Founders",
    description:
      "US LLC & C-Corp formation with EIN assistance, registered agent, US business address, ITIN support, and compliance guidance for non-resident founders.",
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
  },
    generator: 'Buzz Filing'
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
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KTZXH7FM');`}
        </Script>

        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-FJJRFZNDPF" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FJJRFZNDPF');
          `}
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
                "Buzz Filing is Pakistan's premier US business formation service, helping entrepreneurs establish US LLCs and Corporations with comprehensive support including EIN, registered agent, business address, and compliance services.",
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
                ratingCount: "700",
                reviewCount: "650",
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
            src="https://www.googletagmanager.com/ns.html?id=GTM-KTZXH7FM"
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
