"use client"

import { motion } from "framer-motion"
import { ClipboardList, FileInput, Settings, Rocket } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Choose Service",
    description: "Select the formation package that fits your business needs.",
  },
  {
    number: "02",
    icon: FileInput,
    title: "Share Details",
    description: "Provide your information through our secure online platform.",
  },
  {
    number: "03",
    icon: Settings,
    title: "We Handle Filings",
    description: "Our experts prepare and submit all required documents.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Start Your Business",
    description: "Receive your documents and begin operating your U.S. company.",
  },
]

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#880000] to-[#ff0d13]" />

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

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-0 py-2">
              <span className="text-sm font-bold text-white uppercase tracking-wide">Simple Process</span>
            </div>
          </div>
          <h2 className="text-white text-3xl md:text-4xl font-semibold mt-4 mb-4">How It Works</h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Get your U.S. business up and running in four simple steps.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-white/20" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step Number Badge */}
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center relative z-10 backdrop-blur-sm">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#880000] font-bold text-sm shadow-lg">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-white mb-3">{step.title}</h3>

                <p className="text-white/80 max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
