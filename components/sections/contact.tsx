"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({
          fullName: "",
          email: "",
          message: "",
        })
        toast({
          title: "Success!",
          description: "Thank you! Your message has been sent successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="w-full py-16 md:py-20 lg:py-24 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-6 xs:mb-8 sm:mb-10">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-0 py-2">
              <span className="text-sm font-bold text-white uppercase tracking-wide">Get in Touch</span>
            </div>
          </div>

          <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4 text-white">
            Reach Out, We're Here to Help!
          </h2>
          <p className="text-white/80 text-xs xs:text-sm sm:text-base max-w-2xl mx-auto">
            Complete the form, and our team will promptly respond to your inquiry within our working hours!
          </p>
        </div>

        <div className="bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-lg overflow-hidden flex flex-col md:flex-row">
          {/* Form Section */}
          <div className="w-full md:w-1/2 p-8 md:p-10">
            <h3 className="text-xl font-semibold text-white mb-6">Send us a message</h3>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-white mb-1.5 xs:mb-2 text-xs xs:text-sm">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-3 xs:px-4 py-2.5 xs:py-3 rounded bg-[#6a0000]/70 border border-[#8a0000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ff0d13] text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-white mb-2 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded bg-[#6a0000]/70 border border-[#8a0000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ff0d13]"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-white mb-2 text-sm">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 rounded bg-[#6a0000]/70 border border-[#8a0000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ff0d13]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 
                  text-sm sm:text-base font-medium
                  text-[#ff0d13] capitalize bg-white
                  rounded-full px-6 py-3
                  transition-all duration-300 hover:bg-gray-100 hover:shadow-lg
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
          </div>

          <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-r from-[#880000] to-[#ff0d13] items-center justify-center p-6">
            <div className="relative w-full h-[300px] md:h-full">
              <Image
                src="/images/contact-team.png"
                alt="Support team"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
