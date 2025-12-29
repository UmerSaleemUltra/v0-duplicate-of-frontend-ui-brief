"use client"
import { Mail, Phone, MapPin } from "lucide-react"

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
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center mb-6">
              <img src="/images/buzz-filing-logo.png" alt="BuzzFiling" className="h-14 w-auto" />
            </a>
            <p className="text-white/90 mb-6 max-w-sm">
              Simplifying US business formation for entrepreneurs worldwide. Your trusted partner in building global
              businesses.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:hello@buzzfiling.com"
                className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5 text-white shrink-0" />
                hello@buzzfiling.com
              </a>
              <a
                href="tel:+923394882800"
                className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 text-white shrink-0" />
                +92 339 4882800
              </a>
              <div className="flex items-start gap-3 text-white/90">
                <MapPin className="w-5 h-5 text-white shrink-0" />
                <span>
                  Office No. 503, Plot 67/3, Zulekha Trade Centre, Alamgir Rd, CP & Berar Society, Karachi, 75300
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4 text-white">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/90 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/90 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white/90 hover:text-white transition-colors">
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
            <p className="text-white/90 text-sm">© {new Date().getFullYear()} BuzzFiling. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a
                href="https://www.facebook.com/buzzfiling"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/buzzfiling/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/buzzfiling"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-4 text-center md:text-left">
            BuzzFiling is a technology company. We are not a law firm, nor can we offer official legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
