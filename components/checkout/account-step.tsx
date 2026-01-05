"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "./phone-input"
import type { CheckoutData } from "@/app/page"
import { authService } from "@/lib/auth"

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

  useEffect(() => {
    if (phone && phone !== data.phone) {
      updateData({ phone })
    }
  }, [phone])

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

    if (!validate()) {
      setErrors((prev) => ({
        ...prev,
        submit: "Please complete all account information: Full Name, Phone Number, Email Address, and Password",
      }))
      return
    }

    setIsCreatingUser(true)

    try {
      console.log("[v0] Attempting to sign up user with authService...")
      const signupResult = await authService.signup({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: phone,
      })

      if (!signupResult.success) {
        const errorMessage = signupResult.error || "Failed to create account"

        // If the email already exists, attempt to login with provided credentials
        if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("duplicate")) {
          console.log("[v0] Account exists, attempting to login instead...")

          try {
            const loginResult = await authService.login({
              email: data.email,
              password: data.password,
            })

            if (!loginResult.success) {
              throw new Error(
                "An account with this email already exists. The password you entered is incorrect. Please enter the correct password or use a different email.",
              )
            }

            console.log("[v0] Existing user logged in successfully")
            console.log("[v0] User data:", loginResult.user)

            updateData({
              phone: phone,
              name: data.name,
              email: data.email,
              password: data.password,
              userId: loginResult.user?.id,
            })

            console.log("[v0] Account step completed (existing user), moving to next step")
            onNext()
            return
          } catch (loginError) {
            throw loginError
          }
        }

        throw new Error(errorMessage)
      }

      console.log("[v0] User signed up successfully, auth token saved in cookies")
      console.log("[v0] User data:", signupResult.user)

      updateData({
        phone: phone,
        name: data.name,
        email: data.email,
        password: data.password,
        userId: signupResult.user?.id,
      })

      console.log("[v0] Account step completed, moving to next step")
      onNext()
    } catch (error) {
      console.error("[v0] Error during signup:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Failed to create account" })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleNameChange = (value: string) => {
    updateData({ name: value })
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }
  }

  const handleEmailChange = (value: string) => {
    updateData({ email: value })
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const handlePasswordChange = (value: string) => {
    updateData({ password: value })
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }))
    }
  }

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || ""
    setPhone(phoneValue)
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-950">Create Your Account</h1>
        <p className="text-sm text-slate-600">
          Set up your account to track your formation progress and manage your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-900">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={data.name || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg"
            />
          </div>
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          <p className="text-xs text-slate-500">Your full legal name</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-slate-900">
            Phone Number
          </Label>
          <PhoneInput
            value={phone}
            onChange={handlePhoneChange}
            defaultCountry="PK"
            international
            withCountryCallingCode
          />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
          <p className="text-xs text-slate-500">We'll use this to contact you about your order</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-900">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={data.email || ""}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg"
            />
          </div>
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          <p className="text-xs text-slate-500">We'll send order updates to this email</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-900">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={data.password || ""}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="pl-10 pr-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          <p className="text-xs text-slate-500">Choose a strong password to secure your account</p>
        </div>

        {errors.submit && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isCreatingUser}
            className="w-full sm:w-auto px-6 h-11 cursor-pointer bg-transparent"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button
            type="submit"
            disabled={isCreatingUser}
            className="w-full sm:w-auto sm:px-8 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white h-11 cursor-pointer"
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
