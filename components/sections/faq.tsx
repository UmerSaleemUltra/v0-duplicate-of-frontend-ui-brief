"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  name: string
  items: FAQItem[]
}

const faqData: FAQCategory[] = [
  {
    name: "Formation",
    items: [
      {
        question: "What is BuzzFiling?",
        answer:
          "BuzzFiling is a professional US business formation service that helps international entrepreneurs, especially from Pakistan and other countries, establish and manage their US-based LLCs and Corporations. We handle everything from initial registration to ongoing compliance.",
      },
      {
        question: "Can non-U.S. residents register a company?",
        answer:
          "Yes! Non-U.S. residents can absolutely register a US company. You don't need to be a US citizen or resident to form an LLC or Corporation. We specialize in helping international founders navigate the process seamlessly.",
      },
      {
        question: "How long does formation take?",
        answer:
          "Typically, the complete formation process takes 3-4 weeks. This includes state filing, EIN acquisition, and setting up your registered agent. We keep you updated at every step of the process.",
      },
      {
        question: "Do I get an EIN?",
        answer:
          "Yes! All our packages include EIN (Employer Identification Number) acquisition from the IRS. This is essential for opening bank accounts, hiring employees, and filing taxes in the US.",
      },
      {
        question: "Can BuzzFiling help me open a U.S. bank account?",
        answer:
          "Yes, we provide guidance and support for opening US bank accounts. We work with several banking partners that are friendly to international business owners and can facilitate remote account opening in many cases.",
      },
    ],
  },
  {
    name: "Compliance",
    items: [
      {
        question: "What is BOI filing?",
        answer:
          "BOI (Beneficial Ownership Information) filing is a federal requirement where companies must report information about their beneficial owners to FinCEN. We handle this filing for you to ensure compliance with federal regulations.",
      },
      {
        question: "Do I need to file annual reports?",
        answer:
          "Yes, most states require annual reports to maintain your company's good standing. We provide compliance support and reminders to ensure you never miss important deadlines.",
      },
      {
        question: "What happens if I miss a filing deadline?",
        answer:
          "Missing deadlines can result in penalties and loss of good standing. Our compliance monitoring service tracks all your deadlines and sends timely reminders to prevent any issues.",
      },
    ],
  },
  {
    name: "Services & Support",
    items: [
      {
        question: "Do you provide ongoing support?",
        answer:
          "We provide continuous support throughout your business journey. Our team is available via WhatsApp, email, and phone to answer questions and assist with any business needs.",
      },
      {
        question: "Can I upgrade my package later?",
        answer:
          "Yes, you can upgrade your package at any time. Simply contact our team and we'll help you add additional services like registered agent, compliance monitoring, or mail forwarding.",
      },
      {
        question: "What if I need to change my business structure?",
        answer:
          "We can help you with business structure changes, whether converting from LLC to Corporation or vice versa. Our team will guide you through the process and handle all necessary filings.",
      },
    ],
  },
]

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index)
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Got a question? Chances are, it's been asked before! Explore our collection of frequently asked questions.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {faqData.map((category, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveCategory(index)
                setOpenItem(null)
              }}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === index
                  ? "bg-[#ff0d13] text-white shadow-lg shadow-red-500/30"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqData[activeCategory].items.map((item, index) => {
            const isOpen = openItem === index

            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg md:text-xl font-semibold text-gray-900 pr-4">{item.question}</span>
                  <div className="flex-shrink-0">
                    {isOpen ? <Minus className="w-6 h-6 text-[#ff0d13]" /> : <Plus className="w-6 h-6 text-gray-400" />}
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
