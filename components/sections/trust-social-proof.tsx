"use client"

import { Star } from "lucide-react"
import Image from "next/image"

const reviews = [
  {
    platform: "trustpilot",
    name: "Kargoas",
    rating: 5,
    text: "It was wonderful working with the team. Process was super smooth and team guided us briefly throughout the process. Would surely be recommending it to my friends and family.",
    initials: "K",
  },
  {
    platform: "trustpilot",
    name: "Mehboob Meghani",
    rating: 5,
    text: "Awesome service and I would highly recommend this to everyone! Their communication and guidance is the best and work is according to the timeline committed. What's best is their after sales service, they don't abandon you if you face issues or need guidance after the work is finished. I would rate them 10/10.",
    initials: "MM",
  },
  {
    platform: "trustpilot",
    name: "Waqas Ahmed",
    rating: 5,
    text: "My experience was really good regarding LLC Registration in Missouri State. Their communication personnel was really good and overall I'm satisfied with the operations.",
    initials: "WA",
  },
  {
    platform: "trustpilot",
    name: "Abdullah Khan",
    rating: 5,
    text: "The team was accommodating in answering all of my queries regarding C-Corporation. I registered my Corporation through them in Texas, and the process was smooth and fast. I would recommend them to anyone registering their company in the US.",
    initials: "AK",
  },
  {
    platform: "trustpilot",
    name: "Ramsha Khan",
    rating: 5,
    text: "It was a pleasant experience working with Buzz team. They have completed my process professionally and swiftly in Wyoming. I am very satisfied with their services. Highly recommended from my end.",
    initials: "RK",
  },
  {
    platform: "trustpilot",
    name: "Mustufa",
    rating: 5,
    text: "Buzz Filing made everything so easy for me. I got my U.S. company set up without any tension. Their team guided me step by step, and I didn't have to worry about anything. Highly recommend!",
    initials: "M",
  },
  {
    platform: "trustpilot",
    name: "Malik Kamal Akbar",
    rating: 5,
    text: "Great service, on time delivery, excellent customer service. Buzz Filing helped me get USA LLC Registration, EIN, Business Bank Accounts, and ITIN. Everything was delivered on time, their service is great, they're really good at what they do. Especially, their customer service is great. If you're someone who is looking to get any of these services, I'd 100% recommend you to try Buzz Filing.",
    initials: "MKA",
  },
]

const whatsappFeedback = [
  {
    ticketId: "BCL1597",
    company: "Toughsteoutdoors LLC",
    service: "Sunrate Setup",
    verified: true,
    members: "Kashtqar, Operations, You",
    senderName: "Kashtqar",
    senderColor: "#4FC3F7",
    message:
      "Thank you buzz filing team.\n\nIt was a real pleasure working with you guys. You have been very supportive through the whole process and delivered what you promised. Highly recommended 👌",
    time: "3:34 AM",
    reaction: "❤️",
  },
  {
    ticketId: "BCL2341",
    company: "TechVentures Inc",
    service: "LLC Formation",
    verified: true,
    members: "Rahul, Support, You",
    senderName: "Rahul",
    senderColor: "#81C784",
    message:
      "Just received my EIN! You guys are amazing 🎉\n\nThe whole process was so smooth. Thank you team for all the support!",
    time: "2:34 PM",
    reaction: "🔥",
  },
  {
    ticketId: "BCL1823",
    company: "GlobalTrade Solutions",
    service: "Bank Account Setup",
    verified: true,
    members: "Ahmed, Compliance, You",
    senderName: "Ahmed",
    senderColor: "#FFB74D",
    message:
      "Bank account approved! Thank you so much for guiding me through everything.\n\nYou're the best! Will definitely recommend to my network 💯",
    time: "11:45 AM",
    reaction: "👏",
  },
  {
    ticketId: "BCL2156",
    company: "StartupHub LLC",
    service: "EIN + ITIN",
    verified: true,
    members: "Priya, Operations, You",
    senderName: "Priya",
    senderColor: "#F06292",
    message:
      "Got my LLC documents today. Fastest service I've ever experienced!\n\nHighly recommend to everyone looking to start their US business 👍",
    time: "4:15 PM",
    reaction: "⭐",
  },
  {
    ticketId: "BCL1945",
    company: "InnovateTech Corp",
    service: "Stripe + PayPal",
    verified: true,
    members: "Chen, Support, You",
    senderName: "Chen",
    senderColor: "#9575CD",
    message:
      "Amazing support! Got my Stripe and PayPal approved within a week.\n\nSo happy with the service! Professional team 🚀",
    time: "6:30 PM",
    reaction: "💪",
  },
  {
    ticketId: "BCL2089",
    company: "DigitalNomad LLC",
    service: "Full Package",
    verified: true,
    members: "Maria, Compliance, You",
    senderName: "Maria",
    senderColor: "#4DD0E1",
    message:
      "From application to EIN in just 5 days! You made my US business dream come true.\n\nThank you for everything! 🙏",
    time: "3:15 PM",
    reaction: "❤️",
  },
]

