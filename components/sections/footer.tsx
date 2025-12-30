"use client"
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react"

const footerLinks = {
  services: [
    { name: "LLC Formation", href: "#services" },
    { name: "EIN Registration", href: "#services" },
    { name: "Bank Account", href: "#services" },
    { name: "Registered Agent", href: "#services" },
    { name: "Business Address", href: "#services" },
  ],
  company: [
    { name: "About Us", href: "#about" },
    { name: "Pricing", href: "#pricing" },
    { name: "Process", href: "#process" },
    { name: "Contact", href: "#contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy", href: "/refund" },
  ],
}

export default function Footer() {
  return (
    <footer id="contact" className="relative py-16 md:py-20 lg:py-24 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 sm:col-span-2">
            <a href="#" className="inline-block mb-6">
              <img
                src="/images/buzz-filing-logo-white.png"
                alt="BuzzFiling"
                className="h-auto w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px]"
              />
            </a>
            <p className="text-white/90 text-sm md:text-base mb-6 max-w-sm leading-relaxed">
              Simplifying US business formation for entrepreneurs worldwide. Your trusted partner in building global
              businesses.
            </p>
            <div className="space-y-3 text-sm md:text-base">
              <a
                href="mailto:hello@buzzfiling.com"
                className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5 md:w-5 md:h-5 text-white shrink-0" />
                <span>hello@buzzfiling.com</span>
              </a>
              <a
                href="tel:+923394882800"
                className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 md:w-5 md:h-5 text-white shrink-0" />
                <span>+92 339 4882800</span>
              </a>
              <div className="flex items-start gap-3 text-white/90">
                <MapPin className="w-5 h-5 md:w-5 md:h-5 text-white shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Office No. 503, Plot 67/3, Zulekha Trade Centre, Alamgir Rd, CP & Berar Society, Karachi, 75300
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-base md:text-lg mb-4 text-white">Services</h4>
            <ul className="space-y-2.5 text-sm md:text-base">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/90 hover:text-white transition-colors inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-base md:text-lg mb-4 text-white">Company</h4>
            <ul className="space-y-2.5 text-sm md:text-base">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/90 hover:text-white transition-colors inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-base md:text-lg mb-4 text-white">Legal</h4>
            <ul className="space-y-2.5 text-sm md:text-base">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/90 hover:text-white transition-colors inline-block">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <p className="text-white/90 text-xs sm:text-sm">
              © {new Date().getFullYear()} BuzzFiling. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://www.facebook.com/buzzfiling"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6 text-white" />
              </a>
              <a
                href="https://www.instagram.com/buzzfiling/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 text-white" />
              </a>
              <a
                href="https://www.linkedin.com/company/buzzfiling"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>
          <p className="text-white/80 text-xs sm:text-sm text-center md:text-left leading-relaxed">
            BuzzFiling is a technology company. We are not a law firm, nor can we offer official legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
