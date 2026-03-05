"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function BlogManagement() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadPosts()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/blog/categories")
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/blog")
      const data = await response.json()

      if (data.success) {
        setPosts(data.data)
      } else {
        toast.error("Failed to load blog posts")
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error("Error loading blog posts")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Blog post deleted successfully")
        loadPosts()
      } else {
        toast.error(data.error || "Failed to delete blog post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Error deleting blog post")
    }
  }

  const isNewPost = (createdAt: string) => {
    const postDate = new Date(createdAt)
    const now = new Date()
    const daysDiff = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24)
    return daysDiff <= 7
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-[#f5f5f7] rounded-xl w-52"></div>
            <div className="h-4 bg-[#f5f5f7] rounded-lg w-64"></div>
          </div>
          <div className="h-10 bg-[#f5f5f7] rounded-full w-32"></div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-[#f5f5f7] rounded-xl"></div>
          <div className="h-10 bg-[#f5f5f7] rounded-xl w-36"></div>
          <div className="h-10 bg-[#f5f5f7] rounded-xl w-44"></div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-[#f5f5f7]">
              <div className="h-44 bg-[#e8e8ed]"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[#e8e8ed] rounded-lg w-20"></div>
                <div className="h-5 bg-[#e8e8ed] rounded-lg w-full"></div>
                <div className="h-4 bg-[#e8e8ed] rounded-lg w-3/4"></div>
                <div className="flex gap-2 pt-3">
                  <div className="h-8 bg-[#e8e8ed] rounded-xl flex-1"></div>
                  <div className="h-8 bg-[#e8e8ed] rounded-xl flex-1"></div>
                  <div className="h-8 w-8 bg-[#e8e8ed] rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Blog</h1>
          <p className="text-[15px] text-[#6e6e73] mt-1">Create and manage your blog posts</p>
        </div>
        <Button
          asChild
          className="rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium px-5 h-10 shadow-none transition-colors"
        >
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] focus-visible:ring-[#0071e3] focus-visible:border-[#0071e3] placeholder:text-[#86868b] text-[#1d1d1f]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-[#1d1d1f] focus:ring-[#0071e3]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#d2d2d7]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-[#1d1d1f] focus:ring-[#0071e3]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#d2d2d7]">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[17px] font-medium text-[#1d1d1f]">No posts found</p>
          <p className="text-[15px] text-[#6e6e73] mt-1 mb-6">Get started by creating your first blog post.</p>
          <Button
            asChild
            className="rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium px-5 h-10 shadow-none"
          >
            <Link href="/admin/blog/new">Create Post</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className="group bg-white rounded-2xl overflow-hidden border border-[#d2d2d7] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              {/* Featured Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f5f7]">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#e8e8ed]">
                    <span className="text-[#86868b] text-4xl font-semibold tracking-tight select-none">Blog</span>
                  </div>
                )}
                {/* Status pill */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      post.status === "published"
                        ? "bg-[#d1fae5] text-[#065f46]"
                        : "bg-[#f5f5f7] text-[#6e6e73]"
                    }`}
                  >
                    {post.status}
                  </span>
                  {isNewPost(post.createdAt) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0071e3] text-white">
                      New
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-[12px] font-medium text-[#0071e3] mb-2 uppercase tracking-wide">{post.category}</p>
                <h3 className="text-[15px] font-semibold text-[#1d1d1f] line-clamp-2 leading-snug mb-1">{post.title}</h3>
                <p className="text-[12px] text-[#86868b]">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f5f5f7]">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="flex-1 h-8 rounded-xl text-[#0071e3] hover:bg-[#f5f5f7] text-[13px] font-medium"
                  >
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="flex-1 h-8 rounded-xl text-[#1d1d1f] hover:bg-[#f5f5f7] text-[13px] font-medium"
                  >
                    <Link href={`/admin/blog/${post._id}`}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post._id)}
                    className="h-8 w-8 rounded-xl text-[#ff3b30] hover:bg-[#fff1f0] p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
