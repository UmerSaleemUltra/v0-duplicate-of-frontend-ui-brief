"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShieldAlert, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full bg-white border border-slate-200 p-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
            <p className="text-slate-600">
              Your account is currently inactive. Please complete your payment to access the dashboard.
            </p>
          </div>

          <Card className="bg-slate-50 border border-slate-200 p-6 text-left space-y-4">
            <h2 className="font-medium text-slate-900">Why am I seeing this?</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Your payment has not been verified yet</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>You need to complete the payment process to activate your account</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Once verified, you'll have full access to all features</span>
              </li>
            </ul>
          </Card>

          <div className="space-y-3">
            <Link href="/checkout" className="block">
              <Button className="w-full h-10">
                Complete Payment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/payment-status" className="block">
              <Button variant="outline" className="w-full h-10 bg-transparent">
                Check Payment Status
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-600">Need help? Contact us via WhatsApp for immediate assistance.</p>
        </div>
      </Card>
    </div>
  )
}
