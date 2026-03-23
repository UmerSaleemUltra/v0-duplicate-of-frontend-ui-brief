"use client"

import Link from "next/link"

const platforms = [
  {
    name: "Stripe",
    logo: "https://cdn.brandfetch.io/idxAg10C0L/w/820/h/180/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX",
  },
  {
    name: "PayPal",
    logo: "https://cdn.brandfetch.io/id-IBRRPOb/w/820/h/180/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX",
  },
  {
    name: "Amazon",
    logo: "https://cdn.brandfetch.io/idawOgYOsG/w/820/h/180/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX",
  },
  {
    name: "eBay",
    logo: "https://cdn.brandfetch.io/idnrCPuv87/w/820/h/180/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX",
  },
  {
    name: "Airwallex",
    logo: "https://cdn.brandfetch.io/idXCtf-53F/w/800/h/110/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1764298515500",
  },
  {
    name: "Payoneer",
    logo: "https://cdn.brandfetch.io/idVmyDyyyZ/w/800/h/156/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1667571027582",
  },
  {
    name: "Sunrate",
    logo: "https://cdn.brandfetch.io/idY4rzp0Gt/w/820/h/94/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1769383332682",
  },
  {
    name: "Nsave",
    logo: "https://cdn.brandfetch.io/idtf53Ue7K/w/820/h/187/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
  },
]

export default function USAccessSection() {
  return (
    <section
      aria-labelledby="us-access-heading"
      className="w-full py-16 md:py-24 bg-white"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 font-medium">Trusted by Global Entrepreneurs</span>
        </div>

        {/* Heading */}
        <h2
          id="us-access-heading"
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-[#1a0a0a] leading-tight mb-4 text-balance"
        >
          With a{" "}
          <span className="text-[#880000]">US Company</span>
          <br />
          you can access
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-base md:text-lg text-center max-w-xl leading-relaxed mb-12">
          Unlock the power of US business infrastructure and access the world&apos;s leading platforms and services
        </p>

        {/* Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full mb-12">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-6 px-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <img
                src={platform.logo}
                alt={`${platform.name} logo`}
                className="h-8 md:h-10 w-auto max-w-[120px] object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* CTA Pill */}
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-white shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-500">Ready to get started?</span>
          <Link
            href="/checkout"
            className="text-sm font-bold text-[#880000] hover:text-[#ff0d13] transition-colors"
          >
            Start Your US Company &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
