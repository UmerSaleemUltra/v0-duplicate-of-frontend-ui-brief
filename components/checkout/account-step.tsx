"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "./phone-input"
import type { CheckoutData } from "@/app/page"

type AccountStepProps = {
  data: CheckoutData
  updateData: (updates: Partial<CheckoutData>) => void
  onNext: () => void
  onBack: () => void
}

const countries = [
  { code: "us", name: "United States", dial: "+1" },
  { code: "gb", name: "United Kingdom", dial: "+44" },
  { code: "ca", name: "Canada", dial: "+1" },
  { code: "au", name: "Australia", dial: "+61" },
  { code: "in", name: "India", dial: "+91" },
  { code: "de", name: "Germany", dial: "+49" },
  { code: "fr", name: "France", dial: "+33" },
  { code: "jp", name: "Japan", dial: "+81" },
  { code: "mx", name: "Mexico", dial: "+52" },
  { code: "br", name: "Brazil", dial: "+55" },
]

export function AccountStep({ data, updateData, onNext, onBack }: AccountStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState<string>("")
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  useEffect(() => {
    if (data?.phone) {
      setPhone(data.phone)
    }
  }, [data?.phone])

  if (!data) {
    console.log("[v0] AccountStep - data is undefined, showing loader")
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#880000] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  console.log("[v0] AccountStep - rendering with data:", data)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!data.name) {
      newErrors.name = "Name is required"
    } else if (data.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!phone) {
      newErrors.phone = "Phone number is required"
    } else if (phone.length < 10) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!data.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!data.password) {
      newErrors.password = "Password is required"
    } else if (data.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      setIsCreatingUser(true)

      try {
        if (!data.userId) {
          console.log("[v0] Creating user account...")

          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.name,
              email: data.email,
              password: data.password,
              phone: phone,
              isCheckout: true,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to create account")
          }

          const result = await response.json()
          console.log("[v0] User account response:", result)

          if (result.userExists) {
            console.log("[v0] User already exists, using existing account:", result.data.id)
            updateData({
              phone: phone,
              name: data.name,
              email: data.email,
              password: data.password,
              userId: result.data.id || result.data._id,
            })
          } else {
            console.log("[v0] New user account created:", result.data.id || result.data._id)
            updateData({
              phone: phone,
              name: data.name,
              email: data.email,
              password: data.password,
              userId: result.data.id || result.data._id,
            })
          }
        } else {
          console.log("[v0] User already has ID, updating data")
          updateData({
            phone: phone,
            name: data.name,
            email: data.email,
            password: data.password,
          })
        }

        console.log("[v0] Account step completed, moving to next step")
        onNext()
      } catch (error) {
        console.error("[v0] Error creating user:", error)
        setErrors({ submit: error instanceof Error ? error.message : "Failed to create account" })
      } finally {
        setIsCreatingUser(false)
      }
    }
  }

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-950 tracking-tight">Create Your Account</h1>
        <p className="text-base text-slate-700 max-w-2xl leading-relaxed">
          Set up your account to track your formation progress and manage your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-900">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={data.name || ""}
              onChange={(e) => updateData({ name: e.target.value })}
              className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
            />
          </div>
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          <p className="text-xs text-slate-700">Your full legal name</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="phone" className="text-sm font-semibold text-slate-900">
            Phone Number
          </Label>
          <PhoneInput
            value={phone}
            onChange={(value) => setPhone(value || "")}
            defaultCountry="US"
            international
            withCountryCallingCode
          />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          <p className="text-xs text-slate-700">We'll use this to contact you about your order</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-900">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={data.email || ""}
              onChange={(e) => updateData({ email: e.target.value })}
              className="pl-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
            />
          </div>
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          <p className="text-xs text-slate-700">We'll send order updates to this email</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="password" className="text-sm font-semibold text-slate-900">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={data.password || ""}
              onChange={(e) => updateData({ password: e.target.value })}
              className="pl-10 pr-10 h-11 border border-slate-200 bg-white text-slate-900 rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          <p className="text-xs text-slate-700">Choose a strong password to secure your account</p>
        </div>

        {errors.submit && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isCreatingUser}
            className="px-6 h-10 border border-slate-200 bg-white text-slate-900 font-medium text-sm rounded-lg cursor-pointer"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button
            type="submit"
            disabled={isCreatingUser}
            className="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white h-10 text-sm font-medium rounded-lg px-4 cursor-pointer"
          >
            {isCreatingUser ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
