"use client"

const platforms = [
  { name: "Stripe", src: "https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
  { name: "PayPal", src: "https://cdn.brandfetch.io/id-Wd4a4TS/theme/dark/id31tBizMM.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
  { name: "Amazon", src: "https://cdn.brandfetch.io/idawOgYOsG/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
  { name: "eBay", src: "https://cdn.brandfetch.io/idjTS-RPU1/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
  { name: "Airwallex", src: "https://cdn.brandfetch.io/idXCtf-53F/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
  { name: "Payoneer", src: "https://cdn.brandfetch.io/idVmyDyyyZ/w/800/h/156/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1667571027582" },
  { name: "Sunrate", src: "https://cdn.brandfetch.io/idY4rzp0Gt/w/820/h/94/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1769383332682", filter: "brightness(0)" },
  { name: "Nsave", src: "https://cdn.brandfetch.io/idtf53Ue7K/w/820/h/187/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B" },
]

export default function UsCompanyAccess() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-red-200 text-[#d81c20] bg-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Trusted by Global Entrepreneurs
        </div>

        {/* Heading with brand gradient on accent */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-balance mb-4 text-slate-900">
          With a{" "}
          <span className="text-[#d81c20]">US Company</span>
          <br />
          you can access
        </h2>

        {/* Subtitle */}
        <p className="text-base leading-relaxed max-w-lg mx-auto mb-12 text-slate-500">
          Unlock the power of US business infrastructure and access the world&apos;s leading platforms and services
        </p>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {platforms.map(({ name, src, filter }) => (
            <div
              key={name}
              className="flex items-center justify-center px-6 h-24 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-red-200 transition-all duration-200"
            >
              <img
                src={src}
                alt={name}
                className="h-10 w-auto object-contain"
                crossOrigin="anonymous"
                style={filter ? { filter } : undefined}
              />
            </div>
          ))}
        </div>

        {/* CTA Link */}
        <div className="mt-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm border border-slate-200 bg-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Ready to get started?</span>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector("#home")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="font-bold text-[#d81c20] transition-opacity hover:opacity-80"
            >
              Start Your US Company
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
