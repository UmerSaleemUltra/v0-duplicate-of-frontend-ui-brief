"use client"
import { ArrowRight, Calculator } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import StateFeesCalculatorModal from "@/components/modals/state-fees-calculator-modal"

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
  const [showCalculator, setShowCalculator] = useState(false)

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

  const handleCalculatorClick = () => {
    if (isAuthenticated) {
      window.location.href = "/checkout"
    } else {
      setShowCalculator(true)
    }
  }

  return (
    <>
      <div id="home" className="bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center py-16 md:py-20 lg:py-24">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
               font-extrabold mb-6 text-white px-2 
               leading-tight tracking-tight"
            >
              Start Your U.S. Business <br className="hidden sm:block" />
              Fast & Fully Online
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
              Form your LLC, get your EIN, open a business bank account & stay compliant – all in one simple setup.
              Starting at $149 + state fees.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4">
              <Link
                href={buttonLink}
                className="flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg 
                         text-[#ff0d13] bg-white rounded-full px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 font-medium 
                         shadow-md hover:shadow-lg hover:bg-white/90 transition-all w-full sm:w-auto"
              >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <button
                onClick={handleCalculatorClick}
                className="flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg 
                         text-white border-2 border-white rounded-full px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 font-medium 
                         hover:bg-white/10 transition-all w-full sm:w-auto"
              >
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>State Fees Calculator</span>
              </button>
            </div>
          </div>

          <div className="mt-8">
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

      <StateFeesCalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </>
  )
}
