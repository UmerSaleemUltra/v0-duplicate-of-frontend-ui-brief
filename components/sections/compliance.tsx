"use client"

import { FileText, CheckCircle, Shield, RefreshCw, FileCheck, Users } from "lucide-react"

const complianceServices = [
  {
    icon: FileText,
    title: "Compliance Genius",
    description: "Automated compliance monitoring",
  },
  {
    icon: FileCheck,
    title: "Annual Report Filing",
    description: "State-required annual filings",
  },
  {
    icon: Shield,
    title: "BOI Report Requirement",
    description: "FinCEN BOI compliance",
  },
  {
    icon: CheckCircle,
    title: "Tax Filing Assistant",
    description: "Federal and state tax support",
  },
  {
    icon: RefreshCw,
    title: "Good Standing Status",
    description: "Maintain company compliance",
  },
  {
    icon: Users,
    title: "Ongoing Guidance",
    description: "Expert compliance advice",
  },
]

const complianceFeatures = [
  {
    icon: FileCheck,
    title: "Annual State Filings",
    description:
      "We file your required annual report or statement of information with your state on time. It's included with each package, so you never have to worry about missing deadlines.",
  },
  {
    icon: FileText,
    title: "Federal Tax Returns",
    description:
      "If required by your business structure (for example, if you have multiple members), we assist with federal income tax return filing or connect you with the right resources.",
  },
  {
    icon: Shield,
    title: "FinCEN BOI Reports",
    description:
      "We ensure your company stays compliant with FinCEN's Beneficial Ownership Information reporting requirements, avoiding penalties and legal issues.",
  },
  {
    icon: RefreshCw,
    title: "Ownership Maintenance",
    description:
      "Anytime you bring on a new member or partner, we help you promptly update your company's ownership records and file the necessary amendments.",
  },
  {
    icon: Users,
    title: "Ongoing Guidance",
    description:
      "Need help navigating state tax requirements, franchise tax, or local business laws? Our team is available year-round to answer your questions and guide you through potential roadblocks.",
  },
]

export default function ComplianceSection() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-r from-[#880000] to-[#ff0d13] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-0 py-2">
              <span className="text-sm font-bold text-white uppercase tracking-wide">Stay Compliant</span>
            </div>
          </div>

          <h2 className="text-white text-3xl md:text-4xl font-semibold mb-4">
            Compliance & Tax
            <br />
            Peace of Mind
          </h2>

          <p className="text-white/90 text-lg max-w-3xl mx-auto">
            Running a U.S. business (even abroad) doesn't mean worrying about compliance, tax filings, or the status of
            your company. We handle all the paperwork so you can focus on growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Service List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Compliance Services</h3>
            <div className="space-y-3">
              {complianceServices.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <service.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{service.title}</p>
                    <p className="text-sm text-white/70">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Feature Details */}
          <div className="space-y-6">
            {complianceFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-white/80 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
