"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-slate-50 flex items-center justify-center px-4 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl w-full text-center space-y-8">
          {/* 403 Error Code with Brand Gradient */}
          <div className="space-y-4">
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
              403
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">Access Denied</h2>
          </div>

          {/* Icon with Brand Colors */}
          <div className="flex justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#880000] to-[#ff0d13] flex items-center justify-center shadow-2xl">
              <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-lg md:text-xl text-slate-700 font-medium">
              Sorry, but you don't have permission to access this page.
            </p>
            <p className="text-base md:text-lg text-slate-600">
              Your account is currently inactive. Please complete your payment to access the dashboard.
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-md p-6 md:p-8 text-left max-w-xl mx-auto">
            <h3 className="font-semibold text-lg md:text-xl text-slate-900 mb-4">Why am I seeing this?</h3>
            <ul className="space-y-3 text-sm md:text-base text-slate-600">
              <li className="flex gap-3">
                <span className="text-[#ff0d13] font-bold mt-1">•</span>
                <span>Your payment has not been verified yet</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#ff0d13] font-bold mt-1">•</span>
                <span>You need to complete the payment process to activate your account</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#ff0d13] font-bold mt-1">•</span>
                <span>Once verified, you'll have full access to all features</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/checkout">
              <Button className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#990000] hover:to-[#ff1f23]">
                Complete Payment
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-transparent border-slate-300">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-sm md:text-base text-slate-600 pt-4">
            Need help? Contact us at{" "}
            <a href="mailto:hello@buzzfiling.com" className="text-[#ff0d13] hover:underline font-medium">
              hello@buzzfiling.com
            </a>{" "}
            or call{" "}
            <a href="tel:+923394882800" className="text-[#ff0d13] hover:underline font-medium">
              +92 339 4882800
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
