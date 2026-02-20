"use client"

export default function Brands() {
  const brands = [
    { 
      name: "Airwallex",
      logo: "https://cdn.brandfetch.io/idXCtf-53F/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B"
    },
    { 
      name: "Payoneer",
      logo: "https://cdn.brandfetch.io/idVmyDyyyZ/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B"
    },
    { 
      name: "Sunrate",
      logo: "https://cdn.brandfetch.io/idY4rzp0Gt/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B"
    },
    { 
      name: "Wise",
      logo: "https://cdn.brandfetch.io/id1R4rkJXF/w/1024/h/280/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B"
    },
    { 
      name: "Zyla",
      logo: "https://cdn.brandfetch.io/idtf53Ue7K/w/820/h/187/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B"
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
        <div className="hidden sm:grid grid-cols-5 gap-4 justify-items-center items-center">
          {brands.map((b) => (
            <div key={b.name} className="flex items-center justify-center">
              <div className="relative flex items-center justify-center h-[clamp(28px,6vw,72px)] max-w-[200px]">
                <img
                  src={b.logo}
                  alt={`${b.name} logo`}
                  className="max-w-full max-h-full object-contain transition-opacity brightness-0 invert"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Marquee */}
        <div className="block sm:hidden relative overflow-hidden mt-4">
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {brands.concat(brands).map((b, i) => (
              <div key={`${b.name}-${i}`} className="flex-shrink-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center h-[40px] w-[120px]">
                  <img
                    src={b.logo}
                    alt={`${b.name} logo`}
                    className="max-w-full max-h-full object-contain opacity-90 brightness-0 invert"
                    loading="lazy"
                  />
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
