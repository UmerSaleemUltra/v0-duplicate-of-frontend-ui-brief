"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

const POSTS_PER_PAGE = 6

interface BlogPost {
  _id: string
  slug: string
  title: string
  excerpt?: string
  category?: string
  featuredImage?: string
  createdAt: string | Date
}

function isNewPost(createdAt: string | Date) {
  const postDate = new Date(createdAt)
  const now = new Date()
  const daysDiff = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24)
  return daysDiff <= 7
}

export default function BlogClient({ posts }: { posts: BlogPost[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)),
    )
  }, [posts, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE)

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handlePage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6 sm:mb-8 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:border-[#ff0d13] focus:ring-[#ff0d13] bg-white text-sm w-full"
          />
        </div>
        {search.trim() && (
          <p className="text-center text-slate-500 text-xs mt-2">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search.trim()}&rdquo;
          </p>
        )}
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <p className="text-slate-500 text-sm sm:text-base">No blog posts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {paginated.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-slate-300"
            >
              {/* Featured Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#880000] via-[#ff0d13] to-[#ff6b6f]">
                    <span className="text-white text-3xl sm:text-4xl md:text-5xl font-bold opacity-30">BF</span>
                  </div>
                )}
                {isNewPost(post.createdAt) && (
                  <Badge className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#ff0d13] hover:bg-[#d81c20] text-white font-semibold px-2 py-0.5 sm:px-3 sm:py-1 text-xs">
                    NEW
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 md:p-6">
                {post.category && (
                  <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs bg-[#880000] hover:bg-[#6b0000] text-white">
                    {post.category}
                  </Badge>
                )}
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-[#ff0d13] transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-center pt-3 sm:pt-4 border-t border-slate-100">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 sm:px-6 sm:py-2 bg-[#ff0d13] text-white text-xs sm:text-sm font-semibold rounded-full group-hover:bg-[#d81c20] transition-colors">
                    Explore
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-10">
          <button
            onClick={() => handlePage(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Previous page"
            className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            // Show first, last, current, and neighbours; collapse others with ellipsis
            const showPage =
              p === 1 || p === totalPages || Math.abs(p - safePage) <= 1
            const showEllipsisBefore = p === safePage - 2 && safePage - 2 > 1
            const showEllipsisAfter = p === safePage + 2 && safePage + 2 < totalPages

            if (!showPage && !showEllipsisBefore && !showEllipsisAfter) return null
            if (showEllipsisBefore || showEllipsisAfter) {
              return (
                <span key={`ellipsis-${p}`} className="px-1 text-slate-400 text-sm select-none">
                  &hellip;
                </span>
              )
            }
            return (
              <button
                key={p}
                onClick={() => handlePage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? "page" : undefined}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-medium transition-colors ${
                  p === safePage
                    ? "bg-[#ff0d13] text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            )
          })}

          <button
            onClick={() => handlePage(safePage + 1)}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page info */}
      {totalPages > 1 && (
        <p className="text-center text-slate-400 text-xs mt-3">
          Page {safePage} of {totalPages} &mdash; {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </>
  )
}
