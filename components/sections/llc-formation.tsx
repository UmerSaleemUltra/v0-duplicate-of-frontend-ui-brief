import { FileText, CheckCircle2, Award, LandmarkIcon } from "lucide-react"

export default function LLCFormationSection() {
  return (
    <section id="process" className="w-full py-8 sm:py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Subtitle */}
        <p className="text-center text-[#ff0d13] mb-2 text-sm sm:text-base">
          Your time is money – BuzzFilling manages all your paperwork.
        </p>

        {/* Main heading */}
        <h2 className="text-center text-gray-700 text-2xl sm:text-3xl font-medium mb-6 sm:mb-10">
          LLC with Business Bank Account in <span className="text-[#ff0d13]">4 Weeks</span>
        </h2>

        {/* Three column layout */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 sm:gap-[35px]">
          {/* LLC Formation Card */}
          <div className="bg-white rounded-lg w-full sm:w-[355px] mx-auto sm:mx-0 shadow-sm p-6 min-h-[350px]">
            <div className="mb-4 text-[#ff0d13]">
              <Award size={32} strokeWidth={2} />
            </div>
            <h3 className="text-gray-700 font-medium uppercase tracking-wide mb-4">LLC FORMATION</h3>
            <p className="text-gray-600 mb-8">
              BuzzFilling handles the preparation and filing of your LLC with the State. This process includes
              submitting the necessary forms and paying state fees, ensuring your company is officially registered.
            </p>
            <div className="flex items-center text-[#ff0d13] mt-auto">
              <CheckCircle2 className="mr-2" size={20} />
              <span className="uppercase text-sm font-medium">3–7 business days (State approval after filing)</span>
            </div>
          </div>

          {/* Tax Registration Card */}
          <div className="bg-white rounded-lg w-full sm:w-[355px] mx-auto sm:mx-0 shadow-sm p-6 min-h-[350px]">
            <div className="mb-4 text-[#ff0d13]">
              <FileText size={32} strokeWidth={2} />
            </div>
            <h3 className="text-gray-700 font-medium uppercase tracking-wide mb-4">EIN REGISTRATION</h3>
            <p className="text-gray-600 mb-8">
              We complete every form for you, and you can easily sign the documents on our secure platform to obtain
              your Employer Identification Number (EIN) from the IRS, which works as your tax identification.
            </p>
            <div className="flex items-center text-[#ff0d13] mt-auto">
              <CheckCircle2 className="mr-2" size={20} />
              <span className="uppercase text-sm font-medium">2 weeks (IRS processing once LLC is approved)</span>
            </div>
          </div>

          {/* Business Bank Account Card */}
          <div className="bg-white rounded-lg w-full sm:w-[355px] mx-auto sm:mx-0 shadow-sm p-6 min-h-[350px]">
            <div className="mb-4 text-[#ff0d13]">
              <LandmarkIcon size={32} strokeWidth={2} />
            </div>
            <h3 className="text-gray-700 font-medium uppercase tracking-wide mb-4">BUSINESS BANK ACCOUNT</h3>
            <p className="text-gray-600 mb-8">
              With your EIN approved, we help launch your U.S. business bank account and enable seamless banking
              operations for your LLC.{" "}
            </p>
            <div className="flex items-center text-[#ff0d13] mt-auto">
              <CheckCircle2 className="mr-2" size={20} />
              <span className="uppercase text-sm font-medium">1–3 business days (After EIN is issued)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
