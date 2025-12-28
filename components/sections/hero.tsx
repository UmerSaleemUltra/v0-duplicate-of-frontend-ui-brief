"use client"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

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
    <div className="bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center py-6 sm:py-10 md:py-14 lg:py-16">
         <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
               font-extrabold mb-6 text-white px-2 
               leading-tight tracking-tight">
  Start Your U.S. Business <br className="hidden sm:block" />
  Fast & Fully Online
</h1>



          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            Form your LLC, get your EIN, open a business bank account & stay compliant – all in one simple package.
            Starting at $249 + state fees.
          </p>

          <div className="flex justify-center items-center px-4">
            <Link
              href={buttonLink}
              className="flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg 
                         text-[#ff0d13] bg-white rounded-full px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 font-medium 
                         shadow-md hover:shadow-lg hover:bg-white/90 transition-all"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>

        <div className="pb-6 sm:pb-10 md:pb-14 lg:pb-16">
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
        </div>
      </main>
    </div>
  )
}
