import Navbar from "@/components/sections/navbar"
import HeroSection from "@/components/sections/hero"
import Brands from "@/components/sections/brands"
import HowItWorks from "@/components/sections/how-it-works"
import GlobalFounders from "@/components/sections/global-founders"
import PricingSection from "@/components/sections/pricing"
import ServicesSection from "@/components/sections/services"
import Footer from "@/components/sections/footer"
import WhyChooseUs from "@/components/sections/why-choose-us"
import ComplianceSection from "@/components/sections/compliance"
import ClientDashboardSection from "@/components/sections/client-dashboard"
import TrustSocialProof from "@/components/sections/trust-social-proof"
import ContactSection from "@/components/sections/contact"
import FAQSection from "@/components/sections/faq"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "BuzzFiling | Top LLC Formation Company in Karachi, Pakistan | US Business Registration",
  description:
    "BuzzFiling is Pakistan's #1 US LLC and C-Corp formation service provider in Karachi. Get your US business registered with EIN, ITIN, registered agent, and full compliance support. Trusted by 700+ Pakistani entrepreneurs. Packages from $149-$448.",
  keywords: [
    "BuzzFiling",
    "BuzzFiling services",
    "BuzzFiling Pakistan",
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
  ],
  authors: [{ name: "BuzzFiling Team" }],
  creator: "BuzzFiling",
  publisher: "BuzzFiling",
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
    siteName: "BuzzFiling",
    title: "BuzzFiling | Top LLC Formation Company in Karachi, Pakistan",
    description:
      "Pakistan's #1 US LLC and C-Corp formation service. Get your US business registered with EIN, ITIN, and full compliance support. Trusted by 700+ entrepreneurs.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "BuzzFiling - US LLC Formation Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@buzzfiling",
    creator: "@buzzfiling",
    title: "BuzzFiling | Top LLC Formation Company in Karachi",
    description: "Pakistan's #1 US LLC formation service. 700+ satisfied clients. Packages from $149-$448.",
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
        name: "BuzzFiling",
        alternateName: "Buzz Filing",
        legalName: "BuzzFiling US Business Formation Services",
        url: "https://www.buzzfiling.com",
        logo: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        image: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        description:
          "BuzzFiling is Pakistan's leading US LLC and C-Corp formation service provider, helping Pakistani entrepreneurs register their US businesses with complete EIN, ITIN, and compliance support.",
        priceRange: "$149 - $448",
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
        email: "us8637@gmail.com",
        sameAs: [
          "https://www.facebook.com/buzzfiling",
          "https://www.linkedin.com/company/buzzfiling",
          "https://www.instagram.com/buzzfiling",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "US Business Formation Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Starter Package - LLC Formation",
                description:
                  "Basic US LLC formation with state filing, registered agent for 1 year, and operating agreement",
                provider: {
                  "@type": "Organization",
                  name: "BuzzFiling",
                },
              },
              price: "149",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: "https://www.buzzfiling.com/checkout",
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Professional Package - Complete Setup",
                description:
                  "Complete US LLC formation with EIN, BOI filing, registered agent, virtual mailroom, and priority support",
                provider: {
                  "@type": "Organization",
                  name: "BuzzFiling",
                },
              },
              price: "299",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: "https://www.buzzfiling.com/checkout",
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Premium Package - Full Service",
                description:
                  "Premium US LLC formation with EIN, ITIN, BOI filing, registered agent, virtual mailroom, bank account setup assistance, and dedicated support",
                provider: {
                  "@type": "Organization",
                  name: "BuzzFiling",
                },
              },
              price: "448",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: "https://www.buzzfiling.com/checkout",
            },
          ],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How long does US LLC formation take from Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The entire US LLC formation process typically takes 2-4 weeks from Pakistan. This includes state filing, EIN application, and all necessary documentation. BuzzFiling handles the entire process for you with full support.",
            },
          },
          {
            "@type": "Question",
            name: "What documents do I need to register a US LLC from Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "To register a US LLC from Pakistan, you need a valid passport, proof of address, and business details. BuzzFiling guides you through the entire documentation process and helps prepare all necessary paperwork.",
            },
          },
          {
            "@type": "Question",
            name: "Can Pakistani citizens open a US LLC?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, Pakistani citizens can easily open a US LLC. There are no citizenship requirements for LLC formation in most US states. BuzzFiling specializes in helping Pakistani entrepreneurs register their US businesses with full compliance support.",
            },
          },
          {
            "@type": "Question",
            name: "What is included in BuzzFiling packages?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "BuzzFiling packages include state filing, registered agent service, EIN application, operating agreement, BOI compliance filing, virtual mailroom, and dedicated support. Premium packages also include ITIN application and bank account setup assistance.",
            },
          },
        ],
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
        name: "BuzzFiling",
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
