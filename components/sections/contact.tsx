"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ContactSection() {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | "ok" | "err">(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1000))
      setStatus("ok")
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setStatus("err")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#ff0d13] via-[#e60c12] to-[#cc0a10] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Reach Out, We're Here to Help!</h2>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            Complete the form, and our team will promptly respond to your inquiry within our working hours!
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1a0d0e] rounded-3xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Send us a message</h3>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-white font-medium block">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Full Name"
                  className="bg-white border-0 text-gray-900 placeholder:text-gray-500 h-12 rounded-xl"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-white font-medium block">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  className="bg-white border-0 text-gray-900 placeholder:text-gray-500 h-12 rounded-xl"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-white font-medium block">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Your Message"
                  className="bg-white border-0 text-gray-900 placeholder:text-gray-500 rounded-xl resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ff0d13] hover:bg-[#e60c12] text-white font-bold h-12 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {status === "ok" && <p className="text-green-400 text-center font-medium">Message sent successfully!</p>}
              {status === "err" && (
                <p className="text-red-400 text-center font-medium">Something went wrong. Please try again.</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
