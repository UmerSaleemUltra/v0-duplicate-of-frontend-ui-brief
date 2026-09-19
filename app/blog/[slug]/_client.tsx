"use client"

import Link from "next/link"
import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatContent(content: string) {
  return content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
}

export default function BlogPostPageClient({ post }: { post: any }) {
  const formattedContent = formatContent(post.content)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white mt-[20px]">
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-slate-600 hover:text-[#ff0d13] mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{post.category}</Badge>
              {post.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{post.title}</h1>

            <div className="flex items-center gap-6 text-sm text-slate-600 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>5 min read</span>
              </div>
            </div>

            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {post.featuredImage && (
            <div className="relative aspect-video overflow-hidden rounded-lg mb-8">
              <img
                src={post.featuredImage || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {post.excerpt && (
            <div className="text-xl text-slate-600 mb-8 pb-8 border-b border-slate-200 italic">{post.excerpt}</div>
          )}

          <div
            className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-[#ff0d13] prose-strong:text-slate-900 prose-li:text-slate-700"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${formattedContent}</p>` }}
          />

          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Share this article</h3>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert("Link copied to clipboard!")
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
