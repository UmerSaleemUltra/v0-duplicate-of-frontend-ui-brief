"use client"

import { motion } from "framer-motion"
import { Star, CheckCircle2, Play, MessageCircle } from "lucide-react"
import Image from "next/image"

const reviews = [
  {
    platform: "trustpilot",
    name: "JAAAGA",
    company: "Biz Network LLC",
    rating: 5,
    text: "Good service with quick response. The team was very helpful throughout the entire LLC formation process.",
    initials: "J",
  },
  {
    platform: "google",
    name: "Varun Krishna",
    company: "The AIGency LLC",
    rating: 5,
    text: "Setting up a US LLC was a breeze. Efficient, professional, and friendly support throughout!",
    initials: "VK",
  },
  {
    platform: "trustpilot",
    name: "Shaytal Angra",
    company: "Techfly LLC",
    rating: 5,
    text: "Prior to this, I was misinformed by many companies. The team helped me out and delivered on time.",
    initials: "SA",
  },
  {
    platform: "google",
    name: "Stanley Chiluka",
    company: "Skilled Crew Solutions LLC",
    rating: 5,
    text: "Professional, responsive, and focused on quality. Clear communication; deadlines met.",
    initials: "SC",
  },
  {
    platform: "trustpilot",
    name: "Shambo Ray",
    company: "Bindt AI LLC",
    rating: 5,
    text: "Fast, responsive, and reliable. Great work team! Highly recommend for any non-US founder.",
    initials: "SR",
  },
  {
    platform: "google",
    name: "Talabathula Manoj",
    company: "Your Wellness Products LLC",
    rating: 5,
    text: "Forming my US LLC with ITIN, PayPal, and Stripe was quick and easy. Highly recommend.",
    initials: "TM",
  },
  {
    platform: "google",
    name: "Sunil Rajput",
    company: "Traveluxe LLC",
    rating: 5,
    text: "Great experience. They helped a lot and completed everything within 10 days.",
    initials: "SR",
  },
  {
    platform: "trustpilot",
    name: "Spy Agent",
    company: "STRINT Technologies LLC",
    rating: 5,
    text: "Had a great journey forming my LLC. On-time delivery and great support!",
    initials: "SA",
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
    name: "James Wilson",
    company: "TechStart LLC",
    country: "🇮🇳 India",
    duration: "1:24",
    views: "2.4K",
    quote: "From India to a US business owner in just 2 weeks!",
    gradient: "from-rose-500 to-orange-400",
  },
  {
    name: "Sarah Chen",
    company: "GlobalTrade Co",
    country: "🇸🇬 Singapore",
    duration: "2:15",
    views: "1.8K",
    quote: "The bank account setup was seamless. Highly recommend!",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    name: "David Okonkwo",
    company: "Afrotech Solutions",
    country: "🇳🇬 Nigeria",
    duration: "1:45",
    views: "3.1K",
    quote: "Best investment I made for my business journey.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    name: "Elena Rodriguez",
    company: "LatinTech Inc",
    country: "🇲🇽 Mexico",
    duration: "2:30",
    views: "1.5K",
    quote: "Professional team, amazing results. 10/10 experience!",
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
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <CheckCircle2 className="w-4 h-4" />
            500+ Happy Founders
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">What Our Clients Say</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Reviews from <span className="font-semibold text-foreground">Google</span> and{" "}
            <span className="font-semibold text-foreground">Trustpilot</span>, verified by our team.
          </p>
        </motion.div>

        {/* Rating Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-8 mb-16"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00b67a] flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-foreground text-lg">4.9</span>
                <span className="text-muted-foreground text-sm">/ 5</span>
              </div>
              <p className="text-muted-foreground text-xs">Trustpilot</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4285f4] flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-foreground text-lg">4.8</span>
                <span className="text-muted-foreground text-sm">/ 5</span>
              </div>
              <p className="text-muted-foreground text-xs">Google Reviews</p>
            </div>
          </div>
        </motion.div>

        {/* Reviews Marquee - Row 1 */}
        <div className="relative mb-4 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

          <motion.div
            className="flex gap-4"
            animate={{ x: [0, -1920] }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {[...reviews, ...reviews].map((review, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[350px] bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {review.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{review.name}</p>
                      <p className="text-muted-foreground text-xs">{review.company}</p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${
                      review.platform === "trustpilot" ? "bg-[#00b67a]" : "bg-[#4285f4]"
                    }`}
                  >
                    {review.platform === "trustpilot" ? "★" : "G"}
                  </div>
                </div>
                <StarRating rating={review.rating} />
                <p className="text-foreground text-sm leading-relaxed mt-3">{review.text}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Reviews Marquee - Row 2 (Reverse) */}
        <div className="relative overflow-hidden mb-20">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

          <motion.div
            className="flex gap-4"
            animate={{ x: [-1920, 0] }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {[...reviews.slice(4), ...reviews.slice(0, 4), ...reviews.slice(4), ...reviews.slice(0, 4)].map(
              (review, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[350px] bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {review.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.name}</p>
                        <p className="text-muted-foreground text-xs">{review.company}</p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${
                        review.platform === "trustpilot" ? "bg-[#00b67a]" : "bg-[#4285f4]"
                      }`}
                    >
                      {review.platform === "trustpilot" ? "★" : "G"}
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-foreground text-sm leading-relaxed mt-3">{review.text}</p>
                </div>
              ),
            )}
          </motion.div>
        </div>

        {/* WhatsApp Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 text-[#25D366] font-medium text-sm mb-4">
              <MessageCircle className="w-4 h-4" />
              Real Client Feedback
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              WhatsApp Messages from Happy Clients
            </h3>
            <p className="text-muted-foreground">Direct messages from our satisfied customers worldwide</p>
          </div>

          {/* Slack/Discord Style Chat Messages */}
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatsappFeedback.map((feedback, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative"
                >
                  {/* Chat Card */}
                  <div className="bg-[#1E1F22] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header with ticket info */}
                    <div className="bg-[#2B2D31] px-4 py-3 flex items-center gap-3 border-b border-[#3F4147]">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        {/* Verification Badge Overlay */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#7d1215] flex items-center justify-center border-2 border-[#2B2D31]">
                          <Image
                            src="/images/buzzfiling-logo.png"
                            alt="Verified"
                            width={10}
                            height={10}
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
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Video Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              <Play className="w-4 h-4" />
              Video Testimonials
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Hear From Our Clients</h3>
            <p className="text-muted-foreground">Real stories from founders who built their US businesses with us</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {videoTestimonials.map((video, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                {/* Video Card */}
                <div className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl mb-4 transform group-hover:scale-[1.02] transition-transform duration-300">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />

                  {/* Profile Circle */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold mb-4 border-2 border-white/30">
                      {video.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <p className="text-white/90 text-sm font-medium">{video.name}</p>
                    <p className="text-white/60 text-xs">{video.country}</p>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                      <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Top Stats Bar */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <div className="px-2 py-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {video.views}
                    </div>
                    <div className="px-2 py-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full">
                      {video.duration}
                    </div>
                  </div>

                  {/* Bottom Quote */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium leading-snug">"{video.quote}"</p>
                    <p className="text-white/60 text-xs mt-1">{video.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TrustSocialProof
