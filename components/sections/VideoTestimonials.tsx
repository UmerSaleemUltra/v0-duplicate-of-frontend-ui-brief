"use client"

import { useEffect, useRef, useState } from "react"
import { Play } from "lucide-react"

interface VideoTestimonial {
  id: string
  videoId: string
  name: string
  role?: string
  thumbnail?: string
}

const testimonials: VideoTestimonial[] = [
  {
    id: "1",
    videoId: "c-hLXHfIDSs",
    name: "Abhishek K Agarwal",
    role: "Product Manager",
  },
  {
    id: "2",
    videoId: "c-hLXHfIDSs",
    name: "Krishna Pandey",
    role: "Engineering Lead",
  },
  {
    id: "3",
    videoId: "c-hLXHfIDSs",
    name: "Shubhankar",
    role: "Design Director",
  },
  {
    id: "4",
    videoId: "c-hLXHfIDSs",
    name: "Venkatesh",
    role: "CTO",
  },
  {
    id: "5",
    videoId: "c-hLXHfIDSs",
    name: "Praneet Ghosh",
    role: "Head of Marketing",
  },
  {
    id: "6",
    videoId: "c-hLXHfIDSs",
    name: "Rahul Sharma",
    role: "CEO",
  },
]

export default function VideoTestimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId: number
    let scrollPosition = 0
    const scrollSpeed = window.innerWidth < 768 ? 3 : 3

    const animate = () => {
      if (!isPaused && scrollContainer) {
        scrollPosition += scrollSpeed

        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 1
        }

        scrollContainer.scrollLeft = scrollPosition
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isPaused])

  return (
    <section className="relative w-full overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32 bg-white">
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 md:w-32 lg:w-64  z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 md:w-32 lg:w-64  z-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12 md:mb-16 lg:mb-20 relative z-10">
        <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-gray-200 bg-gray-50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wider">
              Client Testimonials
            </span>
          </div>

          <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">Hear from our clients</h2>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl text-balance px-4">
            Real stories from real people who transformed their business with our platform
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide px-4 sm:px-6 md:px-8"
          onMouseEnter={() => {
            setIsPaused(true)
            setIsHovered(true)
          }}
          onMouseLeave={() => {
            setIsPaused(false)
            setIsHovered(false)
          }}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <VideoCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

function VideoCard({ testimonial }: { testimonial: VideoTestimonial }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const thumbnailUrl = testimonial.thumbnail || `https://img.youtube.com/vi/${testimonial.videoId}/hqdefault.jpg`

  const handlePlay = () => {
    setIsPlaying(true)
  }

  return (
    <div
      className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 transition-all duration-700 group-hover:border-gray-300 group-hover:shadow-2xl group-hover:shadow-gray-900/10">
        {!isPlaying ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-[#880000] to-[#ff0d13]">
              <img
                src={thumbnailUrl || "/placeholder.svg"}
                alt={`${testimonial.name} testimonial`}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-90"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://img.youtube.com/vi/${testimonial.videoId}/default.jpg`
                }}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center group/play z-10"
              aria-label={`Play video from ${testimonial.name}`}
            >
              <div
                className={`
                relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/95 backdrop-blur-xl 
                flex items-center justify-center 
                transition-all duration-500 ease-out
                group-hover/play:scale-110 group-hover/play:bg-white
                shadow-lg shadow-black/20
                ${isHovered ? "scale-105" : "scale-100"}
              `}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black ml-1" fill="currentColor" />

                <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-20" />
              </div>
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 z-10">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl leading-tight text-balance">
                  {testimonial.name}
                </h3>
                {testimonial.role && <p className="text-white/70 text-xs sm:text-sm font-medium">{testimonial.role}</p>}
              </div>
            </div>

            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
          </>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${testimonial.videoId}?autoplay=1`}
            title={`${testimonial.name} testimonial`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  )
}
