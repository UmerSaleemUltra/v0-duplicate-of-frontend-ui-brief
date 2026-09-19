export default function MarqueeBanner() {
  return (
    <div className="relative overflow-hidden bg-[#880000] py-12 mt-[-20px]">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* First set of items */}
        <div className="flex items-center gap-8 px-4">
          <span className="text-2xl font-bold text-white">STARTUP FRIENDLY</span>
          <span className="text-2xl text-white/60">✦</span>
          <span className="text-2xl font-bold text-white">FASTER RESPONSE TIME</span>
          <span className="text-2xl text-white/60">✦</span>
          <span className="text-2xl font-bold text-white">FASTER RESPONSE TIME</span>
          <span className="text-2xl text-white/60">✦</span>
          <span className="text-2xl font-bold text-white">STARTUP FRIENDLY</span>
          <span className="text-2xl text-white/60">✦</span>
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="flex items-center gap-8 px-4">
          <span className="text-2xl font-bold text-white">STARTUP FRIENDLY</span>
          <span className="text-2xl text-white/60">✦</span>
          <span className="text-2xl font-bold text-white">FASTER RESPONSE TIME</span>
          <span className="text-2xl text-white/60">✦</span>
          <span className="text-2xl font-bold text-white">FASTER RESPONSE TIME</span>
          <span className="text-2xl text-white/60">✦</span>
          <span className="text-2xl font-bold text-white">STARTUP FRIENDLY</span>
          <span className="text-2xl text-white/60">✦</span>
        </div>
      </div>
    </div>
  )
}
