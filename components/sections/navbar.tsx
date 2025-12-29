"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
import Link from "next/link"

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
  const buttonText = isAuthenticated ? "Your Dashboard" : "Start Your Business"
  const buttonLink = isAuthenticated ? dashboardUrl : "/auth"

  return (
    <header className="inset-x-0 top-0 z-50 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1440px]">
        <div className="flex items-center justify-between h-[70px] lg:h-[80px] xl:h-[85px]">
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src="/images/buzz-filing-logo-white.png"
              alt="BuzzFiling Logo"
              className="h-auto w-[180px] sm:w-[200px] lg:w-[200px] xl:w-[220px]"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 absolute left-1/2 transform -translate-x-1/2">
            <a
              href="/#home"
              className="text-white text-sm xl:text-base font-semibold border-b-2 border-white pb-1 hover:border-white/80 transition-all whitespace-nowrap"
            >
              Home
            </a>
            <a
              href="/#process"
              className="text-white text-sm xl:text-base font-normal hover:text-white/80 transition-colors whitespace-nowrap"
            >
              Process
            </a>
            <a
              href="/#pricing"
              className="text-white text-sm xl:text-base font-normal hover:text-white/80 transition-colors whitespace-nowrap"
            >
              Pricing
            </a>
            <a
              href="/#services"
              className="text-white text-sm xl:text-base font-normal hover:text-white/80 transition-colors whitespace-nowrap"
            >
              Services
            </a>
            <a
              href="/#about"
              className="text-white text-sm xl:text-base font-normal hover:text-white/80 transition-colors whitespace-nowrap"
            >
              About
            </a>
            <a
              href="/blog"
              className="text-white text-sm xl:text-base font-normal hover:text-white/80 transition-colors whitespace-nowrap"
            >
              Blog
            </a>
            <a
              href="/#contact"
              className="text-white text-sm xl:text-base font-normal hover:text-white/80 transition-colors whitespace-nowrap"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3 xl:gap-4">
            <a
              href="tel:+17865749305"
              className="hidden lg:block whitespace-nowrap text-white text-sm xl:text-base font-normal"
            >
              +1 (786) 574-9305
            </a>

            <Link
              href={buttonLink}
              className="hidden lg:flex items-center justify-center gap-2 text-sm xl:text-base text-[#880000] bg-white rounded-full px-5 xl:px-6 py-2.5 xl:py-3 hover:bg-white/90 transition-colors font-semibold shadow-lg whitespace-nowrap"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              className="flex lg:hidden items-center justify-center text-white -mr-2"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-8 w-8 sm:h-9 sm:w-9" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-[300px] sm:w-[340px] max-w-[85vw] bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/20">
              {/* Logo */}
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <img
                  src="/images/buzz-filing-logo-white.png"
                  alt="BuzzFiling Logo"
                  className="h-auto w-[160px] sm:w-[180px]"
                />
              </Link>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-white p-1">
                <X className="h-8 w-8 sm:h-9 sm:w-9" />
              </button>
            </div>

            <nav className="flex flex-col p-5 sm:p-6 gap-2">
              <a
                href="/#home"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/#process"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Process
              </a>
              <a
                href="/#pricing"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="/#services"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </a>
              <a
                href="/#about"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a
                href="/blog"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </a>
              <a
                href="/#contact"
                className="block rounded-lg px-4 py-3.5 text-white text-base font-medium hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>

              <a
                href="tel:+17865749305"
                className="block rounded-lg px-4 py-3.5 text-white/90 text-sm hover:bg-white/10 transition-colors mt-2 border-t border-white/20 pt-4"
                onClick={() => setIsMenuOpen(false)}
              >
                +1 (786) 574-9305
              </a>

              <Link
                href={buttonLink}
                className="flex items-center justify-center gap-2 mt-4 text-base font-medium text-[#F30C12] bg-white rounded-full px-6 py-3.5 hover:bg-white/90 transition-colors shadow-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
