"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, User } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState<string>("")

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

    // Save the data to localStorage and proceed to next step
    updateData({
      phone: phone,
      name: data.name,
      email: data.email,
      password: data.password,
    })

    // Clear any previous errors
    setErrors({})

    // Proceed to next step
    onNext()
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

  const handleBackClick = () => {
    setErrors({})
    router.push("/auth")
  }

  return (
    <div className="space-y-6 overflow-hidden max-w-full">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-950 break-words">Create Your Account</h1>
        <p className="text-sm text-slate-600 break-words leading-relaxed">
          Set up your account to track your formation progress and manage your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 overflow-hidden">
        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="name" className="text-sm font-medium text-slate-900">
            Full Name
          </Label>
          <div className="relative overflow-hidden">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={data.name || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full"
            />
          </div>
          {errors.name && <p className="text-xs text-red-600 break-words">{errors.name}</p>}
          <p className="text-xs text-slate-500 break-words">Your full legal name</p>
        </div>

        <div className="space-y-2 overflow-hidden">
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
          {errors.phone && <p className="text-xs text-red-600 break-words">{errors.phone}</p>}
          <p className="text-xs text-slate-500 break-words">We'll use this to contact you about your order</p>
        </div>

        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="email" className="text-sm font-medium text-slate-900">
            Email Address
          </Label>
          <div className="relative overflow-hidden">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={data.email || ""}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full"
            />
          </div>
          {errors.email && <p className="text-xs text-red-600 break-words">{errors.email}</p>}
          <p className="text-xs text-slate-500 break-words">We'll send order updates to this email</p>
        </div>

        <div className="space-y-2 overflow-hidden">
          <Label htmlFor="password" className="text-sm font-medium text-slate-900">
            Password
          </Label>
          <div className="relative overflow-hidden">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={data.password || ""}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="pl-10 pr-10 h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 break-words">{errors.password}</p>}
          <p className="text-xs text-slate-500 break-words">Choose a strong password to secure your account</p>
        </div>

        {errors.submit && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 overflow-hidden">
            <p className="text-sm text-red-600 break-words leading-relaxed">{errors.submit}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
          <Button
            onClick={handleBackClick}
            variant="outline"
            className="w-full sm:w-auto px-8 h-12 text-base font-semibold border-slate-300 hover:bg-slate-50 bg-white text-slate-900"
          >
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto h-12 px-10 text-base bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#990000] hover:to-[#ff1a1a] text-white font-semibold"
          >
            Next <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
