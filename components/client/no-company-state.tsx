"use client"

import { Button } from "@/components/ui/button"
import { Building2, ArrowRight } from 'lucide-react'
import Link from "next/link"

export function NoCompanyState() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-slate-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          No Companies Yet
        </h2>
        
        <p className="text-slate-600 mb-8">
          You haven't registered any companies with us yet. Start your business formation journey today!
        </p>
        
        <Link href="/checkout">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#aa0000] hover:to-[#ff2d33] text-white gap-2"
          >
            Start Company Formation
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
