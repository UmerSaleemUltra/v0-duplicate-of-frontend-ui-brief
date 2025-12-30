import { motion } from "framer-motion";
import {  Mail, Phone, MapPin, Instagram, Linkedin, Youtube, Facebook } from "lucide-react";

const footerLinks = {
  services: [
    { name: "LLC Formation", href: "#services" },
    { name: "EIN Registration", href: "#services" },
    { name: "Bank Account", href: "#services" },
    { name: "ITIN", href: "#services" },
    { name: "Trademark", href: "#services" },
  ],
  company: [
    { name: "About Us", href: "#about" },
    { name: "Pricing", href: "#pricing" },
    { name: "Process", href: "#process" },
    { name: "Contact", href: "#contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Refund Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative pt-16 md:pt-24 pb-8">
      {/* CTA Section */}
      

      {/* Footer Content */}
      <div className="container mx-auto px-4 lg:px-8 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center mb-6">
              <img src="/images/buzz-filing-logo-white.png" alt="IncoFiling"
              className="h-auto w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] ml-[-10px]"
/>
            </a>
            <p className="text-white mb-6 max-w-sm">
              Simplifying US business formation for entrepreneurs worldwide. Your trusted partner in building global businesses.
            </p>
            <div className="space-y-3">
              <a href="mailto:support@incofiling.com" className="flex items-center gap-3 text-white ">
                <Mail className="w-5 h-5 text-accent" />
                support@incofiling.com
              </a>
              <a href="tel:+923092935757" className="flex items-center gap-3 text-white ">
                <Phone className="w-5 h-5 text-accent" />
                +92 309 293 5757
              </a>
              <div className="flex items-start gap-3 text-white">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Office No. 503, Plot 67/3, Zulekha Trade Centre, Alamgir Rd, CP & Berar Society, Karachi, 75300</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-bold mb-4 text-white">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white ">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white ">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white ">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white text-sm">
              © {new Date().getFullYear()} Inco Filing. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white ">
                <Youtube/>
              </a>
              <a href="#" className="text-white ">
                <Facebook/>
              </a>
              <a href="#" className="text-white ">
                <Linkedin/>
              </a>
              <a href="#" className="text-white ">
              <Instagram/>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
