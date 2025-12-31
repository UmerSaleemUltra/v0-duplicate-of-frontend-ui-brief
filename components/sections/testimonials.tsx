"use client"

import * as React from "react"
import { Star, BadgeCheck, Quote, Sparkles } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────────
   Types & Data
────────────────────────────────────────────────────────────────────────────── */
type Source = "google" | "trustpilot"

type Review = {
  id: string
  name: string
  company: string
  text: string
  rating: 1 | 2 | 3 | 4 | 5
  source: Source
  verified?: boolean
  avatarUrl?: string
}

const REVIEWS: Review[] = [
  {
    id: "1",
    name: "Kargoas",
    company: "US Business Owner",
    text: "It was wonderful working with the team. Process was super smooth and team guided us briefly throughout the process. Would surely be recommending it to my friends and family.",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "2",
    name: "Mehboob Meghani",
    company: "US Business Owner",
    text: "Awesome service and I would highly recommend this to everyone! Their communication and guidance is the best and work is according to the timeline committed. What's best is their after sales service, they don't abandon you if you face issues or need guidance after the work is finished. I would rate them 10/10.",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "3",
    name: "Waqas Ahmed",
    company: "Missouri LLC",
    text: "My experience was really good regarding LLC Registration in Missouri State. Their communication personnel was really good and overall I'm satisfied with the operations.",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "4",
    name: "Abdullah Khan",
    company: "Texas C-Corporation",
    text: "The team was accommodating in answering all of my queries regarding C-Corporation. I registered my Corporation through them in Texas, and the process was smooth and fast. I would recommend them to anyone registering their company in the US.",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "5",
    name: "Ramsha Khan",
    company: "Wyoming LLC",
    text: "It was a pleasant experience working with Buzz team. They have completed my process professionally and swiftly in Wyoming. I am very satisfied with their services. Highly recommended from my end.",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "6",
    name: "Mustufa",
    company: "US Business Owner",
    text: "Buzz Filing made everything so easy for me. I got my U.S. company set up without any tension. Their team guided me step by step, and I didn't have to worry about anything. Highly recommend!",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "7",
    name: "Malik Kamal Akbar",
    company: "US LLC & ITIN",
    text: "Great service, on time delivery, excellent customer service. Buzz Filing helped me get USA LLC Registration, EIN, Business Bank Accounts, and ITIN. Everything was delivered on time, their service is great, they're really good at what they do. Especially, their customer service is great.",
    rating: 5,
    verified: true,
    source: "trustpilot",
  },
  {
    id: "8",
    name: "Usman Ishrat Rana",
    company: "US Business Owner",
    text: "Great and trusted service!! Highly recommended.",
    rating: 5,
    verified: true,
    source: "google",
  },
]

/* ──────────────────────────────────────────────────────────────────────────────
   Utils
────────────────────────────────────────────────────────────────────────────── */
function loop<T>(arr: T[], times = 2) {
  return Array(times)
    .fill(null)
    .flatMap(() => arr)
}

function splitRows<T>(arr: T[]) {
  const mid = Math.ceil(arr.length / 2)
  return [arr.slice(0, mid), arr.slice(mid)]
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ""
  const b = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (a + b).toUpperCase()
}

