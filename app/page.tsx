"use client"

import Navbar from "@/components/sections/navbar"
import HeroSection from "@/components/sections/hero"
import Brands from "@/components/sections/brands"
import HowItWorks from "@/components/sections/how-it-works"
import GlobalFounders from "@/components/sections/global-founders"
import PricingSection from "@/components/sections/pricing"
import ServicesSection from "@/components/sections/services"
import Footer from "@/components/sections/footer"
import { useEffect } from "react"
import WhyChooseUs from "@/components/sections/why-choose-us"
import ComplianceSection from "@/components/sections/compliance"
import ClientDashboardSection from "@/components/sections/client-dashboard"
import TrustSocialProof from "@/components/sections/trust-social-proof"
import ContactSection from "@/components/sections/contact"
import FAQSection from "@/components/sections/faq"

export default function LandingPage() {
  useEffect(() => {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "BuzzFiling US Business Formation",
      image: "https://buzzfiling.com/logo.png",
      description:
        "Professional US LLC and Corporation formation service for Pakistani entrepreneurs. Get your US business registered in 4 weeks with full compliance support.",
      priceRange: "$299 - $599",
      address: {
        "@type": "PostalAddress",
        addressCountry: "PK",
      },
      geo: {
        "@type": "GeoCoordinates",
        addressCountry: "PK",
      },
      url: "https://buzzfiling.com",
      telephone: "+1-555-123-4567",
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      offers: [
        {
          "@type": "Offer",
          name: "Starter Package - LLC Formation",
          price: "299",
          priceCurrency: "USD",
          description: "Basic LLC formation with state filing and registered agent for 1 year",
        },
        {
          "@type": "Offer",
          name: "Advanced Package - Complete Business Setup",
          price: "599",
          priceCurrency: "USD",
          description: "Complete business formation with EIN, BOI filing, and premium support",
        },
      ],
    })
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

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
