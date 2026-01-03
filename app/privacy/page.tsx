import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"

export const metadata = {
  title: "Privacy Policy - BuzzFiling",
  description: "Learn how BuzzFiling collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen text-gray-800 py-12 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-5xl mx-auto overflow-hidden">
          {/* Header */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-center">Privacy Policy</h1>
          <p className="text-md sm:text-lg font-light max-w-2xl mx-auto text-center">
            Learn how BuzzFiling LLC collects, uses, and protects your personal information.
          </p>

          {/* Content */}
          <section className="px-6 sm:px-10 py-8 space-y-8">
            {/* Introduction */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#ff0d13]">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy describes how BuzzFiling LLC and its affiliates (collectively "we, our, us")
                collect, use, share, protect, or otherwise process your information/personal data through our website{" "}
                <a href="https://www.buzzfiling.com" className="text-[#ff0d13] underline hover:text-[#A52A2A]">
                  www.buzzfiling.com
                </a>
                . You may browse certain sections without registering. Your personal data will primarily be stored and
                processed in the United States. By using our platform, you agree to the terms of this Privacy Policy,
                Terms of Use, and applicable laws.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {/* Collection */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Collection</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect personal data when you use our platform, register, or interact with us. This may include
                  your name, contact information, payment details, and sensitive data with consent. You can choose not
                  to provide certain information, but some features may then be unavailable.
                </p>
              </div>

              {/* Usage */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Usage</h3>
                <p className="text-gray-700 leading-relaxed">
                  Personal data helps us provide services, improve user experience, detect fraud, customize offers,
                  resolve disputes, conduct research, and for marketing purposes with opt-out options.
                </p>
              </div>

              {/* Sharing */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Sharing</h3>
                <p className="text-gray-700 leading-relaxed">
                  Data may be shared internally or with third-party partners for service fulfillment, marketing,
                  compliance, and security purposes. We are not responsible for third-party privacy policies.
                </p>
              </div>

              {/* Security */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Security Precautions</h3>
                <p className="text-gray-700 leading-relaxed">
                  We implement reasonable security measures to protect your personal data. However, no transmission over
                  the internet is completely secure. Users are responsible for safeguarding their login credentials.
                </p>
              </div>

              {/* Data Retention */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Data Deletion and Retention</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may delete your account, though pending transactions or disputes may delay removal. Data may be
                  retained for fraud prevention or analytics in anonymized form.
                </p>
              </div>

              {/* Rights & Consent */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Your Rights & Consent</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may access, update, or withdraw consent for your personal data. Withdrawal may limit the services
                  we can provide. Consent allows us to contact you through various channels for purposes specified in
                  this Privacy Policy.
                </p>
              </div>

              {/* Refund Policy */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ff0d13]">Refund Policy</h3>
                <ul className="list-disc list-inside text-gray-800 leading-relaxed space-y-1 font-bold">
                  <li>
                    Payments made for U.S. company formation or any other services are eligible for a 100% refund if
                    requested within 24 hours of the payment.
                  </li>
                  <li>
                    After 24 hours, once your order has been processed, refunds may still be possible. However, in such
                    cases, a full refund cannot be guaranteed.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
