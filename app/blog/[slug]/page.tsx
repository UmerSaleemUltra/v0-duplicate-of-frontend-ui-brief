import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"
import { parseMarkdown } from "@/lib/markdown"
import { getDatabase } from "@/config/database"

async function getBlogPost(slug: string) {
  try {
    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const post = await collection.findOne({ slug })

    // Convert MongoDB _id to string for serialization
    if (post) {
      return {
        ...post,
        _id: post._id.toString(),
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: "Post Not Found - Buzz Filing",
      description: "The blog post you're looking for doesn't exist. Browse our other articles on business formation and compliance.",
    }
  }

  return {
    title: `${post.title} | Buzz Filing Blog`,
    description: post.metaDescription || post.excerpt || post.title,
    keywords: post.tags?.join(", ") || "LLC formation, business registration, entrepreneurship",
    authors: [{ name: post.author || "Buzz Filing Team" }],
    category: post.category || "Business",
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || post.title,
      images: post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 630, alt: post.title }] : [{ url: "/images/buzz-filing-logo.png", width: 1200, height: 630, alt: post.title }],
      type: "article",
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author || "Buzz Filing Team"],
      tags: post.tags || [],
      siteName: "Buzz Filing",
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || post.title,
      images: post.featuredImage ? [post.featuredImage] : ["/images/buzz-filing-logo.png"],
      creator: "@BuzzFiling",
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post || post.status !== "published") {
    notFound()
  }

  const htmlContent = parseMarkdown(post.content)

  const publishDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background pt-16 sm:pt-18 md:pt-20">
        <article className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {/* Breadcrumb - hidden on mobile */}
          <nav className="mb-4 hidden items-center gap-2 text-sm text-muted-foreground sm:flex md:text-base">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px] md:max-w-xs">{post.title}</span>
          </nav>

          {/* Category Badge */}
          {post.category && (
            <div className="mb-4">
              <span className="inline-block rounded-full bg-[#d81c20] px-3 py-1 text-xs font-semibold text-white sm:px-4 sm:py-1.5 sm:text-sm">
                {post.category}
              </span>
            </div>
          )}

          <h1 className="mb-4 text-xl font-bold leading-tight tracking-tight text-foreground sm:mb-5 sm:text-2xl md:text-3xl lg:text-4xl">
            {post.title}
          </h1>

          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground md:text-base">
            <time dateTime={post.createdAt}>{publishDate}</time>
          </div>

          {post.excerpt && (
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground italic sm:mb-8 sm:text-base md:text-lg">
              {post.excerpt}
            </p>
          )}

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg shadow-lg md:mb-10 md:rounded-xl">
              <Image
                src={post.featuredImage || "/placeholder.svg"}
                alt={post.title}
                width={1200}
                height={675}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-sm max-w-none
              md:prose-base
              lg:prose-lg
              prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-lg prose-h1:mb-3 md:prose-h1:text-2xl lg:prose-h1:text-3xl
              prose-h2:text-base prose-h2:mb-2 md:prose-h2:text-xl lg:prose-h2:text-2xl
              prose-h3:text-sm prose-h3:mb-2 md:prose-h3:text-lg lg:prose-h3:text-xl
              prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
              prose-a:text-[#d81c20] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:pl-5 prose-ol:pl-5
              prose-li:text-foreground prose-li:marker:text-[#d81c20] prose-li:my-1
              prose-li:text-sm md:prose-li:text-base lg:prose-li:text-lg
              prose-blockquote:border-l-4 prose-blockquote:border-[#d81c20] prose-blockquote:pl-4
              prose-blockquote:italic prose-blockquote:text-muted-foreground
              prose-code:text-xs md:prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:p-3 md:prose-pre:p-4
              prose-img:rounded-lg prose-img:shadow-md prose-img:my-4 md:prose-img:my-6
              prose-hr:border-border prose-hr:my-6
              prose-table:text-sm md:prose-table:text-base
              prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:font-semibold
              prose-td:p-2 prose-td:border prose-td:border-border"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Back to Blog Button */}
          <div className="mt-8 border-t border-border pt-6 md:mt-10 md:pt-8">
            <Link
              href="/blog"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d81c20] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#b91518] sm:w-auto sm:text-base"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
