"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { authService } = await import("@/lib/auth")

      const result = await authService.login({ email, password })

      if (result.success && result.user) {
        // Redirect based on role
        if (result.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/client/dashboard")
        }
      } else {
        setError(result.error || "Invalid credentials")
        setLoading(false)
      }
    } catch (err) {
      setError("An error occurred during login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-modal rounded-3xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Image
              src="/images/buzz-filing-logo.png"
              alt="BuzzFiling"
              width={220}
              height={138}
              className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-muted text-center mb-8">Sign in to access your dashboard</p>

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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
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
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-brand hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            {"Don't have an account? "}
            <Link href="/checkout" className="text-brand hover:underline font-medium">
              Get Started
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-glass-border text-center text-xs text-muted">
            <p>Demo credentials:</p>
            <p className="mt-1">Admin: admin@buzzfiling.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
