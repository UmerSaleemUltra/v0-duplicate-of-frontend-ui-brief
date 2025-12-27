export default function PricingSection () {
  const starterFeatures = [
    "Company Formation",
    "Registered Agent (Annually)",
    "All Fees Included",
    "EIN (Employer Identification Number)",
    "U.S. Phone Number",
    "Business Bank Account Setup",
    "Payment Gateway Setup Guidance",
    "Business Tax Updates",
    "FinCEN BOI Report",
    "Digital Document Access",
  ]

  const advanceFeatures = [
    "Unique Business Address",
    "Reseller Certificate / Seller Permit",
    "Dedicated IP VPS - 1 Month",
    "Company Formation",
    "Registered Agent (Annually)",
    "All Fees Included",
    "EIN (Employer Identification Number)",
    "U.S. Phone Number",
    "Business Bank Account Setup",
    "Payment Gateway Setup Guidance",
    "Business Tax Updates",
    "FinCEN BOI Report",
    "Digital Document Access",
  ]

  return (
    <section className="w-full min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-16 ">
      <div className="container mx-auto max-w-6xl">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
          {/* Starter Package */}
          <div className="flex flex-col">
            {/* Card */}
            <div className="bg-[#880000] rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8 lg:p-10 mb-6">
              {/* Star Icon */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
                >
                  <path d="M24 0L26.8 21.2L48 24L26.8 26.8L24 48L21.2 26.8L0 24L21.2 21.2L24 0Z" fill="currentColor" />
                </svg>
              </div>

              {/* Title and Price */}
              <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-medium mb-3 sm:mb-4">Starter Package</h3>
              <div className="mb-6 sm:mb-7 md:mb-8">
                <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">$149</span>
                <span className="text-white text-lg sm:text-xl md:text-2xl ml-2">+ State Fee</span>
              </div>

              {/* Button */}
              <button className="w-full bg-white text-[#ff0d13] rounded-full py-3.5 sm:py-4 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors">
                Apply Now
              </button>
            </div>

            {/* Features List */}
            <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
              {starterFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ff0d13] flex items-center justify-center mt-0.5">
                    <svg
                      width="12"
                      height="10"
                      viewBox="0 0 14 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    >
                      <path
                        d="M1 5.5L5 9.5L13 1.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[#1A1A1A] text-sm sm:text-base md:text-lg leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Advance Package */}
          <div className="flex flex-col">
            {/* Card with curved cutout */}
            <div className="relative bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8 lg:p-10 mb-6 overflow-hidden">
       
              {/* Asterisk Icon */}
              <div className="mb-4 sm:mb-5 md:mb-6 relative z-10">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
                >
                  <path
                    d="M24 0V48M0 24H48M9.37 9.37L38.63 38.63M38.63 9.37L9.37 38.63"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Title and Price */}
              <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-medium mb-3 sm:mb-4 relative z-10">
                Advnace Package
              </h3>
              <div className="mb-6 sm:mb-7 md:mb-8 relative z-10">
                <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">$249</span>
                <span className="text-white text-lg sm:text-xl md:text-2xl ml-2">+ State Fee</span>
              </div>

              {/* Button */}
              <button className="w-full bg-white text-[#ff0d13] rounded-full py-3.5 sm:py-4 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors relative z-10">
                Apply Now
              </button>
            </div>

            {/* Features List */}
            <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
              {advanceFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ff0d13] flex items-center justify-center mt-0.5">
                    <svg
                      width="12"
                      height="10"
                      viewBox="0 0 14 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    >
                      <path
                        d="M1 5.5L5 9.5L13 1.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[#1A1A1A] text-sm sm:text-base md:text-lg leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
