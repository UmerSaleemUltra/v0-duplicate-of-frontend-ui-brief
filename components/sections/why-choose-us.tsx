"use client"

import { motion } from "framer-motion"
import { Globe, DollarSign, HeadphonesIcon, Building, Users, Check } from "lucide-react"

const features = [
  {
    icon: Globe,
    title: "Non-Resident Friendly",
    description: "Specialized services designed for international founders. No U.S. address or SSN required.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with no hidden fees. Know exactly what you'll pay before you start.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    description: "Real human support from compliance experts. Get answers when you need them most.",
  },
  {
    icon: Building,
    title: "Fintech & Banking",
    description: "Partnerships with top fintech providers for seamless business banking setup.",
  },
  {
    icon: Users,
    title: "Personal Guidance",
    description: "Not automated bots — real specialists who understand your unique business needs.",
  },
]

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-buzz-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #ffebec 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-medium text-sm uppercase tracking-wider" style={{ color: "#ff0d13" }}>
              Why Buzz Filing
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-5xl font-bold text-buzz-dark mt-4 mb-6">
              Built for Global Founders
            </h2>
            <p className="text-buzz-dark/70 text-lg mb-8 leading-relaxed">
              We understand the unique challenges international entrepreneurs face when starting a U.S. business. That's
              why we've built a service specifically designed to make it simple, transparent, and stress-free.
            </p>

            <div className="space-y-4">
              {["500+ founders served", "98% success rate", "24/7 dedicated support"].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#ff0d13" }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-buzz-dark font-medium text-base">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group flex gap-4 p-5 rounded-xl bg-buzz-off-white border border-buzz-dark/10 hover:shadow-lg transition-all duration-300"
                style={{
                  borderColor: "rgb(0 0 0 / 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ffcdd2"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgb(0 0 0 / 0.1)"
                }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: "#ffebec",
                  }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: "#ff0d13" }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-buzz-dark mb-1.5 text-base">{feature.title}</h3>
                  <p className="text-buzz-dark/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
