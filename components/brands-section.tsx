"use client"

export default function BrandsSection() {
  const partners = ["Stripe", "PayPal", "DocuSign", "Google", "AWS", "Microsoft"]

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600 mb-8 font-semibold">
          Trusted by 10,000+ entrepreneurs and integrated with
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner) => (
            <div
              key={partner}
              className="flex items-center justify-center h-12 text-gray-400 font-bold text-lg hover:text-gray-600 transition-colors"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
