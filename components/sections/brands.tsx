"use client"

import Image from "next/image"

export default function Brands() {
  const brands = [
    {
      name: "Airwallex",
      logo: "https://cdn.brandfetch.io/idXCtf-53F/theme/light/idFqBtrNJv.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    },
    { name: "Payoneer", logo: "https://cdn.brandfetch.io/idVmyDyyyZ/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
    { name: "Sunrate", logo: "https://cdn.brandfetch.io/idY4rzp0Gt/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
    {
      name: "Zyla",
      logo: "https://cdn.brandfetch.io/id1R4rkJXF/w/1024/h/280/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
    },
    {
      name: "Openphone",
      logo: "https://cdn.brandfetch.io/id8eCYh_qw/theme/light/iddDfghnAG.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    },
  ]

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
        <div className="hidden sm:grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          {brands.map((b, index) => (
            <div key={b.name} className="flex items-center justify-center">
              <div
                className={`relative w-full h-[clamp(28px,6vw,72px)] ${b.name === "Slash" ? "max-w-[120px]" : "max-w-[200px]"}`}
              >
                {b.logo && (
                  <Image
                    src={b.logo || "/placeholder.svg"}
                    alt={`${b.name} logo`}
                    fill
                    className="object-contain transition-opacity brightness-0 invert"
                    sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 200px"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Marquee */}
        <div className="block sm:hidden relative overflow-hidden mt-4">
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {brands.concat(brands).map((b, i) => (
              <div key={`${b.name}-${i}`} className="flex-shrink-0 flex items-center justify-center">
                <div className={`relative h-[40px] ${b.name === "Slash" ? "w-[70px]" : "w-[100px]"}`}>
                  {b.logo && (
                    <Image
                      src={b.logo || "/placeholder.svg"}
                      alt={`${b.name} logo`}
                      fill
                      className="object-contain opacity-90 brightness-0 invert"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
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
