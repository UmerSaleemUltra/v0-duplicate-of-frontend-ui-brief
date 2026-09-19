import type { MetadataRoute } from "next"
import { unstable_cache } from "next/cache"
import { getDatabase } from "@/config/database"

// Revalidate the sitemap every 60 seconds as a safety net.
// It is also immediately revalidated via the "sitemap" cache tag whenever
// a blog post is created, updated (published/unpublished), or deleted.
export const revalidate = 60

const BASE_URL = "https://www.buzzfiling.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]

  // Fetch published blog posts, tagged so revalidateTag("sitemap") instantly
  // reflects any create / publish / delete action in the sitemap URL list.
  const getPublishedBlogRoutes = unstable_cache(
    async (): Promise<MetadataRoute.Sitemap> => {
      try {
        const db = await getDatabase()
        const collection = db.collection("blog_posts")

        const publishedPosts = await collection
          .find({ status: "published" }, { projection: { slug: 1, updatedAt: 1, publishedAt: 1 } })
          .sort({ publishedAt: -1 })
          .toArray()

        return publishedPosts
          .filter((post) => post.slug)
          .map((post) => ({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }))
      } catch (error) {
        console.error("Error fetching blog posts for sitemap:", error)
        return []
      }
    },
    ["sitemap-blog-routes"],
    { tags: ["sitemap"], revalidate: 60 },
  )

  const blogRoutes = await getPublishedBlogRoutes()

  return [...staticRoutes, ...blogRoutes]
}
