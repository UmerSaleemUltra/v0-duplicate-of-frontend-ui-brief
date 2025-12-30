"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState(0)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const handleTabChange = (index: number) => {
    setSelectedTab(index)
    setOpenFaq(null)
  }

  const faqBasicQuestions = [
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
  ]

  const faqComplianceQuestions = [
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
    {
      question: "Do I need a U.S. address?",
      answer:
        "Yes, every U.S. company requires a U.S. business address. BuzzFiling provides a compliant address with mail handling to meet legal and banking requirements.",
    },
    {
      question: "Can I change company details later?",
      answer:
        "Yes, you can update your company name, members, or structure anytime. BuzzFiling helps by filing the necessary amendments with the state.",
    },
  ]

  const faqServicesQuestions = [
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
    {
      question: "What add-on services does BuzzFiling provide?",
      answer:
        "BuzzFiling offers reseller permits, business addresses, dedicated VPS servers, and more. These add-ons give your business the extra tools it needs to succeed.",
    },
    {
      question: "How do I contact customer support?",
      answer:
        "You can reach BuzzFiling via email, WhatsApp, or your client dashboard. Our team is available to guide you at every step of the journey.",
    },
  ]

  const tabContent = [
    { title: "Formation", questions: faqBasicQuestions },
    { title: "Compliance", questions: faqComplianceQuestions },
    { title: "Services & Support", questions: faqServicesQuestions },
  ]

  return (
    <section className="px-4 md:px-8 py-16 md:py-20 lg:py-24 bg-white mt-[-70px]" id="faq">
      <div className="max-w-4xl mx-auto">
        <div>
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-0 py-2">
              <span className="text-xs sm:text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Quick Answers</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-center text-gray-900 mb-4 md:mb-6 px-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center max-w-xl mx-auto mb-8 md:mb-12 leading-relaxed px-4">
            Got a question? Chances are, it's been asked before! Explore our collection of frequently asked questions.
          </p>
        </div>

        <div className="mb-8 md:mb-12 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max px-2 pb-2">
            {tabContent.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(index)}
                className={cn(
                  "px-6 md:px-8 py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-300 whitespace-nowrap",
                  selectedTab === index
                    ? "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200",
                )}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-0">
          {tabContent[selectedTab].questions.map((faq, index) => (
            <div key={index}>
              <button
                onClick={() => toggleFaq(index)}
                className="w-full py-4 md:py-5 flex items-center justify-between text-left group cursor-pointer"
                aria-expanded={openFaq === index}
              >
                <span
                  className={cn(
                    "text-sm sm:text-base md:text-lg font-medium transition-colors duration-500 ease-in-out pr-4 break-words",
                    openFaq === index ? "text-[#ff0d13]" : "text-gray-900 group-hover:text-[#ff0d13]",
                  )}
                >
                  {faq.question}
                </span>
                <span
                  className={cn(
                    "text-xl sm:text-xl md:text-2xl font-light flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-all duration-500 ease-in-out",
                    openFaq === index ? "text-[#ff0d13] rotate-45" : "text-gray-900 rotate-0",
                  )}
                >
                  +
                </span>
              </button>

              <div
                className={cn(
                  "grid transition-all duration-500 ease-in-out",
                  openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="pb-4 pr-2 sm:pr-4">
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 font-light leading-relaxed break-words">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
