"use client"

import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import Image from "next/image"

const regions = [
  { name: "Pakistan", code: "pk", flagUrl: "https://flagcdn.com/w40/pk.png" },
  { name: "UAE", code: "ae", flagUrl: "https://flagcdn.com/w40/ae.png" },
  { name: "United Kingdom", code: "gb", flagUrl: "https://flagcdn.com/w40/gb.png" },
  { name: "India", code: "in", flagUrl: "https://flagcdn.com/w40/in.png" },
  { name: "Europe", code: "eu", flagUrl: "https://flagcdn.com/w40/eu.png" },
  { name: "Asia Pacific", code: "", icon: "🌏" },
  { name: "Middle East", code: "", icon: "🌍" },
  { name: "Africa", code: "", icon: "🌍" },
]

const GlobalFounders = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#880000] via-[#cc0000] to-[#ff0d13]" />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Decorative Globe Pattern */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-[600px] h-[600px] rounded-full border border-white/40" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-white/30" />
        <div className="absolute w-[1000px] h-[1000px] rounded-full border border-white/20" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-white/80 font-medium text-sm uppercase tracking-wider">Global Reach</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Founders We Help Worldwide
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Trusted by entrepreneurs across the globe to start and scale their U.S. businesses.
          </p>
        </motion.div>

        {/* Region Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          {regions.map((region, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
            >
              {region.code ? (
                <>
                 
                  <div className="relative w-6 h-6 rounded-sm overflow-hidden">
                    <Image
                      src={region.flagUrl! || "/placeholder.svg"}
                      alt={`${region.name} flag`}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                  </div>
                </>
              ) : (
                <span className="text-2xl">{region.icon}</span>
              )}
              <span className="font-medium text-white">{region.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "30+", label: "Countries Served" },
            { value: "500+", label: "Happy Founders" },
            { value: "50", label: "U.S. States" },
            { value: "4 Weeks", label: "Average Setup Time" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm"
            >
              <div className="font-display text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/90">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/30 backdrop-blur-sm">
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white">
              Helping founders from <span className="font-semibold">30+ countries</span> start U.S. businesses
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default GlobalFounders
