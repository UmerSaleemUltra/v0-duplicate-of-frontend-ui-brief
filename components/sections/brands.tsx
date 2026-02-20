"use client"

export default function Brands() {
  const brands = [
    { name: "Airwallex" },
    { name: "Payoneer" },
    { name: "Sunrate" },
    { name: "Wise" },
    { name: "Zyla" },
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
                <svg
                  width="200"
                  height="60"
                  viewBox="0 0 200 60"
                  className="max-w-full max-h-full"
                  aria-label={`${b.name} logo`}
                >
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="white"
                    fontSize="20"
                    fontWeight="600"
                    letterSpacing="0.5"
                  >
                    {b.name}
                  </text>
                </svg>
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
                  <svg
                    width="120"
                    height="40"
                    viewBox="0 0 120 40"
                    className="max-w-full max-h-full"
                    aria-label={`${b.name} logo`}
                  >
                    <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="white"
                      fontSize="16"
                      fontWeight="600"
                      letterSpacing="0.5"
                    >
                      {b.name}
                    </text>
                  </svg>
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
