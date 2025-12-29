"use client"

import { MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="text-white py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 overflow-hidden relative bg-gradient-to-r from-[#880000] to-[#ff0d13]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* Left section - Logo and contact info */}
          <div className="md:col-span-3 lg:col-span-3 space-y-4 xs:space-y-5 sm:space-y-6">
            <div>
              <div className="flex items-center">
                <img
                  src="/images/buzz-filing-logo-white.png"
                  alt="BuzzFiling Logo"
                  className="shrink-0 max-w-full w-[240px] 2xs:w-auto ml-[-25px] sm:ml-[-50px]"
                />
              </div>
              <p className="text-xs xs:text-sm mt-2 xs:mt-3">
                Start and Run Your U.S. Business
                <br />
                Hassle-Free With Us
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:text-white/80 transition-colors"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <p className="text-sm">hello@buzzfiling.com</p>
              </div>
              <div className="flex items-center gap-2 group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:text-white/80 transition-colors"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <p className="text-sm">+92 339 4882800</p>
              </div>
              <div className="flex items-center gap-2 group">
                <MapPin />
                <p className="text-sm">
                  Office No. 503, Plot 67/3, Zulekha Trade Centre, Alamgir Rd, CP & Berar Society, Karachi, 75300
                </p>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-3 xs:gap-4">
              <Link
                href="https://www.facebook.com/buzzfiling"
                aria-label="Facebook"
                className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-white rounded-sm hover:bg-white hover:text-[#880000] transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link
                href="https://www.linkedin.com/company/buzzfiling"
                aria-label="LinkedIn"
                className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-white rounded-sm hover:bg-white hover:text-[#880000] transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com/buzzfiling/"
                aria-label="Instagram"
                className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-white rounded-sm hover:bg-white hover:text-[#880000] transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-xs">2024 - 2025. All right reserved.</div>

            {/* Footer Text - Only show on larger screens or at bottom on mobile */}
            <div className="text-[10px] xs:text-xs max-w-xs opacity-80 hidden sm:block">
              BuzzFiling is a technology company. We are not a law firm, nor can we offer official legal advice.
            </div>
          </div>

          {/* Middle section - Links (two columns) */}
          <div className="md:col-span-5 lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div>
              <ul className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                <li>
                  <a href="#process" className="hover:underline transition-all inline-block">
                    Process
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:underline transition-all inline-block">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:underline transition-all inline-block">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:underline transition-all inline-block">
                    About
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:underline transition-all inline-block">
                    Contact
                  </a>
                </li>
                <li>
                  <Link href="/blog" className="hover:underline transition-all inline-block">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="/privacy" className="hover:underline transition-all inline-block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refprivacyund" className="hover:underline transition-all inline-block">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:underline transition-all inline-block">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:underline transition-all inline-block">
                    Copyrights
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Right section - Person image - shows on laptop/desktop */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="absolute w-[300px] xl:w-[349px] h-[400px] xl:h-[466px] top-[40px] xl:top-[60.6px] right-0 -mt-[100px]">
              <Image
                src="/images/image.png"
                alt="Person working on tablet"
                fill
                className="object-contain"
                sizes="(min-width: 1440px) 349px, (min-width: 1024px) 300px, 0px"
                priority
              />
            </div>
          </div>
        </div>

        {/* Footer Text - Mobile version at bottom */}
        <div className="text-[10px] xs:text-xs max-w-xs opacity-80 mt-6 xs:mt-8 sm:hidden">
          BuzzFiling is a technology company. We are not a law firm, nor can we offer official legal advice.
        </div>
      </div>
    </footer>
  )
}
