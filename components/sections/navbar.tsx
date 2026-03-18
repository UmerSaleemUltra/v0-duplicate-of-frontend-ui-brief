"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  return (
    <>
      <header className="inset-x-0 top-0 z-50 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
        <div className="mx-auto w-full lg:px-8 max-w-[1600px]">
          <div className="flex lg:grid lg:grid-cols-[auto_1fr_auto] items-center justify-between gap-4 lg:gap-8 h-[75px] sm:h-[80px] lg:h-[85px] xl:h-[90px]">
            <Link href="/" className="flex items-center flex-shrink-0 pl-0 lg:pl-0">
              <Image
                src="/images/buzz-filing-logo-white.png"
                alt="BuzzFiling Logo"
                width={240}
                height={60}
                priority
                className="h-auto w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
              />
            </Link>

            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8">
              <a
                href="/#home"
                className="text-white text-base xl:text-lg font-semibold border-b-2 border-white pb-1 hover:border-white/80 transition-all whitespace-nowrap"
              >
                Home
              </a>
              <a
                href="/#pricing"
                className="text-white text-base xl:text-lg font-normal  transition-colors whitespace-nowrap"
              >
                Pricing
              </a>
              <a
                href="/#services"
                className="text-white text-base xl:text-lg font-normal  transition-colors whitespace-nowrap"
              >
                Services
              </a>
              <a
                href="/#about"
                className="text-white text-base xl:text-lg font-normal  transition-colors whitespace-nowrap"
              >
                About
              </a>
              <a
                href="/#contact"
                className="text-white text-base xl:text-lg font-normal  transition-colors whitespace-nowrap"
              >
                Contact
              </a>
            </nav>

            <div className="flex items-center justify-end gap-3 xl:gap-4 pr-4 lg:pr-0">
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="hidden lg:flex items-center justify-center text-base xl:text-lg text-white border-2 border-white rounded-full px-6 xl:px-8 py-2 xl:py-2.5 hover:bg-white/10 transition-colors font-semibold whitespace-nowrap"
                >
                  Login
                </Link>
              )}

              <Link
                href={isAuthenticated ? dashboardUrl : "/checkout"}
                className="hidden lg:flex items-center justify-center gap-2 text-base xl:text-lg text-[#ff0d13] bg-white rounded-full px-6 xl:px-8 py-2.5 xl:py-3 hover:bg-white/90 transition-colors font-semibold shadow-lg whitespace-nowrap"
              >
                <span>{isAuthenticated ? "Your Dashboard" : "Start Your Business"}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <button
                className="flex lg:hidden items-center justify-center text-white"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
              >
                <Menu className="h-8 w-8 sm:h-9 sm:w-9" />
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />

            <div className="absolute right-0 top-0 h-full w-[300px] sm:w-[340px] max-w-[85vw] bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
              <div className="flex justify-between items-center p-4 sm:p-5 md:p-6 border-b border-white/20">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>
                  <Image
                    src="/images/buzz-filing-logo-white.png"
                    alt="BuzzFiling Logo"
                    width={180}
                    height={45}
                    className="h-auto w-[140px] sm:w-[160px] md:w-[180px]"
                  />
                </Link>
                <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-white p-1">
                  <X className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
                </button>
              </div>

              <nav className="flex flex-col p-4 sm:p-5 md:p-6 gap-1.5 sm:gap-2">
                <a
                  href="/#home"
                  className="block rounded-lg px-3 sm:px-4 py-3 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </a>
                <a
                  href="/#pricing"
                  className="block rounded-lg px-3 sm:px-4 py-3 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="/#services"
                  className="block rounded-lg px-3 sm:px-4 py-3 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Services
                </a>
                <a
                  href="/#about"
                  className="block rounded-lg px-3 sm:px-4 py-3 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </a>
                <a
                  href="/#contact"
                  className="block rounded-lg px-3 sm:px-4 py-3 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>

                <div className="flex flex-col gap-2.5 sm:gap-3 mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t border-white/20">
                  {!isAuthenticated && (
                    <Link
                      href="/login"
                      className="flex items-center justify-center text-sm sm:text-base md:text-lg text-white border-2 border-white rounded-full px-5 sm:px-6 py-3 sm:py-3.5 md:py-4 hover:bg-white/10 active:bg-white/20 transition-colors font-semibold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                  )}

                  <Link
                    href={isAuthenticated ? dashboardUrl : "/checkout"}
                    className="flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg text-[#ff0d13] bg-white rounded-full px-5 sm:px-6 py-3 sm:py-3.5 md:py-4 hover:bg-white/90 active:bg-white/80 transition-colors font-semibold shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{isAuthenticated ? "Your Dashboard" : "Start Your Business"}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
