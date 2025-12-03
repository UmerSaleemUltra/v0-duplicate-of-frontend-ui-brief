import type { Metadata } from "next"
import Link from "next/link"
import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { getDatabase } from "@/config/database"

export const metadata: Metadata = {
  title: "Blog - BuzzFiling | Business Formation Guides & Resources",
  description:
    "Expert guides and resources for starting your business. Learn about LLC formation, tax compliance, state guides, and more from BuzzFiling.",
  openGraph: {
    title: "Blog - BuzzFiling",
    description: "Expert guides and resources for starting your business",
    type: "website",
  },
}

async function getBlogPosts() {
  try {
    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const posts = await collection.find({ status: "published" }).sort({ createdAt: -1 }).toArray()

    return posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
    }))
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  const isNewPost = (createdAt: string | Date) => {
    const postDate = new Date(createdAt)
    const now = new Date()
    const daysDiff = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24)
    return daysDiff <= 7
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-16 sm:pt-18 md:pt-20">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
          {posts.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <p className="text-slate-500 text-sm sm:text-base">No blog posts available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post: any) => (
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
                    {/* NEW Badge */}
                    {isNewPost(post.createdAt) && (
                      <Badge className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#ff0d13] hover:bg-[#d81c20] text-white font-semibold px-2 py-0.5 sm:px-3 sm:py-1 text-xs">
                        NEW
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 md:p-6">
                    {/* Category Badge */}
                    {post.category && (
                      <Badge
                        variant="secondary"
                        className="mb-2 sm:mb-3 text-xs bg-[#880000] hover:bg-[#6b0000] text-white"
                      >
                        {post.category}
                      </Badge>
                    )}

                    {/* Title */}
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-[#ff0d13] transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Footer with Explore button and views */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="inline-flex items-center justify-center px-4 py-1.5 sm:px-6 sm:py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-full group-hover:bg-[#ff0d13] transition-colors">
                        Explore
                      </div>

                      {/* Views count */}
                      <div className="flex items-center gap-1 sm:gap-1.5 text-slate-600">
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm font-medium">{post.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