/* ──────────────────────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────────────────────── */
export default function TestimonialMarquee2Rows() {
  // two rows, each duplicated for seamless marquee
  const [rowA, rowB] = React.useMemo(() => splitRows(REVIEWS), [])
  const itemsA = React.useMemo(() => loop(rowA, 2), [rowA])
  const itemsB = React.useMemo(() => loop(rowB, 2), [rowB])

  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-white">
      {/* Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs sm:text-sm bg-white border-black/10 shadow-sm text-black font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          500+ Happy Founders
        </div>
        <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4 mt-4">What Our Clients Say</h2>
        <p className="mt-2 text-sm sm:text-base text-black/80 max-w-2xl mx-auto">
          Reviews from <strong>Google</strong> and <strong>Trustpilot</strong>, verified by our team.
        </p>
      </div>

      {/* Two marquee rows */}
      <div className="relative w-full overflow-hidden group">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Row 1 (LTR) */}
        <div
          className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-7 will-change-transform animate-[marquee-ltr_42s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:snap-x motion-reduce:snap-mandatory"
          style={{ width: "max-content" }}
        >
          {itemsA.map((r, i) => (
            <ReviewCard key={`r1-${r.id}-${i}`} review={r} />
          ))}
        </div>

        {/* spacing between rows */}
        <div className="h-6 sm:h-7" />

        {/* Row 2 (RTL) */}
        <div
          className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-7 will-change-transform animate-[marquee-rtl_46s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:snap-x motion-reduce:snap-mandatory"
          style={{ width: "max-content" }}
        >
          {itemsB.map((r, i) => (
            <ReviewCard key={`r2-${r.id}-${i}`} review={r} />
          ))}
        </div>

        {/* Keyframes */}
        <style jsx global>{`
          @keyframes marquee-ltr {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-rtl {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────────
   Cards
────────────────────────────────────────────────────────────────────────────── */
function ReviewCard({ review }: { review: Review }) {
  const { name, company, text, rating, verified, avatarUrl, source } = review

  return (
    <article
      className={[
        "flex-none w-[260px] sm:w-[300px] md:w-[340px] lg:w-[360px]",
        "bg-white rounded-2xl border border-black/10",
        "shadow-sm hover:shadow-lg transition-shadow duration-300",
        "p-5 sm:p-6 flex flex-col",
        "motion-reduce:snap-center",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={name} url={avatarUrl} />
        <div className="min-w-0 text-left">
          <p className="truncate text-[15px] font-semibold text-gray-900">{name}</p>
          <p className="truncate text-xs text-gray-500">– {company}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {verified && <BadgeCheck className="h-4 w-4 text-emerald-600" title="Verified" />}
          <SourceBadge source={source} />
        </div>
      </div>

      {/* Body */}
      <p className="text-gray-700 leading-relaxed text-[14.5px]">
        <Quote className="mr-1 inline h-3.5 w-3.5 text-gray-400 translate-y-[-2px]" />
        {text}
      </p>

      {/* Footer: ratings vary by source */}
      <div className="mt-4">{source === "google" ? <Stars count={rating} /> : <TrustpilotBars count={rating} />}</div>
    </article>
  )
}

/* ──────────────────────────────────────────────────────────────────────────────
   Pieces
────────────────────────────────────────────────────────────────────────────── */
function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url || "/placeholder.svg"}
        alt={name}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
        loading="lazy"
      />
    )
  }
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-700 text-xs font-semibold ring-2 ring-white">
      {initialsFrom(name)}
    </div>
  )
}

/* Source badges with logos */
function SourceBadge({ source }: { source: Source }) {
  if (source === "google") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm">
        <GoogleLogo className="h-3.5 w-3.5" />
        Google
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 shadow-sm">
      <TrustpilotLogo className="h-3.5 w-3.5" />
      Trustpilot
    </span>
  )
}

/* Google star row */
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < count
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? "text-amber-400" : "text-gray-300"}`}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 2}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

/* Trustpilot 5 green bars */
function TrustpilotBars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < count
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? "text-amber-400" : "text-gray-300"}`}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 2}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────────
   Inline SVG Logos (no external assets required)
────────────────────────────────────────────────────────────────────────────── */
function GoogleLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.46c-.24 1.4-1.65 4.1-5.46 4.1-3.29 0-5.97-2.73-5.97-6.1s2.68-6.1 5.97-6.1c1.87 0 3.12.79 3.84 1.47l2.62-2.53C16.9 3.2 14.64 2.3 12 2.3 6.96 2.3 2.9 6.36 2.9 11.4S6.96 20.5 12 20.5c5.75 0 9.53-4.03 9.53-9.7 0-.65-.07-1.15-.16-1.65H12z"
      />
    </svg>
  )
}

function TrustpilotLogo(props: React.SVGProps<SVGSVGElement>) {
  // simplified star (Trustpilot-style)
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#00B67A"
        d="M12 2l2.39 6.96h7.31l-5.91 4.29 2.26 6.95L12 15.9l-6.05 4.3 2.26-6.95L2.3 8.96h7.31L12 2z"
      />
    </svg>
  )
}
