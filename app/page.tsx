import dynamic from "next/dynamic"
import Navbar from "@/components/sections/navbar"
import HeroSection from "@/components/sections/hero"
import type { Metadata } from "next"

// Below-the-fold sections loaded lazily to reduce initial JS bundle
const Brands = dynamic(() => import("@/components/sections/brands"))
const PricingSection = dynamic(() => import("@/components/sections/pricing"))
const ServicesSection = dynamic(() => import("@/components/sections/services"))
const HowItWorks = dynamic(() => import("@/components/sections/how-it-works"))
const ClientDashboardSection = dynamic(() => import("@/components/sections/client-dashboard"))
const ComplianceSection = dynamic(() => import("@/components/sections/compliance"))
const WhyChooseUs = dynamic(() => import("@/components/sections/why-choose-us"))
const GlobalFounders = dynamic(() => import("@/components/sections/global-founders"))
const TrustSocialProof = dynamic(() => import("@/components/sections/trust-social-proof"))
const FAQSection = dynamic(() => import("@/components/sections/faq"))
const ContactSection = dynamic(() => import("@/components/sections/contact"))
const Footer = dynamic(() => import("@/components/sections/footer"))

export const metadata: Metadata = {
  title: "Buzz Filing | Top LLC Formation Company in Karachi, Pakistan | US Business Registration",
  description:
    "Buzz Filing is Pakistan's #1 US LLC and C-Corp formation service provider in Karachi. Get your US business registered with EIN, ITIN, registered agent, and full compliance support. Trusted by 700+ Pakistani entrepreneurs.",
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
    "Buzz Filing",
    "Buzz Filing services",
    "Buzz Filing Pakistan",
    "Top LLC formation companies in Karachi",
    "Best company registration services in Pakistan",
    "Best ITIN & US LLC service providers in Karachi",
    "LLC registration Karachi Pakistan",
    "US business formation Pakistan",
    "EIN application service Karachi",
    "Pakistani entrepreneurs US LLC",
    "US LLC formation Pakistan",
    "company registration Karachi",
    "ITIN service Pakistan",
    "registered agent service",
    "business formation consultant Karachi",
    "US C-Corp registration Pakistan",
    "BOI filing service",
    "compliance services Pakistan",
    "virtual mailroom service",
    "US business bank account setup",
    "EIN for LLC Pakistan",
    "EIN application Karachi",
    "ITIN application Pakistan",
    "Amazon seller LLC Pakistan",
    "Shopify LLC registration Karachi",
    "freelancer LLC Pakistan",
    "e-commerce LLC Pakistan",
    "digital business LLC Karachi",
    "Karachi business registration",
    "Pakistan US company formation",
  ],
  authors: [{ name: "Buzz Filing Team" }],
  creator: "Buzz Filing",
  publisher: "Buzz Filing",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.buzzfiling.com"),
  alternates: {
    canonical: "https://www.buzzfiling.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.buzzfiling.com",
    siteName: "Buzz Filing",
    title: "Buzz Filing | Top LLC Formation Company in Karachi, Pakistan",
    description:
      "Pakistan's #1 US LLC and C-Corp formation service. Get your US business registered with EIN, ITIN, and full compliance support. Trusted by 700+ entrepreneurs.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "Buzz Filing - US LLC Formation Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@buzzfiling",
    creator: "@buzzfiling",
    title: "Buzz Filing | Top LLC Formation Company in Karachi",
    description: "Pakistan's #1 US LLC formation service. 700+ satisfied clients.",
    images: ["https://www.buzzfiling.com/images/buzz-filing-logo.png"],
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
  verification: {
    google: "_j7SOmcEbiEhWO3bwy53HWXQMwmad7jhs7rQKM5oPd4",
  },
  other: {
    "structured-data": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "@id": "https://www.buzzfiling.com/#organization",
        name: "Buzz Filing",
        alternateName: "Buzz Filing",
        legalName: "Buzz Filing US Business Formation Services",
        url: "https://www.buzzfiling.com",
        logo: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        image: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        description:
          "Buzz Filing is Pakistan's leading US LLC and C-Corp formation service provider, helping Pakistani entrepreneurs register their US businesses with complete EIN, ITIN, and compliance support.",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "650",
          ratingCount: "700",
          bestRating: "5",
          worstRating: "1",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Karachi",
          addressRegion: "Sindh",
          addressCountry: "Pakistan",
        },
        areaServed: {
          "@type": "Country",
          name: "Pakistan",
        },
        availableLanguage: ["English", "Urdu"],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.buzzfiling.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: "https://www.buzzfiling.com/#services",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Pricing",
            item: "https://www.buzzfiling.com/#pricing",
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://www.buzzfiling.com/#website",
        url: "https://www.buzzfiling.com",
        name: "Buzz Filing",
        description: "Pakistan's #1 US LLC and C-Corp formation service provider",
        publisher: {
          "@id": "https://www.buzzfiling.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://www.buzzfiling.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ]),
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <Brands />
      <PricingSection />
      <ServicesSection />
      <HowItWorks />
      <ClientDashboardSection />
      <ComplianceSection />
      <WhyChooseUs />
      <GlobalFounders />
      <TrustSocialProof />
      <FAQSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
