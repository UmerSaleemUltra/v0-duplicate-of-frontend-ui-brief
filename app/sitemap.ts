import type { MetadataRoute } from "next"
import { getDatabase } from "@/config/database"

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

  let blogRoutes: MetadataRoute.Sitemap = []

  try {
    const db = await getDatabase()
    const collection = db.collection("blog_posts")

    const publishedPosts = await collection
      .find({ status: "published" }, { projection: { slug: 1, updatedAt: 1, publishedAt: 1 } })
      .sort({ publishedAt: -1 })
      .toArray()

    blogRoutes = publishedPosts
      .filter((post) => post.slug)
      .map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error)
  }

  return [...staticRoutes, ...blogRoutes]
}
