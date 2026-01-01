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
      question: "Can a non-US resident form an LLC in the United States?",
      answer:
        "Yes. Non-US residents can legally form and fully own a U.S. LLC without visiting the United States. We assist international founders throughout the entire formation process.",
    },
    {
      question: "Which state is best for LLC formation for foreigners?",
      answer:
        "There is no single best state. Wyoming, New Mexico, Texas, Florida, and Montana are commonly chosen based on business activity.",
    },
    {
      question: "Can a non resident apply for an ITIN?",
      answer:
        "Yes. Buzz Filing assists non-residents with ITIN applications through an IRS-authorized Certified Acceptance Agent to support U.S. tax compliance.",
    },
    {
      question: "How long does it take to form a U.S. LLC?",
      answer:
        "State approval usually takes 2 to 7 business days, depending on the state. EIN issuance typically takes 7 to 15 business days and may take longer during peak IRS processing periods.",
    },
    {
      question: "Can I make changes to my company details after formation?",
      answer:
        "Yes. Changes such as company name, ownership, or address can be updated after formation through official amendment filings, and these changes involve additional state fees and service charges.",
    },
  ]

  const faqComplianceQuestions = [
    {
      question: "Why is a registered agent required for my U.S. company?",
      answer:
        "A registered agent is legally required to receive official state notices, legal documents, and compliance correspondence on behalf of your company and ensures you do not miss critical communications.",
    },
    {
      question: "What is an annual report and why is it important?",
      answer:
        "An annual report is a mandatory state filing that confirms your company's current details, such as address and ownership. Filing it on time keeps your company in good standing. Missing it can lead to late fees or suspension.",
    },
    {
      question: "Do I need to file taxes even if my company has no income?",
      answer:
        "Yes. U.S. companies, including foreign-owned LLCs, must file required federal tax forms even if there is no income or business activity during the year.",
    },
    {
      question: "What tax filings are required for my U.S. company?",
      answer:
        "Tax filing requirements depend on the company's structure and ownership. Required federal tax forms must be filed annually to remain compliant with IRS regulations, even when there is no income.",
    },
    {
      question: "What happens if I miss compliance requirements?",
      answer:
        "Missing compliance requirements such as maintaining a registered agent, filing annual reports, or completing tax filings can result in penalties, loss of good standing, or company suspension.",
    },
  ]

  const faqServicesQuestions = [
    {
      question: "Can I open a U.S. bank account as a non-resident?",
      answer:
        "Yes. Non-residents can open U.S. business bank accounts. Buzz Filing assists clients in applying for suitable banking and fintech solutions designed for international founders.",
    },
    {
      question: "Is an EIN required to open a U.S. business bank account?",
      answer: "Yes. An EIN is required by banks to identify the business for compliance and reporting purposes.",
    },
    {
      question: "Is it possible to open a U.S. business bank account remotely?",
      answer: "Yes. Many fintech providers allow remote business account opening without visiting the United States.",
    },
    {
      question: "Which banks and fintechs are you partnered with?",
      answer:
        "Buzz Filing assists clients with applications to selected fintech platforms, including Wise, Payoneer, Sunrate, Airwallex, and Zyla.",
    },
    {
      question: "Is it possible to open a traditional, physical U.S. bank account?",
      answer:
        "No. Opening a traditional physical U.S. bank account is generally not possible without visiting the United States in person, as most banks require branch visits and face to face verification.",
    },
  ]

  const tabContent = [
    { title: "Basics", questions: faqBasicQuestions },
    { title: "Compliance", questions: faqComplianceQuestions },
    { title: "Banking", questions: faqServicesQuestions },
  ]

  return (
    <section className="px-4 md:px-8 py-16 md:py-20 lg:py-24 bg-white mt-[-100px]" id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-0 py-2">
            <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Quick Answers</span>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-semibold text-center text-gray-900 mb-4 md:mb-6">
          Frequently Asked Questions
        </h2>
        <p className="text-sm md:text-base text-gray-600 text-center max-w-xl mx-auto mb-8 md:mb-12 leading-relaxed">
          Got a question? Chances are, it's been asked before! Explore our collection of frequently asked questions.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {tabContent.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              className={cn(
                "px-4 md:px-6 py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-500 ease-in-out cursor-pointer",
                selectedTab === index
                  ? "bg-[#ff0d13] text-white shadow-md scale-105 cursor-pointer"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer",
              )}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <br />
        <br />

        {tabContent[selectedTab].questions.map((faq, index) => (
          <div key={index}>
            <button
              onClick={() => toggleFaq(index)}
              className="w-full py-4 md:py-5 flex items-center justify-between text-left group cursor-pointer"
              aria-expanded={openFaq === index}
            >
              <span
                className={cn(
                  "text-sm md:text-lg font-medium transition-colors duration-500 ease-in-out pr-4",
                  openFaq === index ? "text-[#ff0d13]" : "text-gray-900 group-hover:text-[#ff0d13]",
                )}
              >
                {faq.question}
              </span>
              <span
                className={cn(
                  "text-xl md:text-2xl font-light flex-shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-500 ease-in-out",
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
                <div className="pb-4">
                  <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  )
}
