"use client"

import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"
import { useState } from "react"
import { Bell, Clock, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ComingSoonPage() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleNotifyMe = async () => {
    if (!email) return

    console.log("[v0] Notify me clicked for:", email)
    setSubscribed(true)
    setEmail("")

    // Reset after 3 seconds
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#ff0d13]/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-2xl">
                <Rocket className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Something Amazing is{" "}
            <span className="bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
              Coming Soon
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 sm:text-xl md:text-2xl">
            We're working hard to bring you an incredible experience. Our new platform will revolutionize how you form
            and manage your US business.
          </p>

          {/* Features Grid */}
          <div className="mb-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <Clock className="mx-auto mb-4 h-10 w-10 text-[#ff0d13]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Faster Processing</h3>
              <p className="text-sm text-gray-600">Form your LLC in record time with our streamlined system</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <Rocket className="mx-auto mb-4 h-10 w-10 text-[#ff0d13]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Enhanced Features</h3>
              <p className="text-sm text-gray-600">Access powerful tools to manage your business effortlessly</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <Bell className="mx-auto mb-4 h-10 w-10 text-[#ff0d13]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Real-time Updates</h3>
              <p className="text-sm text-gray-600">Stay informed with instant notifications on your formation</p>
            </div>
          </div>

          {/* Email Signup */}
          <div className="mx-auto mb-8 max-w-md">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-full border-2 border-gray-300 px-6 py-3 text-base focus:border-[#ff0d13] focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20"
              />
              <Button
                onClick={handleNotifyMe}
                disabled={!email || subscribed}
                className="rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {subscribed ? "✓ Subscribed!" : "Notify Me"}
              </Button>
            </div>
            {subscribed && <p className="mt-3 text-sm text-green-600">Thanks! We'll notify you when we launch.</p>}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={() => (window.location.href = "/")}
              className="rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => (window.location.href = "/#contact")}
              variant="outline"
              className="rounded-full border-2 border-[#ff0d13] px-8 py-6 text-lg font-semibold text-[#ff0d13] transition-all hover:bg-[#ff0d13] hover:text-white"
            >
              Contact Us
            </Button>
          </div>

          {/* Launch Timer (Optional) */}
          <div className="mt-12 text-sm text-gray-500">
            <p>Expected launch: Q1 2026</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
