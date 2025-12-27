import {
  Building2,
  FileCheck,
  Receipt,
  Landmark,
  ArrowUpCircle,
  Lock,
  ShoppingBag,
  Award,
  MapPin,
  FileSignature,
  FileEdit,
  FileX,
  HandCoins,
} from "lucide-react"

export default function ServicesSection() {
  const services = [
    {
      icon: <MapPin className="w-6 h-6 text-[#ff0d13]" />,
      title: "Premium Business Address",
      price: "$20/year",
      description: "Professional U.S. business address with unique suite number for all company correspondence.",
    },
    {
      icon: <FileCheck className="w-6 h-6 text-[#ff0d13]" />,
      title: "ITIN",
      price: "$345",
      description: "Individual taxpayer identification number for non-residents to manage U.S. taxation.",
    },
    {
      icon: <Lock className="w-6 h-6 text-[#ff0d13]" />,
      title: "Trademark",
      price: "$345 + USTPO Fee",
      description: "Register your trademark to protect brand identity and ensure exclusive commercial rights.",
    },
    {
      icon: <Building2 className="w-6 h-6 text-[#ff0d13]" />,
      title: "DBA Name",
      price: "$165 + State Fee",
      description:
        "Register a Business-As name to operate under another brand. Business As name to operate under another brand.",
    },
    {
      icon: <FileSignature className="w-6 h-6 text-[#ff0d13]" />,
      title: "Operating Agreement",
      price: "$25",
      description: "Custom LLC agreement outlining ownership, duties, and internal operating procedures.",
    },
    {
      icon: <FileEdit className="w-6 h-6 text-[#ff0d13]" />,
      title: "Amendment",
      price: "$50 + State Fee",
      description: "Submit amendment filings to update company name, address, or registered agent.",
    },
    {
      icon: <ArrowUpCircle className="w-6 h-6 text-[#ff0d13]" />,
      title: "Reinstatement",
      price: "$50 + State Fee",
      description: "Reactivate your dissolved company and restore good standing with legal paperwork.",
    },
    {
      icon: <FileX className="w-6 h-6 text-[#ff0d13]" />,
      title: "Dissolution",
      price: "$50 + State Fee",
      description: "Formally close your company with proper legal paperwork to cancel business operations.",
    },
    {
      icon: <HandCoins className="w-6 h-6 text-[#ff0d13]" />,
      title: "State Tax Filing",
      price: "$50 + State Fee",
      description: "Annual state level tax return to report all company obligations and maintain compliance.",
    },
    {
      icon: <Receipt className="w-6 h-6 text-[#ff0d13]" />,
      title: "Tax Filing",
      price: "From $345",
      description: "Comprehensive tax filing obligations with the Internal Revenue Service.",
    },
    {
      icon: <Landmark className="w-6 h-6 text-[#ff0d13]" />,
      title: "Franchise Tax",
      price: "$50 + State Fee",
      description: "Franchise tax returns required by jurisdictions for the privilege of doing business.",
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-[#ff0d13]" />,
      title: "Reseller Permit",
      price: "$185",
      description: "Obtain official reseller tax ID/license to purchase goods tax free for resale.",
    },
    {
      icon: <Building2 className="w-6 h-6 text-[#ff0d13]" />,
      title: "Website",
      price: "$299",
      description: "Custom designed professional website establishing credibility and strong online presence.",
    },
    {
      icon: <Award className="w-6 h-6 text-[#ff0d13]" />,
      title: "Branding Kit",
      price: "$25",
      description: "Complete branding kit with logo design and identity materials for consistent business presence.",
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-[#ff0d13]" />,
      title: "Ecommerce Store",
      price: "$385",
      description: "Launch a fully functioned online store on Walmart, Amazon, or Ebay.",
    },
    {
      icon: <Landmark className="w-6 h-6 text-[#ff0d13]" />,
      title: "Payment Gateway",
      price: "$150",
      description: "Integrate secure payment gateways like Stripe or PayPal for transactions.",
    },
  ]

  return (
    <div id="services" className="w-full bg-white py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#ff0d13] font-medium text-sm mb-2 uppercase tracking-wider">Additional Services</p>
          <h2 className="text-[#4e4747] text-3xl md:text-4xl font-bold mb-4">
            Explore Our Complete Suite of US Business Services
          </h2>
          <p className="text-[#635e5e] text-base max-w-2xl mx-auto">
            Already incorporated? You can boost your business with our additional services!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-[#ff0d13]/30 transition-all duration-300"
            >
              <div className="mb-4">{service.icon}</div>
              <h3 className="text-[#4e4747] text-lg font-semibold mb-2">{service.title}</h3>
              <p className="text-[#ff0d13] font-bold text-sm mb-3">{service.price}</p>
              <p className="text-[#635e5e] text-sm leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
