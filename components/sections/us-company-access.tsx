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
    <section className="pt-8 pb-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto text-center">
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


      </div>
    </section>
  )
}
