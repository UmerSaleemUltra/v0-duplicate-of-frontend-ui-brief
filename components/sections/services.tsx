import {
  Building2,
  FileText,
  FileCheck,
  Receipt,
  Landmark,
  ArrowUpCircle,
  LandmarkIcon as TrademarkIcon,
  ShoppingBag,
  Award,
  Phone,
  MapPin,
  FileSignature,
  Users,
  FileEdit,
  FileX,
  HandCoins,
  Lock
} from "lucide-react"

export default function ServicesSection() {
  const services = [
    {
      icon: <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Bank Account Application",
      description:
        "Set up a secure business bank account in 3-5 business days and get a physical debit card to your home address.",
    },
    {
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "EIN",
      description:
        "Obtain a unique, 9-digit taxpayer identification number to manage taxes, invoices, and bank accounts easily.",
    },
    {
      icon: <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "ITIN",
      description:
        "Get your ITIN easily with BuzzFilling, partnered with an IRS-recognized CAA, to open PayPal account and file taxes.",
    },
    {
      icon: <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Federal Tax Filing",
      description:
        "File your personal and business tax returns easily with BuzzFilling expert guidance and dedicated support team.",
    },
    {
      icon: <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "State Tax Filing",
      description:
        "File your annual reports and pay state taxes with BuzzFilling user-friendly interface to remain fully compliant.",
    },
    {
      icon: <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Post-Incorporation",
      description:
        "Shape your company's governance structure and ensure full compliance for a smooth operational transition.",
    },
    {
      icon: <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Trademark",
      description:
        "Protect your brand identity with BuzzFilling trademark services, ensuring a solid foundation for your business.",
    },
    {
      icon: <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Reseller Certificate",
      description:
        "Easily get a reseller certificate to benefit from tax exemptions on wholesale purchases and increase profits.",
    },
    {
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Certificate of Good Standing",
      description:
        "Boost your business' reputation by obtaining an official certificate verifying your compliance and legal existence.",
    },
    {
      icon: <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "US Phone Number",
      description:
        "Get a US phone number with an area code to connect with your customers based on a local city, area, or state.",
    },
    {
      icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Address with Unique Suite Number",
      description: "Enhance your company's professional image and stand out with a unique suite number.",
    },
    {
      icon: <FileSignature className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Operating Agreement",
      description: "Get an operating agreement to define your LLC's internal structure and each member's roles.",
    },
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Beneficial Ownership Filing",
      description:
        "File your Beneficial Ownership Report, which is legally required for all US companies as of January 1, 2024.",
    },
    {
      icon: <FileEdit className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Amendment to Articles of Organization",
      description:
        "Amend your articles of organization to reflect any administrative, operational, or structural change.",
    },
    {
      icon: <FileX className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0d13]" />,
      title: "Dissolution",
      description:
        "Dissolve your business before all state and federal authorities to formally close your business and stay compliant.",
    },
  ]

  return (
    <div id="services" className="w-full bg-white py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <p className="text-[#ff0d13] font-medium text-sm sm:text-base mb-1 sm:mb-2">More Services</p>
          <h1 className="text-[#4e4747] text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-4">
            Explore Our Complete Suite of US Business Services
          </h1>
          <p className="text-[#635e5e] text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
            Already incorporated? You can boost your business with our additional services!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col border-b border-[#e0d5f5] pb-3 sm:pb-4 bg-white hover:bg-gray-50 transition-colors duration-200 p-4 rounded-lg"
            >
              <div className="mb-2 sm:mb-3 md:mb-4">{service.icon}</div>
              <h3 className="text-[#4e4747] text-lg sm:text-xl font-medium mb-1 sm:mb-2">{service.title}</h3>
              <p className="text-[#635e5e] text-xs sm:text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
