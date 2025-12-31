"use client"
import {
  MapPin,
  Award as IdCard,
  Lock,
  Badge,
  FileText,
  PenSquare,
  RefreshCcw,
  Power,
  Receipt,
  Landmark,
  Building2,
  BadgeDollarSign,
  Globe,
  Palette,
  ShoppingCart,
  FileCheck,
} from "lucide-react"

export default function ServicesSection() {
  const services = [
    {
      Icon: MapPin,
      title: "Business Address",
      description: "Unique suite U.S. business address accepted by Amazon and major online marketplaces.",
      price: "$79 / Year",
    },
    {
      Icon: IdCard,
      title: "ITIN Processing",
      description: "Obtain your ITIN with Buzz Filing through an IRS-recognized CAA for compliant filing.",
      price: "$249",
    },
    {
      Icon: Lock,
      title: "Trademark",
      description: "Register your trademark to protect brand identity and secure exclusive commercial rights.",
      price: "$349 + USPTO Fee",
    },
    {
      Icon: BadgeDollarSign,
      title: "Reseller Permit",
      description: "Obtain an official reseller certificate to purchase products tax-free for resale purposes.",
      price: "$99",
    },
    {
      Icon: Landmark,
      title: "IRS Tax Filing",
      description: "Prepare and file federal tax obligations accurately with the Internal Revenue Service.",
      price: "From $149",
    },
    {
      Icon: Receipt,
      title: "Annual Report",
      description: "Prepare and submit required annual franchise reports to maintain active state compliance.",
      price: "$49 + State Fee",
    },
    {
      Icon: FileText,
      title: "Operating Agreement",
      description: "Custom LLC agreement defining ownership, management roles, and internal business structure.",
      price: "$49",
    },
    {
      Icon: Badge,
      title: "DBA Name",
      description: "File a Doing Business As name to legally operate your business under a new brand.",
      price: "$99 + State Fee",
    },
    {
      Icon: PenSquare,
      title: "Amendment",
      description: "Submit official amendments to update company name, members, or legal structure details.",
      price: "$199 + State Fee",
    },
    {
      Icon: RefreshCcw,
      title: "Reinstatement",
      description: "Restore a dissolved company and regain good standing through required state filings.",
      price: "$199 + State Fee",
    },
    {
      Icon: Power,
      title: "Dissolution",
      description: "Formally close your company with proper legal documentation and state compliance steps.",
      price: "$199 + State Fee",
    },
    {
      Icon: Building2,
      title: "DUNS Number",
      description: "Apply for a D-U-N-S Number to support business verification and vendor credibility checks.",
      price: "$79",
    },
    {
      Icon: ShoppingCart,
      title: "Amazon Signup",
      description: "Complete Amazon seller account registration and setup with guided expert assistance.",
      price: "$99",
    },
    {
      Icon: FileCheck,
      title: "Notarized UBO",
      description: "Notarized UBO document confirming beneficial ownership for banking and compliance needs.",
      price: "$49",
    },
    {
      Icon: Globe,
      title: "Website",
      description: "Custom-designed professional website establishes credibility and strong online presence.",
      price: "$149",
    },
    {
      Icon: Palette,
      title: "Logo Design",
      description: "Custom logo design crafted to build brand identity, recognition, and customer trust.",
      price: "$49",
    },
  ]

  return (
    <section id="services" className="w-full bg-white py-16 md:py-20 lg:py-24 px-3 mt-[-100px]">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-0 py-2">
              <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Add-on Services</span>
            </div>
          </div>
          <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">Everything You Need, One Place</h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Complete business solutions with straightforward, fair pricing.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ Icon, title, description, price }, idx) => (
            <div
              key={idx}
              className="flex flex-col p-4 bg-white border-b border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              {/* Icon */}
              <div className="mb-3">
                <Icon className="w-6 h-6 text-[#ff0d13]" />
              </div>

              {/* Title + Price Pill */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-gray-900 text-lg md:text-xl font-semibold leading-tight">{title}</h3>
                {price && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-[#ff0d13] font-semibold text-xs whitespace-nowrap">
                    {price}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
