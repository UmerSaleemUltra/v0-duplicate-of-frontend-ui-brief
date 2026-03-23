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
      className="w-full py-16 md:py-20 lg:py-24 bg-white"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Badge */}
        <p className="text-sm font-extrabold tracking-widest uppercase text-[#cc0000] mb-8 text-center">
          Trusted by Global Entrepreneurs
        </p>

        {/* Heading */}
        <h2
          id="us-access-heading"
          className="text-3xl md:text-4xl font-semibold text-center text-[#1a0a0a] leading-tight mb-4 text-balance"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-6 px-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <img
                src={platform.logo}
                alt={`${platform.name} logo`}
                className={`h-8 md:h-10 w-auto max-w-[120px] object-contain ${
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
