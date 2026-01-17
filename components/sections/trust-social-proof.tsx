"use client"

import { Star } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState } from "react"

const reviewsRow1 = [
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
]

const reviewsRow2 = [
  {
    platform: "trustpilot",
    name: "Arslan Kamboh",
    rating: 5,
    text: "Amazing team and support, communication was top notch, I got my business complete US setup, plus got their Slash Bank Account service as well. Good operations, we might offer them partnership for our US clients.",
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
    initials: "MK",
  },
]

const whatsappFeedback = [
  {
    screenshot: "/images/testimonial1.png",
    alt: "WhatsApp review from Kashtqar - Toughsteoutdoors LLC",
  },
  {
    screenshot: "/images/testimonial6.png",
    alt: "WhatsApp review from Ahmad Raza - ITIN Application",
  },
  {
    screenshot: "/images/testimonial4.png",
    alt: "WhatsApp review from Urban Pulse LLC - LLC Formation",
  },
  {
    screenshot: "/images/testimonial2.png",
    alt: "WhatsApp review from Prime Axis LLC - LLC Formation",
  },
  {
    screenshot: "/images/testimonial3.png",
    alt: "WhatsApp review from Blue Crest LLC - LLC Formation",
  },
  {
    screenshot: "/images/testimonial5.png",
    alt: "WhatsApp review from Core Venture LLC - LLC Formation",
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
  const infiniteRow1 = [...reviewsRow1, ...reviewsRow1]
  const infiniteRow2 = [...reviewsRow2, ...reviewsRow2]

  const [isPausedRow1, setIsPausedRow1] = useState(false)
  const [isPausedRow2, setIsPausedRow2] = useState(false)

  const marqueeAnimation = {
    x: ["-50%", "0%"],
    transition: {
      duration: 40,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
    },
  }

  const marqueeReverseAnimation = {
    x: ["0%", "-50%"],
    transition: {
      duration: 40,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
    },
  }

  return (
    <>
      <style jsx>{`
        .animate-marquee:hover,
        .animate-marquee-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>

      <section className="py-16 md:py-20 lg:py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-0 py-2">
                <span className="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">800+ Happy Founders</span>
              </div>
            </div>
            <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">What Our Clients Say</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Reviews from <span className="font-semibold text-foreground">Google</span> and{" "}
              <span className="font-semibold text-foreground">Trustpilot</span>, verified by our team.
            </p>
          </div>

          {/* Rating Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
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
          </div>

          {/* Reviews Marquee - Row 1 */}
          <div
            className="relative mb-4 overflow-hidden"
            onMouseEnter={() => setIsPausedRow1(true)}
            onMouseLeave={() => setIsPausedRow1(false)}
          >
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <motion.div
              style={{ display: "flex", gap: "1rem", width: "max-content" }}
              animate={isPausedRow1 ? {} : marqueeAnimation}
            >
              {infiniteRow1.map((review, index) => (
                <div
                  key={`row1-${index}`}
                  className="flex-shrink-0 w-[340px] md:w-[360px] lg:w-[380px] bg-card border border-border rounded-2xl p-4 md:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {review.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.name}</p>
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
          <div
            className="relative overflow-hidden mb-20"
            onMouseEnter={() => setIsPausedRow2(true)}
            onMouseLeave={() => setIsPausedRow2(false)}
          >
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <motion.div
              style={{ display: "flex", gap: "1rem", width: "max-content" }}
              animate={isPausedRow2 ? {} : marqueeReverseAnimation}
            >
              {infiniteRow2.map((review, index) => (
                <div
                  key={`row2-${index}`}
                  className="flex-shrink-0 w-[340px] md:w-[360px] lg:w-[380px] bg-card border border-border rounded-2xl p-4 md:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {review.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.name}</p>
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

            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {whatsappFeedback.map((feedback, index) => (
                  <div key={index} className="relative group">
                    <div className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                      {feedback.screenshot && (
                        <Image
                          src={feedback.screenshot || "/placeholder.svg"}
                          alt={feedback.alt}
                          width={740}
                          height={368}
                          className="w-full h-auto object-cover"
                        />
                      )}
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
              <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">Hear From Our Clients</h2>
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
    </>
  )
}

export default TrustSocialProof
