"use client"

import { Button } from "@/components/ui/button"
import { Building2, ArrowRight, CheckCircle2, DollarSign, FileText } from "lucide-react"
import Link from "next/link"

export function NoCompanyState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Building2 className="w-12 h-12 text-red-600" />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-3">Ready to Start Your Business?</h1>

          <p className="text-lg text-slate-600 mb-2">
            No companies registered yet. Launch your business formation in minutes.
          </p>
          <p className="text-sm text-slate-500">Simple, affordable, and completely online.</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-red-300 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">LLC Formation</h3>
            <p className="text-sm text-slate-600">Complete LLC registration with state filing included.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-red-300 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">EIN Number</h3>
            <p className="text-sm text-slate-600">Get your federal EIN instantly for business banking.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-red-300 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Compliance Ready</h3>
            <p className="text-sm text-slate-600">Stay compliant with annual filings and updates.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-8 text-center">
          <p className="text-slate-700 mb-6 font-medium">
            Starting at just <span className="text-red-600 font-bold">$149 + state fees</span> • No hidden charges
          </p>

          <Link href="/client/addons">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2 shadow-lg"
            >
              Start Company Formation
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">✓ Used by thousands of entrepreneurs nationwide</p>
        </div>
      </div>
    </div>
  )
}

export default NoCompanyState
