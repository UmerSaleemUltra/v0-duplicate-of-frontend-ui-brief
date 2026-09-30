"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Clock, RefreshCw, InboxIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authService } = await import("@/lib/auth")
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          if (currentUser.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/client/dashboard")
          }
        } else {
          setAuthChecked(true)
        }
      } catch {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Failed to send reset link")
      }
    } catch (err) {
      console.error(" Forgot password error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        alert("Reset link resent successfully!")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to resend link")
      }
    } catch (err) {
      console.error(" Resend error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand/20 animate-pulse mx-auto mb-4"></div>
          <p className="text-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-modal rounded-3xl p-8">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Image
                src="/images/buzz-filing-logo.png"
                alt="Buzz Filing"
                width={220}
                height={137}
                className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
                priority
              />
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Check Your Email</h1>
            <p className="text-muted text-center mb-6">
              We've sent a password reset link to{" "}
              <span className="text-foreground font-semibold">{email}</span>
            </p>

            {/* Token expiry notice */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                This link expires in <strong>15 minutes</strong>. Please check your email promptly.
              </p>
            </div>

            <div className="space-y-4">
              {/* Didn't receive card — redesigned */}
              <div className="rounded-2xl border border-glass-border bg-background/60 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border bg-muted/30">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <InboxIcon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Didn't receive the email?</p>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  <p className="text-sm text-muted flex items-start gap-2">
                    <span className="mt-0.5 text-brand font-bold">1.</span>
                    Make sure you entered the correct email address.
                  </p>
                  <p className="text-sm text-muted flex items-start gap-2">
                    <span className="mt-0.5 text-brand font-bold">2.</span>
                    Use the button below to resend a new link.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full h-11 bg-transparent gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Sending..." : "Resend Reset Email"}
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full h-11">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-modal rounded-3xl p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Image
              src="/images/buzz-filing-logo.png"
              alt="Buzz Filing"
              width={220}
              height={137}
              className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
              priority
            />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">Forgot Password?</h1>
          <p className="text-muted text-center mb-8">
            No worries! Enter your email and we'll send you reset instructions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white h-11" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
