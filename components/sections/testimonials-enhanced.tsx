"use client"

import { motion } from "framer-motion"
import { Star, MessageCircle, Play } from "lucide-react"
import { useState } from "react"

const clientReviews = [
  {
    name: "Marko Ertola",
    rating: 5,
    platform: "Google",
    review: "Absolutely flawless service. Got my LLC set up in 2 weeks. Highly recommend!",
    date: "2 weeks ago",
  },
  {
    name: "Ibrahim Rey",
    rating: 5,
    platform: "Trustpilot",
    review: "Fast, responsive, and reliable. Best work. They have supported me through my LLC application.",
    date: "1 month ago",
  },
  {
    name: "Unidentified Mfkitg",
    rating: 5,
    platform: "Google",
    review: "Got my LLC set up this year, and the service I received was incredible...",
    date: "3 weeks ago",
  },
  {
    name: "Emre Kargaz",
    rating: 5,
    platform: "Google",
    review: "Great people with a friendly, efficient approach. Really supportive throughout.",
    date: "2 months ago",
  },
]

const whatsappMessages = [
  {
    id: 1,
    sender: "IES TECH - IndependentElite LLC",
    time: "12:31",
    message:
      "It was a nice pleasure working with you guys. You have been so responsive throughout the process. RECOMMENDED 🔥",
  },
  {
    id: 2,
    sender: "IES TECH - TechRevenue Inc",
    time: "2:00 PM",
    message: "You made whole process was so smooth. Thank you for being responsive and making it easy.",
  },
  {
    id: 3,
    sender: "IES TECH - Global Break Boulevard",
    time: "11:25",
    message: "They are excellent! Thank you so much for working with helping me throughout everything",
  },
]

const videoTestimonials = [
  {
    id: 1,
    initials: "JW",
    name: "James Wilson",
    company: "Tech Startup",
    color: "from-[#ff0d13] to-[#880000]",
    videoUrl:
      "https://4anfv00nfmuj16vd.public.blob.vercel-storage.com/Growing%20in%20the%20U.S.%20with%20Buzz%20Filing.mp4",
  },
  {
    id: 2,
    initials: "SC",
    name: "Sarah Chen",
    company: "E-commerce",
    color: "from-purple-500 to-purple-700",
    videoUrl:
      "https://4anfv00nfmuj16vd.public.blob.vercel-storage.com/Growing%20in%20the%20U.S.%20with%20Buzz%20Filing.mp4",
  },
  {
    id: 3,
    initials: "DM",
    name: "David Martinez",
    company: "Consulting",
    color: "from-emerald-500 to-emerald-700",
    videoUrl:
      "https://4anfv00nfmuj16vd.public.blob.vercel-storage.com/Growing%20in%20the%20U.S.%20with%20Buzz%20Filing.mp4",
  },
  {
    id: 4,
    initials: "ER",
    name: "Emma Rodriguez",
    company: "Real Estate",
    color: "from-sky-500 to-sky-700",
    videoUrl:
      "https://4anfv00nfmuj16vd.public.blob.vercel-storage.com/Growing%20in%20the%20U.S.%20with%20Buzz%20Filing.mp4",
  },
]

export default function TestimonialsEnhanced() {
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ff0d13]/20 bg-[#ff0d13]/5 mb-4">
            <span className="text-[#ff0d13] font-medium text-sm uppercase tracking-wider">200+ Happy Founders</span>
          </div>
          <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">What Our Clients Say</h2>
          <p className="text-gray-600 text-lg">
            Reviews from <span className="font-semibold">Google</span> and{" "}
            <span className="font-semibold">Trustpilot</span>, verified by our team.
          </p>
        </div>

        {/* Client Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {clientReviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff0d13] to-[#880000] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{review.name}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    review.platform === "Google" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {review.platform}
                </span>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">{review.review}</p>
              <p className="text-xs text-gray-400">{review.date}</p>
            </motion.div>
          ))}
        </div>

        {/* WhatsApp Messages Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-200 bg-green-50 mb-4">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium text-sm">Client Feedback</span>
            </div>
            <h3 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">
              WhatsApp Messages from Happy Clients
            </h3>
            <p className="text-gray-600">Direct feedback from our satisfied customers worldwide</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {whatsappMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{msg.sender}</p>
                    <p className="text-xs text-gray-400">{msg.time}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{msg.message}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Video Testimonials Section */}
        <div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ff0d13]/20 bg-[#ff0d13]/5 mb-4">
              <Play className="w-4 h-4 text-[#ff0d13]" />
              <span className="text-[#ff0d13] font-medium text-sm">Video Testimonials</span>
            </div>
            <h3 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">Hear From Our Clients</h3>
            <p className="text-gray-600">See what founders from 30+ countries say on LinkedIn and in person</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoTestimonials.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onHoverStart={() => setHoveredVideo(video.id)}
                onHoverEnd={() => setHoveredVideo(null)}
                onClick={() => setPlayingVideo(video.videoUrl)}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${video.color}`} />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mb-4 group-hover:scale-110 transition-transform">
                    {video.initials}
                  </div>
                  <h4 className="font-semibold text-xl mb-1">{video.name}</h4>
                  <p className="text-sm text-white/80">{video.company}</p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {playingVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕ Close
            </button>
            <video src={playingVideo} controls autoPlay className="w-full h-full rounded-lg" />
          </div>
        </div>
      )}
    </section>
  )
}
