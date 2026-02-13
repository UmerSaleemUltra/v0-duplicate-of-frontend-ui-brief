"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Eye, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { setupMultiTabSync } from "@/lib/multi-tab-sync"

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
      const { authService } = await import("@/lib/auth")

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
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand/20 animate-pulse mx-auto mb-4"></div>
          <p className="text-muted">Checking authentication...</p>
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
              <div className="p-4 rounded-xl border bg-error/10 border-error/20 text-error text-sm">
                {error}
                {remainingTime && remainingTime > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-amber-700">
                    <Clock className="w-4 h-4" />
                    <span>
                      Please wait {remainingTime} minute{remainingTime > 1 ? "s" : ""} before trying again
                    </span>
                  </div>
                )}
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  disabled={loading || (retryAfter !== null && retryAfter > 0)}
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
              className="w-full bg-brand hover:bg-brand-hover text-white h-11"
              disabled={loading || (retryAfter !== null && retryAfter > 0)}
            >
              {loading ? "Signing in..." : retryAfter && retryAfter > 0 ? `Wait ${retryAfter}s` : "Sign In"}
              {!loading && (!retryAfter || retryAfter <= 0) && <ArrowRight className="ml-2 w-4 h-4" />}
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
