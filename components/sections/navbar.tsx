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
    <header className=" inset-x-0 top-0 z-50 bg-gradient-to-r from-[#880000] to-[#ff0d13] h-[100px] sm:h-[110px] md:h-[120px] ">
      <div className="mx-auto w-[95%] max-w-[1440px] h-full flex items-center">
        <div className="flex items-center justify-between font-medium gap-3 sm:gap-5 w-full">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/images/buzz-filing-logo-white.png"
              alt="BuzzFiling Logo"
              className="w-[140px] sm:w-[180px] md:w-[200px] lg:w-[240px] h-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center xl:gap-4 2xl:gap-6 3xl:gap-8">
            {[
              { label: "Home", href: "/" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Services", href: "/#services" },
              { label: "Process", href: "/#process" },
              { label: "Dashboard", href: "/#dashboard" },
              { label: "Testimonials", href: "/#testimonials" },
              { label: "FAQ", href: "/#faq" },
              { label: "Contact", href: "/#contact" },
            ].map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm lg:text-base xl:text-lg font-light text-white border-b-2 border-transparent pb-1 hover:border-white/30 transition-all ${
                  index === 0 ? "font-semibold border-white/60" : ""
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-6">
            <a href="tel:+17865749305" className="hidden lg:block whitespace-nowrap text-white text-sm xl:text-base">
              +1 (786) 574-9305
            </a>

            <Link
              href={buttonLink}
              className="hidden xl:flex items-center justify-center gap-2 text-sm xl:text-base text-[#F30C12] bg-white rounded-full px-5 py-2.5 xl:px-6 xl:py-3 hover:bg-white/90 transition-colors font-medium"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Hamburger */}
            <button
              className="block xl:hidden text-white p-1"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
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
          <div className="absolute right-0 top-0 h-full w-[280px] sm:w-[320px] max-w-[85vw] bg-gradient-to-r from-[#880000] to-[#ff0d13] shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-white/20">
              {/* Logo */}
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <img
                  src="/images/buzz-filing-logo-white.png"
                  alt="BuzzFiling Logo"
                  className="w-[140px] sm:w-[160px] h-auto"
                />
              </Link>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-white p-1">
                <X className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
            </div>

            {/* Mobile Nav */}
            <nav className="flex flex-col p-4 sm:p-5 gap-2">
              {[
                { label: "Home", href: "/" },
                { label: "Pricing", href: "/#pricing" },
                { label: "Services", href: "/#services" },
                { label: "Process", href: "/#process" },
                { label: "Dashboard", href: "/#dashboard" },
                { label: "Testimonials", href: "/#testimonials" },
                { label: "FAQ", href: "/#faq" },
                { label: "Contact", href: "/#contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-white text-base font-medium hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              <a
                href="tel:+17865749305"
                className="block rounded-lg px-4 py-3 text-white/90 text-sm hover:bg-white/10 transition-colors mt-2 border-t border-white/20"
                onClick={() => setIsMenuOpen(false)}
              >
                +1 (786) 574-9305
              </a>

              <Link
                href={buttonLink}
                className="flex items-center justify-center gap-2 mt-4 text-sm font-medium text-[#F30C12] bg-white rounded-full px-6 py-3 hover:bg-white/90 transition-colors"
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
