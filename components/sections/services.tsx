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
  Store,
  CreditCard,
} from "lucide-react"

export default function ServicesSection() {
  const services = [
    {
      Icon: MapPin,
      title: "Premium Business Address",
      description: "Prestigious U.S. business address with unique suite number for full compliance.",
      price: "$99 / Year",
    },
    {
      Icon: IdCard,
      title: "ITIN",
      description: "Individual Taxpayer Identification Number enabling non-residents to manage U.S. taxation.",
      price: "$349",
    },
    {
      Icon: Lock,
      title: "Trademark",
      description: "Register your trademark to protect brand identity and secure exclusive commercial rights.",
      price: "$349 + USPTO Fee",
    },
    {
      Icon: Badge,
      title: "DBA Name",
      description: "File a Doing Business As name to operate under another brand.",
      price: "$149 + State Fee",
    },
    {
      Icon: FileText,
      title: "Operating Agreement",
      description:
        "Custom LLC agreement defining ownership, management duties, and internal operating responsibilities.",
      price: "$79",
    },
    {
      Icon: PenSquare,
      title: "Amendment",
      description: "Submit amendment filings to update company name, members, or legal structure.",
      price: "$199 + State Fee",
    },
    {
      Icon: RefreshCcw,
      title: "Reinstatement",
      description: "Reactivate your dissolved company and restore compliance through official state filings.",
      price: "$199 + State Fee",
    },
    {
      Icon: Power,
      title: "Dissolution",
      description: "Formally close your company with proper legal paperwork and state compliance.",
      price: "$199 + State Fee",
    },
    {
      Icon: Receipt,
      title: "State Tax Filing",
      description: "Prepare and submit accurate state-level business tax reports to maintain compliance.",
      price: "$99 + State Fee",
    },
    {
      Icon: Landmark,
      title: "IRS Tax Filing",
      description: "Complete and file federal tax obligations with the Internal Revenue Service.",
      price: "From $349",
    },
    {
      Icon: Building2,
      title: "Franchise Tax",
      description: "Prepare and file annual franchise tax reports required by applicable states.",
      price: "$99 + State Fee",
    },
    {
      Icon: BadgeDollarSign,
      title: "Reseller Permit",
      description: "Obtain official reseller certificate to purchase goods tax-free for resale.",
      price: "$149",
    },
    {
      Icon: Globe,
      title: "Website",
      description: "Custom-designed professional website establishing credibility and strong online business presence.",
      price: "$299",
    },
    {
      Icon: Palette,
      title: "Branding Kit",
      description: "Complete branding kit with logo design and identity materials for consistency.",
      price: "$99",
    },
    {
      Icon: Store,
      title: "E-commerce Store",
      description: "Launch a fully functional online store on Walmart, Amazon, or Etsy.",
      price: "$149",
    },
    {
      Icon: CreditCard,
      title: "Payment Gateway",
      description: "Integrate secure payment gateways like Stripe or PayPal for transactions.",
      price: "$149",
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
