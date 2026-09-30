"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Eye, EyeOff, Clock, AlertCircle, CheckCircle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { setupMultiTabSync } from "@/lib/multi-tab-sync"
import { authService } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Synchronous check — authService reads from in-memory / cookie on module init
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        if (currentUser.role === "admin") {
          router.replace("/admin")
        } else {
          router.replace("/client/dashboard")
        }
      } else {
        setAuthChecked(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during authentication"
      setPageError(errorMessage)
      setAuthChecked(true)
    }
  }, [router])

  useEffect(() => {
    const cleanup = setupMultiTabSync(() => {
      router.push("/login")
    })
    return cleanup
  }, [router])

  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev && prev > 0) {
            const newValue = prev - 1
            setRemainingTime(Math.ceil(newValue / 60))
            return newValue
          }
          return null
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRetryAfter(null)
    setRemainingTime(null)
    setLoading(true)

    try {
      const result = await authService.login({ email, password })

      if (result.success && result.user) {
        if (result.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/client/dashboard")
        }
      } else {
        setError(result.error || "Invalid email or password. Please check your credentials and try again.")
        if (result.retryAfter) {
          setRetryAfter(result.retryAfter)
          setRemainingTime(result.remainingTime || Math.ceil(result.retryAfter / 60))
        }
        setLoading(false)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "We couldn't log you in at this time. Please try again later."
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-modal rounded-3xl p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center">
                <Loader className="w-8 h-8 text-brand animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">Checking authentication...</p>
                <p className="text-sm text-muted mt-2">Please wait a moment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error boundary if page error exists
  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-modal rounded-3xl p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground mb-2">Connection Error</h2>
                <p className="text-sm text-muted mb-6">{pageError}</p>
                <Button
                  onClick={() => {
                    setPageError(null)
                    window.location.reload()
                  }}
                  className="bg-brand hover:bg-brand-hover text-white"
                >
                  Try Again
                </Button>
              </div>
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
              height={138}
              className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-muted text-center mb-8">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-900 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Sign in failed</p>
                    <p className="text-red-800 text-sm mt-1">{error}</p>
                    {remainingTime && remainingTime > 0 && (
                      <div className="mt-3 flex items-center gap-2 p-2 rounded bg-amber-100/50">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span className="text-amber-700 text-sm font-medium">
                          Please wait {remainingTime} minute{remainingTime > 1 ? "s" : ""} before trying again
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                Email Address
                {email && !loading && <CheckCircle className="w-4 h-4 text-green-600" />}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 transition-all focus:ring-2 focus:ring-brand/20"
                  required
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                Password
                {password && !loading && <CheckCircle className="w-4 h-4 text-green-600" />}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-brand/20"
                  required
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked as boolean)}
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-brand hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-hover text-white h-11 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || (retryAfter !== null && retryAfter > 0) || !email || !password}
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : retryAfter && retryAfter > 0 ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Wait {retryAfter}s</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            {"Don't have an account? "}
            <Link href="/checkout" className="text-brand hover:underline font-medium">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
