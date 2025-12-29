"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)

    setFormData({
      fullName: "",
      email: "",
      message: "",
    })

    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 4000)
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

            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mb-6 rounded-lg bg-green-500/90 p-4 text-center text-white font-medium shadow-md"
                >
                  Thank you! Your message has been sent successfully.
                </motion.div>
              )}
            </AnimatePresence>

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
                className="flex items-center justify-center gap-2 
                  text-sm sm:text-base font-medium
                  text-[#880000] capitalize bg-white
                  rounded-full px-6 py-3
                  transition-all duration-300 hover:bg-gray-100 hover:shadow-lg"
              >
                <span>Send Message</span>
              </button>
            </form>
          </div>

          <div className="w-full md:w-1/2 bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center p-6">
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
