"use client"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export default function HeroSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<"admin" | "client" | null>(null)

  useEffect(() => {
    const authUserCookie = getCookie("auth_user")
    if (authUserCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(authUserCookie))
        setIsAuthenticated(true)
        setUserRole(user.role)
      } catch (e) {
        setIsAuthenticated(false)
        setUserRole(null)
      }
    }
  }, [])

  const dashboardUrl = userRole === "admin" ? "/admin" : "/client/dashboard"
  const buttonText = isAuthenticated ? "Go to Dashboard" : "Start Your Business"
  const buttonLink = isAuthenticated ? dashboardUrl : "/auth"

  return (
    <div className="bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center py-16 md:py-20 lg:py-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
               font-extrabold mb-6 text-white px-2 
               leading-tight tracking-tight"
          >
            Start Your U.S. Business <br className="hidden sm:block" />
            Fast & Fully Online
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-white mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Form your LLC, get your EIN, open a business bank account & stay compliant – all in one simple package.
            Starting at $249 + state fees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-center items-center px-4"
          >
            <Link
              href={buttonLink}
              className="flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg 
                         text-[#ff0d13] bg-white rounded-full px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 font-medium 
                         shadow-md hover:shadow-lg hover:bg-white/90 transition-all"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center px-2 sm:px-4">
              <div className="w-full max-w-[900px] aspect-video">
                <iframe
                  className="w-full h-full rounded-lg sm:rounded-xl shadow-lg"
                  src="https://www.youtube.com/embed/bQ5oFpQiIS4"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
