import type { Metadata } from "next"
import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"
import BlogClient from "./_blog-client"

export const metadata: Metadata = {
  title: "Business Formation Blog | LLC Guides & Expert Resources - Buzz Filing",
  description:
    "Expert insights on LLC formation, business registration, compliance, and entrepreneurship. Stay informed with guides, tips, and best practices for starting and managing your business successfully.",
  keywords: "LLC formation, business registration, startup guides, tax compliance, business formation tips, entrepreneur resources",
  authors: [{ name: "Buzz Filing Team" }],
  openGraph: {
    title: "Business Formation Blog | Expert Guides & Resources - Buzz Filing",
    description: "Expert insights on LLC formation, business registration, compliance, and entrepreneurship",
    type: "website",
    siteName: "Buzz Filing",
    images: [
      {
        url: "/images/buzz-filing-logo.png",
        width: 1200,
        height: 630,
        alt: "Buzz Filing Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Formation Blog - Buzz Filing",
    description: "Expert insights on LLC formation, business registration, and entrepreneurship",
    images: ["/images/buzz-filing-logo.png"],
  },
}

async function getBlogPosts() {
  try {
    const res = await fetch("https://www.buzzfiling.com/api/blog?limit=100", {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json()
    if (!json.success || !Array.isArray(json.data)) return []
    return json.data
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

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
            <BlogClient posts={posts} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
