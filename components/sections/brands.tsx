"use client"

import { useState } from "react"

export default function Brands() {
  const brands = [
    {
      name: "Airwallex",
      logo: "https://cdn.brandfetch.io/idXCtf-53F/w/400/h/133.png",
    },
    { 
      name: "Payoneer", 
      logo: "https://cdn.brandfetch.io/idVmyDyyyZ/w/400/h/100.png" 
    },
    { 
      name: "Sunrate", 
      logo: "https://cdn.brandfetch.io/idY4rzp0Gt/w/400/h/116.png" 
    },
    {
      name: "Zyla",
      logo: "https://cdn.brandfetch.io/id1R4rkJXF/w/1024/h/280/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
    },
    {
      name: "Nsave",
      logo: "https://cdn.brandfetch.io/idtf53Ue7K/w/820/h/187/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
    },
  ]

  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set())

  const handleImageError = (brandName: string) => {
    console.log(`[v0] Failed to load ${brandName} logo`)
    setFailedLogos(prev => new Set(prev).add(brandName))
  }

  const handleImageLoad = (brandName: string) => {
    console.log(`[v0] Successfully loaded ${brandName} logo`)
  }

  return (
    <section
      aria-labelledby="partners-heading"
      className="relative w-full py-16 md:py-20 lg:py-24 bg-gradient-to-r from-[#880000] to-[#ff0d13] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="partners-heading"
          className="text-center text-white text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10"
        >
          Our business partners and cooperating institutions.
        </h2>

        {/* Desktop / Tablet Grid */}
        <div className="hidden sm:grid grid-cols-5 gap-4 justify-items-center items-center">
          {brands.map((b) => (
            <div key={b.name} className="flex items-center justify-center">
              <div
                className={`relative flex items-center justify-center h-[clamp(28px,6vw,72px)] ${b.name === "Nsave" ? "max-w-[130px]" : b.name === "Slash" ? "max-w-[120px]" : "max-w-[200px]"}`}
              >
                {b.logo && !failedLogos.has(b.name) ? (
                  <img
                    src={b.logo}
                    alt={`${b.name} logo`}
                    className="max-w-full max-h-full object-contain transition-opacity brightness-0 invert"
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(b.name)}
                    onLoad={() => handleImageLoad(b.name)}
                    crossOrigin="anonymous"
                  />
                ) : failedLogos.has(b.name) ? (
                  <div className="text-white text-lg font-bold tracking-wider">
                    {b.name}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Marquee */}
        <div className="block sm:hidden relative overflow-hidden mt-4">
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {brands.concat(brands).map((b, i) => (
              <div key={`${b.name}-${i}`} className="flex-shrink-0 flex items-center justify-center">
                <div className={`relative flex items-center justify-center h-[40px] ${b.name === "Nsave" ? "w-[80px]" : b.name === "Slash" ? "w-[70px]" : "w-[100px]"}`}>
                  {b.logo && !failedLogos.has(b.name) ? (
                    <img
                      src={b.logo}
                      alt={`${b.name} logo`}
                      className="max-w-full max-h-full object-contain opacity-90 brightness-0 invert"
                      loading="lazy"
                      decoding="async"
                      onError={() => handleImageError(b.name)}
                      onLoad={() => handleImageLoad(b.name)}
                      crossOrigin="anonymous"
                    />
                  ) : failedLogos.has(b.name) ? (
                    <div className="text-white text-base font-bold tracking-wider">
                      {b.name}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee Animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </section>
  )
}
