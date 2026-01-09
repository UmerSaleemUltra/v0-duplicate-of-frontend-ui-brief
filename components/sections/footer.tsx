"use client"

import { Mail, Phone, MapPin, Instagram, Linkedin, Youtube, Facebook } from "lucide-react"

const footerLinks = {
  services: [
    { name: "LLC Formation", href: "/#services" },
    { name: "EIN Registration", href: "/#services" },
    { name: "Bank Account", href: "/#services" },
    { name: "Registered Agent", href: "/#services" },
    { name: "Business Address", href: "/#services" },
  ],
  company: [
    { name: "About Us", href: "/#about" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Process", href: "/#services" },
    { name: "Contact", href: "/#contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy", href: "/refund" },
  ],
}

export default function Footer() {
  return (
    <footer className="relative pt-16 md:pt-24 pb-8 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
      {/* Footer Content */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center mb-6">
              <img
                src="/images/buzz-filing-logo-white.png"
                alt="BuzzFiling"
                className="h-auto w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] ml-[-25px] mt-[-40px]"
              />
            </a>
            <p className="text-white mb-6 max-w-sm mt-[-25px]">
              Simplifying US business formation for entrepreneurs worldwide. Your trusted partner in building global
              businesses.
            </p>
            <div className="space-y-3">
              <a href="mailto:hello@buzzfiling.com" className="flex items-center gap-3 text-white hover:text-white/80">
                <Mail className="w-5 h-5 flex-shrink-0" />
                hello@buzzfiling.com
              </a>
              <a href="tel:+923394882800" className="flex items-center gap-3 text-white hover:text-white/80">
                <Phone className="w-5 h-5 flex-shrink-0" />
                +92 339 4882800
              </a>
              <div className="flex items-start gap-3 text-white">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  Office No. 503, Plot 67/3, Zulekha Trade Centre, Alamgir Rd, CP & Berar Society, Karachi, 75300
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4 text-white text-lg">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white hover:text-white/80 text-base">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-white text-lg">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white hover:text-white/80 text-base">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 text-white text-lg">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white hover:text-white/80 text-base">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white text-sm">© {new Date().getFullYear()} Buzz Filing. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="http://www.youtube.com/@BuzzFiling" className="text-white hover:text-white/80">
                <Youtube className="w-6 h-6" />
              </a>
              <a href="https://www.facebook.com/BuzzFiling/" className="text-white hover:text-white/80">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/company/buzzfiling/" className="text-white hover:text-white/80">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/buzzfiling/" className="text-white hover:text-white/80">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
          <p className="text-white text-sm mt-4 text-center md:text-left">
            Buzz Filing is a technology company. We are not a law firm, nor can we offer official legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