const videoTestimonials = [
  {
    videoId: "mYPxKBLu53c",
    gradient: "from-rose-500 to-orange-400",
  },
  {
    videoId: "KIn4rnL4V44",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    videoId: "c-hLXHfIDSs",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    videoId: "RGtfEVWkztY",
    gradient: "from-blue-500 to-cyan-400",
  },
]

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
      />
    ))}
  </div>
)

const TrustSocialProof = () => {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background via-gray-50/30 to-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100">
              <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">800+ Happy Founders</span>
            </div>
          </div>
          <h2 className="text-gray-900 text-3xl md:text-4xl lg:text-5xl font-bold mb-4">What Our Clients Say</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Reviews from <span className="font-semibold text-foreground">Google</span> and{" "}
            <span className="font-semibold text-foreground">Trustpilot</span>, verified by our team.
          </p>
        </div>

        {/* Rating Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-16">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#00b67a] flex items-center justify-center shadow-sm">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-foreground text-2xl">4.9</span>
                <span className="text-muted-foreground text-sm">/ 5</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">Trustpilot</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#4285f4] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-foreground text-2xl">4.8</span>
                <span className="text-muted-foreground text-sm">/ 5</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">Google Reviews</p>
            </div>
          </div>
        </div>

        <div className="relative mb-6 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 animate-marquee">
            {[...reviews, ...reviews].map((review, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[380px] bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff0d13]/10 to-[#ff0d13]/5 flex items-center justify-center text-[#ff0d13] font-bold text-base border-2 border-[#ff0d13]/10">
                      {review.initials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-base">{review.name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                      review.platform === "trustpilot" ? "bg-[#00b67a]" : "bg-[#4285f4]"
                    }`}
                  >
                    {review.platform === "trustpilot" ? "★" : "G"}
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden mb-20">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 animate-marquee-reverse">
            {[...reviews.slice(3), ...reviews.slice(0, 3), ...reviews.slice(3), ...reviews.slice(0, 3)].map(
              (review, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[380px] bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff0d13]/10 to-[#ff0d13]/5 flex items-center justify-center text-[#ff0d13] font-bold text-base border-2 border-[#ff0d13]/10">
                        {review.initials}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-base">{review.name}</p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                        review.platform === "trustpilot" ? "bg-[#00b67a]" : "bg-[#4285f4]"
                      }`}
                    >
                      {review.platform === "trustpilot" ? "★" : "G"}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
                </div>
              ),
            )}
          </div>
        </div>

        {/* WhatsApp Feedback Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-0 py-2">
                <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">WhatsApp Reviews</span>
              </div>
            </div>

            <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">WhatsApp Reviews</h2>
            <p className="text-muted-foreground">Direct messages from our satisfied customers worldwide</p>
          </div>

          {/* Slack/Discord Style Chat Messages */}
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatsappFeedback.map((feedback, index) => (
                <div key={index} className="relative">
                  {/* Chat Card */}
                  <div className="bg-[#1E1F22] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header with ticket info */}
                    <div className="bg-[#2B2D31] px-4 py-3 flex items-center gap-3 border-b border-[#3F4147]">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#7d1215] flex items-center justify-center">
                          <Image
                            src="/images/buzzfiling-logo.png"
                            alt="BuzzFiling"
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded bg-[#ff0d13] flex items-center justify-center border-2 border-[#2B2D31]">
                          <Image
                            src="/images/buzzfiling-logo.png"
                            alt="Verified"
                            width={12}
                            height={12}
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm truncate">
                            {feedback.ticketId} - {feedback.company}
                          </span>
                          {feedback.verified && (
                            <svg
                              className="w-4 h-4 text-[#5865F2] flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-[#949BA4] text-xs truncate">{feedback.members}</p>
                      </div>
                    </div>

                    {/* Message Area */}
                    <div className="p-4 min-h-[160px] relative overflow-hidden">
                      {/* Background Pattern */}
                      <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      />

                      {/* Message */}
                      <div className="relative flex gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-[#36393F] flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                          style={{ backgroundColor: feedback.senderColor + "30" }}
                        >
                          <span style={{ color: feedback.senderColor }}>{feedback.senderName.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm" style={{ color: feedback.senderColor }}>
                              {feedback.senderName}
                            </span>
                            <span className="text-[#949BA4] text-xs">{feedback.time}</span>
                          </div>
                          <p className="text-[#DBDEE1] text-sm leading-relaxed whitespace-pre-line">
                            {feedback.message}
                          </p>

                          {/* Reaction */}
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2B2D31] rounded-full text-sm">
                              {feedback.reaction}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Video Testimonials Section */}
        <div>
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-0 py-2">
                <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Client Stories</span>
              </div>
            </div>
            <h2 className="text-gray-900 text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Hear From Our Clients</h2>
            <p className="text-muted-foreground">Real stories from founders who built their US businesses with us</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {videoTestimonials.map((video, index) => (
              <div key={index} className="group">
                {/* YouTube Video Embed */}
                <div className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={`Client Testimonial ${index + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustSocialProof
