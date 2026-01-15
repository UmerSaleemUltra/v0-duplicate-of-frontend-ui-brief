"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [emailValid, setEmailValid] = useState(false)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        })
        if (response.ok) {
          setIsUserLoggedIn(true)
        }
      } catch (err) {
        console.log("[v0] User not logged in")
      } finally {
        setPageLoading(false)
      }
    }
    checkAuthStatus()
  }, [])

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmail(value)
    setEmailValid(emailRegex.test(value))
  }

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      })
      const data = await response.json()
      return data.exists
    } catch (err) {
      console.error("[v0] Error checking email:", err)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!emailValid) {
        setError("Please enter a valid email address")
        setLoading(false)
        return
      }

      const emailExists = await checkEmailExists(email)
      if (!emailExists) {
        setError("No account found with this email address")
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Failed to send reset link. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Forgot password error:", err)
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
      console.error("[v0] Resend error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-modal rounded-3xl p-8 animate-pulse">
            <div className="h-16 bg-muted rounded-lg mb-8"></div>
            <div className="h-8 bg-muted rounded-lg mb-2"></div>
            <div className="h-4 bg-muted rounded-lg mb-8"></div>
            <div className="h-11 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isUserLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-modal rounded-3xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Already Logged In</h1>
            <p className="text-muted text-center mb-8">
              You're already logged into your account. If you want to change your password, please access it from your
              account settings.
            </p>
            <Link href="/client/dashboard">
              <Button className="w-full bg-brand hover:bg-brand-hover text-white h-11">
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
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
                alt="BuzzFiling"
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
            <p className="text-muted text-center mb-8">
              We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-glass-border">
                <p className="text-sm text-muted">
                  <strong className="text-foreground">Didn't receive the email?</strong>
                  <br />
                  Check your spam folder or try resending the link.
                </p>
              </div>

              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full h-11 bg-transparent"
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend Email"}
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
              alt="BuzzFiling"
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
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
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
                  onChange={(e) => validateEmail(e.target.value)}
                  className={`pl-10 h-11 ${!emailValid && email ? "border-error" : ""}`}
                  required
                />
              </div>
              {email && !emailValid && <p className="text-xs text-error">Please enter a valid email address</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-hover text-white h-11"
              disabled={loading || !emailValid}
            >
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
