"use client"

const platforms = [
  {
    name: "Stripe",
    logo: "https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "PayPal",
    logo: "https://cdn.brandfetch.io/id-Wd4a4TS/theme/dark/id31tBizMM.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "Amazon",
    logo: "https://cdn.brandfetch.io/idawOgYOsG/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "eBay",
    logo: "https://cdn.brandfetch.io/idjTS-RPU1/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "Airwallex",
    logo: "https://cdn.brandfetch.io/idXCtf-53F/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "Payoneer",
    logo: "https://cdn.brandfetch.io/idVmyDyyyZ/w/800/h/156/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1667571027582",
  },
  {
    name: "Sunrate",
    logo: "https://cdn.brandfetch.io/idY4rzp0Gt/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    hasBlackFilter: true,
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
      className="w-full py-12 md:py-14 lg:py-16 bg-white"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with Badge */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-0 py-2">
              <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Global Access</span>
            </div>
          </div>
          <h2
            id="us-access-heading"
            className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4"
          >
            Access Global Platforms
          </h2>
          <p className="text-gray-600 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-6">
            Open doors to international markets with US company.
          </p>
        </div>

        {/* Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className={`flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-6 px-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                platform.name === "Stripe" ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <img
                src={platform.logo}
                alt={`${platform.name} logo`}
                className={`${
                  platform.name === "Stripe" ? "h-12 md:h-16" : "h-8 md:h-10"
                } w-auto max-w-[120px] object-contain ${
                  platform.hasBlackFilter ? "filter brightness-0" : ""
                }`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
