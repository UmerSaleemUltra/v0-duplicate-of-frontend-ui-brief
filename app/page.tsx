import dynamic from "next/dynamic"
import Navbar from "@/components/sections/navbar"
import HeroSection from "@/components/sections/hero"
import type { Metadata } from "next"

// Below-the-fold sections loaded lazily to reduce initial JS bundle
const Brands = dynamic(() => import("@/components/sections/brands"))
const USAccessSection = dynamic(() => import("@/components/sections/us-access"))
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
  title: "US LLC Formation in Pakistan | EIN, ITIN & Business Setup | Buzz Filing",
  description:
    "Professional US LLC and C-Corp formation services for Pakistani entrepreneurs. Complete support with EIN application, ITIN assistance, registered agent, business address, and compliance guidance.",
  keywords: [
    "US LLC formation Pakistan",
    "LLC registration Pakistan",
    "US company registration Pakistan",
    "EIN application service",
    "ITIN application Pakistan",
    "registered agent service",
    "US business setup",
    "business formation consultant",
    "Buzz Filing",
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
    title: "US LLC Formation in Pakistan | EIN & Business Setup | Buzz Filing",
    description:
      "Form a US LLC or C-Corp from Pakistan with professional support. EIN application, ITIN assistance, registered agent, business address, and compliance guidance.",
    images: [
      {
        url: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "Buzz Filing - US Business Formation Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@buzzfiling",
    creator: "@buzzfiling",
    title: "US LLC & C-Corp Formation from Pakistan | Buzz Filing",
    description: "Professional US business formation with EIN, ITIN, registered agent, and compliance support.",
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

}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Organization Schema */}
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
            logo: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
            image: "https://www.buzzfiling.com/images/buzz-filing-logo.png",
            description:
              "Professional US LLC and C-Corp formation services for Pakistani entrepreneurs. Complete support with EIN application, ITIN assistance, registered agent, business address, and compliance guidance.",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Karachi",
              addressRegion: "Sindh",
              addressCountry: "Pakistan",
            },
            areaServed: [
              { "@type": "Country", name: "United States" },
              { "@type": "Country", name: "Pakistan" },
            ],
            availableLanguage: ["en", "ur"],
            knowsAbout: [
              "US LLC Formation",
              "US C-Corporation Formation",
              "EIN Application",
              "ITIN Application",
              "Registered Agent Services",
              "Business Address Services",
              "Compliance Support",
            ],
            serviceType: [
              "US LLC Formation",
              "US C-Corp Formation",
              "EIN Application",
              "ITIN Assistance",
              "Registered Agent Service",
              "Business Address Service",
              "Compliance Support",
            ],
          }),
        }}
      />

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://www.buzzfiling.com/#website",
            url: "https://www.buzzfiling.com",
            name: "Buzz Filing",
            description:
              "Professional US business formation services for international entrepreneurs.",
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
          }),
        }}
      />

      {/* Breadcrumb Schema */}
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

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "Service",
                name: "US LLC Formation",
                description: "Complete US LLC formation with legal documentation and state registration.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
              {
                "@type": "Service",
                name: "US C-Corp Formation",
                description: "Professional US C-Corporation formation and registration services.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
              {
                "@type": "Service",
                name: "EIN Application",
                description: "Expert assistance with Employee Identification Number application and processing.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
              {
                "@type": "Service",
                name: "ITIN Assistance",
                description: "ITIN application support for non-US residents through IRS-recognized channels.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
              {
                "@type": "Service",
                name: "Registered Agent Service",
                description: "Professional registered agent service for legal document receipt and compliance.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
              {
                "@type": "Service",
                name: "Business Address Service",
                description: "Unique US business address accepted by major online marketplaces and banks.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
              {
                "@type": "Service",
                name: "Compliance Support",
                description: "Annual reporting, tax filing support, and ongoing compliance guidance.",
                provider: { "@id": "https://www.buzzfiling.com/#organization" },
              },
            ],
          }),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Can a non-US resident form an LLC in the United States?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Non-US residents can legally form and fully own a U.S. LLC without visiting the United States. We assist international founders throughout the entire formation process.",
                },
              },
              {
                "@type": "Question",
                name: "Which state is best for LLC formation for foreigners?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "There is no single best state. Wyoming, New Mexico, Texas, Florida, and Montana are commonly chosen based on business activity.",
                },
              },
              {
                "@type": "Question",
                name: "Can a non resident apply for an ITIN?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Buzz Filing assists non-residents with ITIN applications through an IRS-authorized Certified Acceptance Agent to support U.S. tax compliance.",
                },
              },
              {
                "@type": "Question",
                name: "How long does it take to form a U.S. LLC?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "State approval usually takes 2 to 7 business days, depending on the state. EIN issuance typically takes 7 to 15 business days and may take longer during peak IRS processing periods.",
                },
              },
              {
                "@type": "Question",
                name: "Why is a registered agent required for my U.S. company?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A registered agent is legally required to receive official state notices, legal documents, and compliance correspondence on behalf of your company and ensures you do not miss critical communications.",
                },
              },
            ],
          }),
        }}
      />

      <Navbar />
      <HeroSection />
      <Brands />
      <USAccessSection />
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
