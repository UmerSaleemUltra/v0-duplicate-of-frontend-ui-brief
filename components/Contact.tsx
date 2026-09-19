"use client"

import * as React from "react"
import { User, Mail, Phone, Building2, Globe, Send, MessageSquareText } from "lucide-react"

// shadcnui
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { Label } from "@/ui/label"
import { Button } from "@/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/ui/select"
import { Checkbox } from "@/ui/checkbox"

export default function ContactForm() {
  const [submitting, setSubmitting] = React.useState(false)
  const [status, setStatus] = React.useState<null | "ok" | "err">(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)
    const formData = Object.fromEntries(new FormData(e.currentTarget).entries())

    try {
      await new Promise((r) => setTimeout(r, 1000))
      setStatus("ok")
      e.currentTarget.reset()
    } catch {
      setStatus("err")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact" className="w-full bg-white py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-black">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff8a80] via-[#ff3b30] to-[#ffb199]">
              Contact Us
            </span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-black/80">
            We usually respond within one business day.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-lg p-6 sm:p-8 md:p-10 text-black"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
            {/* Full Name */}
            <Field
              id="name"
              label="Full Name"
              icon={<User className="h-4 w-4" />}
              required
              placeholder="Jane Doe"
            />
            {/* Email */}
            <Field
              id="email"
              label="Work Email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              required
              placeholder="jane@company.com"
            />
            {/* Phone */}
            <Field
              id="phone"
              label="Phone"
              type="tel"
              icon={<Phone className="h-4 w-4" />}
              placeholder="+1 555 555 5555"
            />
            {/* Company */}
            <Field
              id="company"
              label="Company"
              icon={<Building2 className="h-4 w-4" />}
              placeholder="Acme Inc."
            />
            {/* Website */}
            <Field
              id="website"
              label="Website"
              type="url"
              icon={<Globe className="h-4 w-4" />}
              placeholder="https://example.com"
            />
            {/* Inquiry Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-black">
                Inquiry Type <span className="text-red-400">*</span>
              </Label>
              <Select name="type" required>
                <SelectTrigger className="bg-transparent border-white/20 text-black placeholder:text-black/50 focus:ring-[#ff3b30]">
                  <SelectValue placeholder="Select a type…" />
                </SelectTrigger>
                <SelectContent className="bg-white border-white/10 text-black">
                  <SelectItem value="general">General Question</SelectItem>
                  <SelectItem value="estimate">Project Estimate</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-black">
                Message <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <MessageSquareText className="absolute left-3 top-3 h-4 w-4 text-black/60" />
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us a bit about your project..."
                  className="pl-9 bg-transparent border-black/20 text-black placeholder:text-black/50 resize-y focus-visible:ring-[#ff3b30]"
                />
              </div>
            </div>

            {/* Consent */}
            <div className="md:col-span-2 flex items-start gap-3">
              <Checkbox
                id="consent"
                name="consent"
                required
                className="border-black/40 data-[state=checked]:bg-[#ff3b30] data-[state=checked]:border-[#ff3b30]"
              />
              <span className="text-sm text-black/80">
                I agree to be contacted and accept the{" "}
                <a href="#" className="underline underline-offset-2 hover:opacity-80 text-black">
                  Privacy Policy
                </a>.
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#ff3b30] hover:bg-[#ff574d] text-white rounded-xl px-6 py-3 font-semibold"
            >
              <Send className={`h-4 w-4 mr-2 ${submitting ? "animate-pulse" : ""}`} />
              {submitting ? "Sending…" : "Send Message"}
            </Button>

            {status === "ok" && (
              <span className="text-sm text-emerald-400">
                ✅ Your message has been sent successfully!
              </span>
            )}
            {status === "err" && (
              <span className="text-sm text-red-400">
                ⚠️ Something went wrong. Try again.
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

/* ───────── Helper Input Field ───────── */
function Field({
  id,
  label,
  type = "text",
  icon,
  placeholder,
  required,
}: {
  id: string
  label: string
  type?: string
  icon?: React.ReactNode
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-black">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black">
            {icon}
          </div>
        )}
        <Input
          id={id}
          name={id}
          type={type}
          required={required}
          placeholder={placeholder}
          className="pl-9 bg-transparent border-black/20 text-black placeholder:text-black/50 focus-visible:ring-[#ff3b30]"
        />
      </div>
    </div>
  )
}
