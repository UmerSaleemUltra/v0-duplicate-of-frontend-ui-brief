"use client"

import { Button } from "@/components/ui/button"
import { Building2, ArrowRight, CheckCircle2, DollarSign, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

export function NoCompanyState() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12 md:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-red-600" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">
            Ready to Start Your Business?
          </h1>

          <p className="text-base sm:text-lg text-slate-600 mb-1 sm:mb-2">
            No companies registered yet. Launch your business formation in minutes.
          </p>
          <p className="text-sm text-slate-500">Simple, affordable, and completely online.</p>
        </div>

        {/* Features Grid - Responsive grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 md:mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:border-red-300 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-50 flex items-center justify-center mb-3 sm:mb-4">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base">LLC Formation</h3>
            <p className="text-xs sm:text-sm text-slate-600">Complete LLC registration with state filing included.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:border-red-300 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-50 flex items-center justify-center mb-3 sm:mb-4">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base">EIN Number</h3>
            <p className="text-xs sm:text-sm text-slate-600">Get your federal EIN instantly for business banking.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:border-red-300 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-50 flex items-center justify-center mb-3 sm:mb-4">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base">Compliance Ready</h3>
            <p className="text-xs sm:text-sm text-slate-600">Stay compliant with annual filings and updates.</p>
          </div>
        </div>

        {/* Call to Action - Responsive CTA section */}
        <div className="bg-white rounded-lg border border-red-200 p-6 sm:p-8 text-center">
          <p className="text-slate-700 mb-4 sm:mb-6 font-medium text-sm sm:text-base">
            Starting at just <span className="text-red-600 font-bold">$149 + state fees</span> • No hidden charges
          </p>

          <Button
            onClick={() => router.push("/checkout")}
            size="lg"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg px-6 sm:px-8 py-2 sm:py-2.5 text-sm sm:text-base"
          >
            Start Company Formation
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm text-slate-600">✓ Used by thousands of entrepreneurs nationwide</p>
        </div>
      </div>
    </div>
  )
}

export default NoCompanyState
