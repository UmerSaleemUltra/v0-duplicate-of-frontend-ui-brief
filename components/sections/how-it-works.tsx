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
    <section className="py-24 relative overflow-hidden">
      {/* Red Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary" />

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
          <span className="text-primary-foreground/80 font-medium text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mt-4 mb-6">
            How It Works
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
            Get your U.S. business up and running in four simple steps.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-primary-foreground/20" />

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
                  <div className="w-20 h-20 rounded-full bg-primary-foreground/10 border-2 border-primary-foreground/30 flex items-center justify-center relative z-10 backdrop-blur-sm">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-bold text-sm shadow-lg">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-primary-foreground mb-3">{step.title}</h3>

                <p className="text-primary-foreground/70 max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
