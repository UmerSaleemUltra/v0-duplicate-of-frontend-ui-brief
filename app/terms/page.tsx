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
        <div className="max-w-5xl mx-auto overflow-hidden mt-[100px]">
          {/* Header */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-center">Terms and Conditions</h1>
          <p className="text-md sm:text-lg font-light max-w-2xl mx-auto text-center">
            This document outlines the terms, conditions, and policies for using our platform.
          </p>

          {/* Content */}
          <section className="px-6 sm:px-10 py-8 space-y-8">
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                This document is an electronic record in terms of Information Technology Act, 2000 and rules thereunder
                as applicable, including amended provisions pertaining to electronic records. This record is generated
                by a computer system and does not require any physical or digital signatures.
              </p>
              <p className="text-gray-700 leading-relaxed">
                It is published in accordance with Rule 3 (1) of the Information Technology (Intermediaries Guidelines)
                Rules, 2011, which require publishing rules, regulations, privacy policy, and Terms of Use for accessing
                https://www.buzzfiling.com ('Website'), including related mobile sites and applications ('Platform').
              </p>
              <p className="text-gray-700 leading-relaxed">
                The Platform is owned by BuzzFiling LLC ("Platform Owner", "we", "us", "our"). Your use of the Platform
                and its services is governed by these Terms and Conditions ("Terms of Use"), which include applicable
                policies incorporated by reference. Any conflicting terms proposed by you are rejected.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ACCESSING, BROWSING OR OTHERWISE USING THE PLATFORM INDICATES YOUR AGREEMENT TO ALL TERMS AND
                CONDITIONS, SO PLEASE READ CAREFULLY BEFORE PROCEEDING.
              </p>

              <h2 className="text-2xl font-semibold text-[#8B0000] mt-8">Usage Rules</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Provide true, accurate, and complete information during and after registration.</li>
                <li>
                  We and third parties provide no warranty regarding accuracy, timeliness, or suitability of
                  information.
                </li>
                <li>
                  Use of the Platform is at your own risk and discretion; you must ensure the Services meet your
                  requirements.
                </li>
                <li>
                  Contents of the Platform are proprietary; unauthorized use may result in action under these Terms or
                  applicable law.
                </li>
                <li>Charges associated with Services must be paid as agreed.</li>
                <li>Do not use the Platform for unlawful or forbidden purposes.</li>
                <li>
                  Links to third-party websites are for convenience; their terms and policies govern those interactions.
                </li>
                <li>Transactions constitute a legally binding contract with the Platform Owner.</li>
                <li>
                  You shall indemnify the Platform Owner and affiliates against claims arising from violations of these
                  Terms or applicable laws.
                </li>
                <li>Force majeure events may excuse non-performance under these Terms.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-[#8B0000] mt-8">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms and any disputes or claims relating to them are governed by the laws of the United States.
                All disputes shall be subject to the exclusive jurisdiction of courts at 117 South Lexington Street STE
                100, Harrisonville, MO 64701.
              </p>

              <h2 className="text-2xl font-semibold text-[#8B0000] mt-8">Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                All concerns or communications regarding these Terms must be sent using the contact information provided
                on the website.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
