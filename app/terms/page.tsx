import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"

export const metadata = {
  title: "Terms and Conditions - BuzzFiling",
  description: "Read BuzzFiling's terms and conditions for using our US business formation services.",
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto overflow-hidden">
          {/* Header */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-center">Terms and Conditions</h1>
          <p className="text-md sm:text-lg font-light max-w-2xl mx-auto text-center mb-8">
            PLEASE READ THIS LEGAL DISCLAIMER AND TERMS OF SERVICE CAREFULLY BEFORE ACCESSING OUR WEBSITE OR USING OUR
            SERVICES
          </p>

          {/* Content */}
          <section className="px-6 sm:px-10 py-8 space-y-8">
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Welcome to Buzz Filing. By using our website, services, and products, you agree to abide by the
                following Terms and Conditions. Please read these carefully before proceeding.
              </p>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Buzz Filing, a division of Buzz Filing ., provides U.S. company formation services, business compliance
                solutions, and fintech account setup assistance. These services are subject to state and federal
                regulations as well as third-party service provider terms and conditions.
              </p>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Services Provided</h2>
              <p className="text-gray-700 leading-relaxed mb-2">Buzz Filing offers the following services:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>U.S. Company Formation (LLCs, C-Corps, etc.)</li>
                <li>EIN (Employer Identification Number) Registration</li>
                <li>Registered Agent Services</li>
                <li>Standard Business Address and Mail Forwarding</li>
                <li>FinCEN BOI Report Filing</li>
                <li>Annual Compliance and Tax Filing Assistance</li>
                <li>U.S. Business Bank Account Assistance</li>
                <li>Merchant Account Setup Assistance</li>
                <li>Business Consultation and Support</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-2">
                All services are subject to the applicable fees and legal requirements.
              </p>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed">
                Buzz Filing assists clients in applying for fintech business bank accounts and merchant accounts (e.g.,
                Wise, Payoneer, Mercury, Stripe, PayPal, Slash, Square, Zyla). These accounts are subject to each
                provider's independent review and approval process. Buzz Filing does not guarantee approval and is not
                responsible for any rejections.
              </p>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Payment Terms</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>
                  A 70% upfront payment is required to initiate services, with the remaining 30% due upon EIN
                  acquisition.
                </li>
                <li>
                  All payments must be made as per the agreed terms before service completion unless otherwise
                  specified.
                </li>
                <li>We accept payments via credit/debit card, bank transfer, and other approved methods.</li>
                <li>
                  Any state or federal fees associated with your business formation are the client's responsibility.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Refund Policy</h2>

              <h3 className="text-xl font-semibold text-[#ff0d13] mt-6">Eligibility for Refunds</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                Refunds are only available under the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>If Buzz Filing has not initiated the service request.</li>
                <li>If there is an error on our part preventing the service from being completed.</li>
                <li>If a client cancels before the service process has begun.</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#ff0d13] mt-6">Non-Refundable Items</h3>
              <p className="text-gray-700 leading-relaxed mb-2">The following are strictly non-refundable:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>State Filing Fees (paid directly to the state government).</li>
                <li>Registered Agent Fees (once the service is activated).</li>
                <li>Business Address Fees (once the address is assigned).</li>
                <li>
                  Any services that have been processed, partially completed, or submitted to third-party providers.
                </li>
                <li>
                  Failure to pay the remaining 30% after EIN acquisition will result in immediate suspension of
                  services, withholding of all documents, and potential legal action for non-payment. Late fees and
                  collection costs may also apply.
                </li>
                <li>
                  If the outstanding balance remains unpaid, we reserve the right to initiate company dissolution in
                  accordance with state laws, which may result in the permanent closure of your business.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-[#ff0d13] mt-6">Third-Party Account Refunds</h3>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>
                  If a third-party provider (e.g., Wise, Payoneer, Mercury, Stripe, PayPal, Slash, Square, Zyla) rejects
                  an application, Buzz Filing is not responsible for issuing refunds.
                </li>
                <li>Clients must contact the respective provider for any disputes or reconsideration requests.</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#ff0d13] mt-6">Refund Processing</h3>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Approved refunds will be processed within 10-15 business days.</li>
                <li>Refunds will be issued to the original payment method used.</li>
                <li>Any applicable transaction fees will be deducted from the refund amount.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Client Responsibilities</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Clients must provide accurate and complete information for all service applications.</li>
                <li>Clients must comply with all U.S. business regulations and third-party provider requirements.</li>
                <li>
                  Buzz Filing is not responsible for any legal or compliance issues arising from false or misleading
                  information provided by the client.
                </li>
                <li>
                  Clients are responsible for keeping their contact information updated to receive timely notifications
                  regarding compliance, renewals, and other important matters.
                </li>
                <li>
                  Clients must ensure timely payment for any renewals or annual compliance requirements to maintain
                  their business in good standing.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Service Limitations & Liability</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>
                  Buzz Filing does not provide legal, financial, or tax advisory services. Clients should consult
                  licensed professionals where necessary.
                </li>
                <li>
                  Buzz Filing is not responsible for delays caused by government agencies or third-party service
                  providers.
                </li>
                <li>
                  In no event shall Buzz Filing be liable for indirect, incidental, or consequential damages arising
                  from the use of our services.
                </li>
                <li>
                  Buzz Filing shall not be liable for any losses arising from the client's failure to comply with state
                  or federal regulations.
                </li>
                <li>
                  Buzz Filing is not responsible for any business decisions made by clients after forming their company.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Confidentiality & Data Protection</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>
                  Buzz Filing maintains the confidentiality of all client information. Client data is securely stored
                  and used solely for the purpose of providing services.
                </li>
                <li>
                  Buzz Filing does not sell, rent, or disclose client information to third parties except as required by
                  law.
                </li>
                <li>
                  Clients are responsible for safeguarding their account login credentials and must notify Buzz Filing
                  immediately if they suspect unauthorized access.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Intellectual Property Rights</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>
                  All website content, branding, logos, and materials provided by Buzz Filing are the intellectual
                  property of Buzz Filing Inc.
                </li>
                <li>
                  Clients may not copy, distribute, or use Buzz Filing's proprietary content without prior written
                  consent.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Termination of Services</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Buzz Filing reserves the right to terminate services under the following conditions:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>If a client violates any terms outlined in this document.</li>
                <li>If fraudulent or misleading information is provided.</li>
                <li>If Buzz Filing deems the request non-compliant with applicable laws.</li>
                <li>
                  If a client engages in abusive, fraudulent, or unethical behavior toward Buzz Filing representatives.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Dispute Resolution</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>
                  Any disputes arising from the use of Buzz Filing services shall first be resolved through direct
                  communication with our support team.
                </li>
                <li>
                  If a resolution cannot be reached, disputes may be subject to arbitration in accordance with
                  applicable Pakistan laws.
                </li>
                <li>
                  Clients agree to waive their right to a class-action lawsuit and instead resolve disputes on an
                  individual basis.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Changes to Terms and Conditions</h2>
              <p className="text-gray-700 leading-relaxed">
                Buzz Filing reserves the right to update these Terms and Conditions at any time. Any changes will be
                posted on our website, and continued use of our services constitutes acceptance of these changes.
              </p>

              <h2 className="text-2xl font-semibold text-[#ff0d13] mt-8">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                For any questions or concerns regarding these Terms and Conditions, please contact us at:
              </p>
              <div className="text-gray-700 leading-relaxed space-y-1 ml-4">
                <p className="font-semibold">Buzz Filing</p>
                <p>Email: hello@buzzfiling.com</p>
                <p>Phone: +1 (302) 209-8440</p>
                <p>Website: www.buzzfiling.com</p>
              </div>

              <p className="text-gray-700 leading-relaxed font-semibold mt-6">
                CUSTOMER HEREBY AGREES THAT CUSTOMER HAS READ AND AGREES WITH THIS LEGAL DISCLAIMER AND TERMS AND
                CONDITIONS IN ITS ENTIRETY.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
