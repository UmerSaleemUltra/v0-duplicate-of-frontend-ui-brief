"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, UserPlus, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { useAuth } from "@/components/auth/auth-provider"

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Logo Skeleton */}
        <div className="flex justify-center mb-12">
          <Skeleton className="w-[220px] h-[138px]" />
        </div>

        {/* Auth Options Skeleton */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 h-full flex flex-col">
            <Skeleton className="w-14 h-14 rounded-xl mb-6" />
            <Skeleton className="h-8 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <Skeleton className="h-12 w-full mt-auto" />
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 h-full flex flex-col">
            <Skeleton className="w-14 h-14 rounded-xl mb-6" />
            <Skeleton className="h-8 w-2/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <Skeleton className="h-12 w-full mt-auto" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="text-center mt-12">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  )
}

export default function AuthSelectionPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/client/dashboard")
      }
    } else {
      setIsChecking(false)
    }
  }, [isAuthenticated, user, router])

  if (isChecking) {
    return <AuthSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Image
            src="/images/buzz-filing-logo.png"
            alt="BuzzFiling"
            width={220}
            height={138}
            className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
            priority
          />
        </div>

        {/* Auth Options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Sign Up Card */}
          <Link href="/checkout" className="group">
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-[#ff3b30] transition-all duration-300 hover:shadow-xl h-full flex flex-col">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Create Account</h2>
              <p className="text-slate-600 mb-6 flex-grow leading-relaxed">
                Start your business formation journey. Complete the process in minutes and get your LLC or Corporation
                registered.
              </p>

              <Button className="w-full bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 text-white group-hover:translate-x-1 transition-transform">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Login Card */}
          <Link href="/login" className="group">
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-[#ff3b30] transition-all duration-300 hover:shadow-xl h-full flex flex-col">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-gradient-to-r group-hover:from-[#880000] group-hover:to-[#ff0d13]">
                <LogIn className="w-7 h-7 text-slate-700 group-hover:text-white transition-colors" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Sign In</h2>
              <p className="text-slate-600 mb-6 flex-grow leading-relaxed">
                Already have an account? Access your dashboard to manage your business, view documents, and track
                progress.
              </p>

              <Button
                variant="outline"
                className="w-full border-2 group-hover:border-[#ff3b30] group-hover:text-[#ff3b30] group-hover:translate-x-1 transition-all bg-transparent"
              >
                Sign In
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-12 text-sm text-slate-500">
          <p>Trusted by 10,000+ businesses across all 50 states</p>
        </div>
      </div>
    </div>
  )
}
