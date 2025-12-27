"use client"

import Navbar from "@/components/sections/navbar"
import HeroSection from "@/components/sections/hero"
import Brands from "@/components/sections/brands"
import LLCFormationSection from "@/components/sections/llc-formation"
import HowItWorks from "@/components/sections/how-it-works"
import GlobalFounders from "@/components/sections/global-founders"
import PricingSection from "@/components/sections/pricing"
import ServicesSection from "@/components/sections/services"
import VideoTestimonials from "@/components/sections/VideoTestimonials"
import TestimonialMarquee2Rows from "@/components/sections/testimonials"
import StateFeesCalculator from "@/components/sections/calculator"
import ContactForm from "@/components/sections/contact"
import MarqueeBanner from "@/components/sections/marquee-banner"
import Footer from "@/components/sections/footer"
import { useEffect } from "react"
import WhyChooseUs from "@/components/sections/why-choose-us"
import TestimonialsEnhanced from "@/components/sections/testimonials-enhanced"
import ComplianceSection from "@/components/sections/compliance"
import ClientDashboardSection from "@/components/sections/client-dashboard"

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
      <TestimonialsEnhanced />
      <VideoTestimonials />
      <TestimonialMarquee2Rows />
      <LLCFormationSection />
      <StateFeesCalculator />
      <MarqueeBanner />
      <ContactForm />
      <Footer />
    </div>
  )
}
