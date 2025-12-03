"use client"

import { CheckCircle } from "lucide-react"

export default function LLCFormationSection() {
  const steps = [
    {
      week: "Week 1",
      title: "Order Placed & Verification",
      description: "We verify your business details and prepare documents",
      icon: "📝",
    },
    {
      week: "Week 2",
      title: "State Filing",
      description: "Your formation documents are filed with the state",
      icon: "🏛️",
    },
    {
      week: "Week 3",
      title: "EIN Application",
      description: "We obtain your Federal Tax ID from the IRS",
      icon: "🔢",
    },
    {
      week: "Week 4",
      title: "Completion & Delivery",
      description: "All documents delivered to your dashboard",
      icon: "✅",
    },
  ]

  return (
    <section className="py-20 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Your LLC in 4 Weeks</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our streamlined process gets your business up and running quickly
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="text-sm font-semibold text-red-600 mb-2">{step.week}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-0.5 bg-red-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center space-x-2 text-green-600">
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold text-lg">Guaranteed 4-week delivery or your money back</span>
        </div>
      </div>
    </section>
  )
}
