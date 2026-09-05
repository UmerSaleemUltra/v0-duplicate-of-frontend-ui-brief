"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"

type VerificationStatus = "verifying" | "success" | "error" | "expired"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<VerificationStatus>("verifying")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      return
    }

    // Simulate API call to verify email
    const verifyEmail = async () => {
      try {
        // API call would go here
        // const response = await fetch(`/api/auth/verify-email?token=${token}`)

        // Simulate verification delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Mock response - in real app, check API response
        const isValid = token.length > 10 // Simple mock validation

        if (isValid) {
          setStatus("success")
        } else {
          setStatus("expired")
        }
      } catch (error) {
        setStatus("error")
      }
    }

    verifyEmail()
  }, [token])

  // Countdown and redirect on success
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (status === "success" && countdown === 0) {
      router.push("/login")
    }
  }, [status, countdown, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/buzz-filing-logo.png"
              alt="BuzzFiling"
              width={220}
              height={138}
              className="w-[180px] sm:w-[200px] md:w-[220px] h-auto mx-auto"
              priority
            />
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-lg">
          {/* Verifying State */}
          {status === "verifying" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff0d13] to-[#cc0a0f] flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Your Email</h1>
                <p className="text-slate-600">Please wait while we verify your email address...</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h1>
                <p className="text-slate-600 mb-4">
                  Your email has been successfully verified. You can now access your account.
                </p>
                <p className="text-sm text-slate-500">Redirecting to login in {countdown} seconds...</p>
              </div>
              <Button onClick={() => router.push("/login")} className="w-full h-10">
                Continue to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                <p className="text-slate-600 mb-4">
                  We couldn't verify your email address. The verification link may be invalid. Please contact support
                  for assistance.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-10 bg-transparent">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          )}

          {/* Expired State */}
          {status === "expired" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
                <p className="text-slate-600 mb-4">
                  This verification link has expired. Please contact support to request a new verification email.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-10 bg-transparent">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Need help?{" "}
          <Link href="/" className="text-[#ff0d13] hover:underline font-medium">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  )
}
